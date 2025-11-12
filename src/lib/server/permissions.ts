/**
 * Role-based access control utilities
 * Server-side permission checking and role management
 */

import type {
	UserWithRoles,
	RoleName,
	PermissionName,
	Role,
	Permission,
	CoachClient,
	SectionShare
} from '$lib/types';

/**
 * Fetch user with roles and permissions
 */
export async function getUserWithRoles(
	db: D1Database,
	userId: number
): Promise<UserWithRoles | null> {
	// Fetch user
	const user = await db
		.prepare('SELECT * FROM users WHERE id = ?')
		.bind(userId)
		.first<UserWithRoles>();

	if (!user) return null;

	// Fetch user's roles
	const rolesResult = await db
		.prepare(
			`
			SELECT r.*
			FROM roles r
			JOIN user_roles ur ON r.id = ur.role_id
			WHERE ur.user_id = ? AND r.is_active = 1
		`
		)
		.bind(userId)
		.all<Role>();

	user.roles = rolesResult.results || [];

	// Fetch permissions for user's roles
	const permissionsResult = await db
		.prepare(
			`
			SELECT DISTINCT p.*
			FROM permissions p
			JOIN role_permissions rp ON p.id = rp.permission_id
			JOIN user_roles ur ON rp.role_id = ur.role_id
			WHERE ur.user_id = ?
		`
		)
		.bind(userId)
		.all<Permission>();

	user.permissions = permissionsResult.results || [];

	return user;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: UserWithRoles, roleName: RoleName): boolean {
	return user.roles.some((role) => role.name === roleName);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: UserWithRoles, roleNames: RoleName[]): boolean {
	return user.roles.some((role) => roleNames.includes(role.name));
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: UserWithRoles, permissionName: PermissionName): boolean {
	return user.permissions.some((perm) => perm.name === permissionName);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
	user: UserWithRoles,
	permissionNames: PermissionName[]
): boolean {
	return user.permissions.some((perm) => permissionNames.includes(perm.name));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
	user: UserWithRoles,
	permissionNames: PermissionName[]
): boolean {
	return permissionNames.every((name) => hasPermission(user, name));
}

/**
 * Check if user can edit a journey
 */
export async function canEditJourney(
	db: D1Database,
	user: UserWithRoles,
	journeyId: number
): Promise<boolean> {
	// Admins can edit any journey
	if (hasPermission(user, 'journey.edit_any')) {
		return true;
	}

	// Check if user created this journey
	if (hasPermission(user, 'journey.edit_own')) {
		const creator = await db
			.prepare(
				`
				SELECT creator_user_id
				FROM journey_creators
				WHERE journey_id = ?
			`
			)
			.bind(journeyId)
			.first<{ creator_user_id: number }>();

		return creator?.creator_user_id === user.id;
	}

	return false;
}

/**
 * Check if user can delete a journey
 */
export async function canDeleteJourney(
	db: D1Database,
	user: UserWithRoles,
	journeyId: number
): Promise<boolean> {
	// Admins can delete any journey
	if (hasPermission(user, 'journey.delete_any')) {
		return true;
	}

	// Check if user created this journey
	if (hasPermission(user, 'journey.delete_own')) {
		const creator = await db
			.prepare(
				`
				SELECT creator_user_id
				FROM journey_creators
				WHERE journey_id = ?
			`
			)
			.bind(journeyId)
			.first<{ creator_user_id: number }>();

		return creator?.creator_user_id === user.id;
	}

	return false;
}

/**
 * Check if user can view analytics for a journey
 */
export async function canViewJourneyAnalytics(
	db: D1Database,
	user: UserWithRoles,
	journeyId: number
): Promise<boolean> {
	// Admins can view any analytics
	if (hasPermission(user, 'analytics.view_all')) {
		return true;
	}

	// Check if user created this journey
	if (hasPermission(user, 'analytics.view_own')) {
		const creator = await db
			.prepare(
				`
				SELECT creator_user_id
				FROM journey_creators
				WHERE journey_id = ?
			`
			)
			.bind(journeyId)
			.first<{ creator_user_id: number }>();

		return creator?.creator_user_id === user.id;
	}

	return false;
}

/**
 * Check if user (coach) can access another user's data
 */
export async function canAccessClientData(
	db: D1Database,
	coachUserId: number,
	clientUserId: number,
	sectionId?: number
): Promise<{ canAccess: boolean; accessLevel?: 'view' | 'edit' | 'full' }> {
	// Check for active coach-client relationship
	const relationship = await db
		.prepare(
			`
			SELECT cc.*
			FROM coach_clients cc
			JOIN coaches c ON cc.coach_id = c.id
			WHERE c.user_id = ?
			  AND cc.client_user_id = ?
			  AND cc.status = 'active'
			  AND (cc.journey_id IS NULL OR cc.journey_id IN (
				  SELECT journey_id
				  FROM journey_sections
				  WHERE section_id = ?
			  ))
			LIMIT 1
		`
		)
		.bind(coachUserId, clientUserId, sectionId || 0)
		.first<CoachClient>();

	if (relationship) {
		return {
			canAccess: true,
			accessLevel: relationship.access_level
		};
	}

	// Check for section-level sharing
	if (sectionId) {
		const share = await db
			.prepare(
				`
				SELECT access_type
				FROM section_shares
				WHERE user_id = ?
				  AND shared_with_user_id = ?
				  AND section_id = ?
				  AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
			`
			)
			.bind(clientUserId, coachUserId, sectionId)
			.first<SectionShare>();

		if (share) {
			return {
				canAccess: true,
				accessLevel: share.access_type === 'edit' ? 'edit' : 'view'
			};
		}
	}

	return { canAccess: false };
}

/**
 * Log coach access to client data (audit trail)
 */
export async function logCoachAccess(
	db: D1Database,
	coachClientId: number,
	action: 'viewed' | 'edited' | 'exported',
	sectionId?: number,
	details?: Record<string, any>
): Promise<void> {
	await db
		.prepare(
			`
			INSERT INTO coach_access_log (coach_client_id, action, section_id, details)
			VALUES (?, ?, ?, ?)
		`
		)
		.bind(
			coachClientId,
			action,
			sectionId || null,
			details ? JSON.stringify(details) : null
		)
		.run();
}

/**
 * Grant a role to a user
 */
export async function grantRole(
	db: D1Database,
	userId: number,
	roleName: RoleName,
	grantedBy: number
): Promise<void> {
	const role = await db
		.prepare('SELECT id FROM roles WHERE name = ?')
		.bind(roleName)
		.first<{ id: number }>();

	if (!role) {
		throw new Error(`Role ${roleName} not found`);
	}

	await db
		.prepare(
			`
			INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_by)
			VALUES (?, ?, ?)
		`
		)
		.bind(userId, role.id, grantedBy)
		.run();
}

/**
 * Revoke a role from a user
 */
export async function revokeRole(
	db: D1Database,
	userId: number,
	roleName: RoleName
): Promise<void> {
	const role = await db
		.prepare('SELECT id FROM roles WHERE name = ?')
		.bind(roleName)
		.first<{ id: number }>();

	if (!role) {
		throw new Error(`Role ${roleName} not found`);
	}

	await db
		.prepare(
			`
			DELETE FROM user_roles
			WHERE user_id = ? AND role_id = ?
		`
		)
		.bind(userId, role.id)
		.run();
}

/**
 * Check if user owns the data (for data.view_own, data.edit_own permissions)
 */
export function canAccessOwnData(user: UserWithRoles, dataUserId: number): boolean {
	return user.id === dataUserId;
}

/**
 * Middleware function to require specific permission
 */
export function requirePermission(permissionName: PermissionName) {
	return (user: UserWithRoles | null) => {
		if (!user) {
			throw new Error('Authentication required');
		}
		if (!hasPermission(user, permissionName)) {
			throw new Error(`Permission denied: ${permissionName}`);
		}
		return true;
	};
}

/**
 * Middleware function to require specific role
 */
export function requireRole(roleName: RoleName) {
	return (user: UserWithRoles | null) => {
		if (!user) {
			throw new Error('Authentication required');
		}
		if (!hasRole(user, roleName)) {
			throw new Error(`Role required: ${roleName}`);
		}
		return true;
	};
}

/**
 * Middleware to require any of the specified roles
 */
export function requireAnyRole(roleNames: RoleName[]) {
	return (user: UserWithRoles | null) => {
		if (!user) {
			throw new Error('Authentication required');
		}
		if (!hasAnyRole(user, roleNames)) {
			throw new Error(`One of these roles required: ${roleNames.join(', ')}`);
		}
		return true;
	};
}
