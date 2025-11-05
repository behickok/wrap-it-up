// Authentication utilities for password hashing and session management
import type { User, Session } from './types';

/**
 * Hash a password using Web Crypto API (PBKDF2)
 * Compatible with Cloudflare Workers
 */
export async function hashPassword(password: string): Promise<string> {
	// Generate a random salt
	const salt = crypto.getRandomValues(new Uint8Array(16));

	// Encode password to bytes
	const encoder = new TextEncoder();
	const passwordBytes = encoder.encode(password);

	// Import password as key material
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		passwordBytes,
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	// Derive key using PBKDF2
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		keyMaterial,
		256
	);

	// Convert to base64 for storage
	const hashArray = new Uint8Array(derivedBits);
	const saltBase64 = btoa(String.fromCharCode(...salt));
	const hashBase64 = btoa(String.fromCharCode(...hashArray));

	// Store salt and hash together
	return `${saltBase64}:${hashBase64}`;
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	try {
		// Split salt and hash
		const [saltBase64, hashBase64] = storedHash.split(':');
		if (!saltBase64 || !hashBase64) return false;

		// Decode salt
		const saltStr = atob(saltBase64);
		const salt = new Uint8Array(saltStr.length);
		for (let i = 0; i < saltStr.length; i++) {
			salt[i] = saltStr.charCodeAt(i);
		}

		// Encode password to bytes
		const encoder = new TextEncoder();
		const passwordBytes = encoder.encode(password);

		// Import password as key material
		const keyMaterial = await crypto.subtle.importKey(
			'raw',
			passwordBytes,
			{ name: 'PBKDF2' },
			false,
			['deriveBits']
		);

		// Derive key using same parameters
		const derivedBits = await crypto.subtle.deriveBits(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: 100000,
				hash: 'SHA-256'
			},
			keyMaterial,
			256
		);

		// Convert to base64 and compare
		const hashArray = new Uint8Array(derivedBits);
		const newHashBase64 = btoa(String.fromCharCode(...hashArray));

		return newHashBase64 === hashBase64;
	} catch (error) {
		console.error('Password verification error:', error);
		return false;
	}
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
	const randomBytes = crypto.getRandomValues(new Uint8Array(32));
	return btoa(String.fromCharCode(...randomBytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

/**
 * Create a new session for a user
 * @param userId - The user's ID
 * @param daysValid - Number of days the session should be valid (default 7)
 * @returns Session object
 */
export function createSession(userId: number, daysValid: number = 7): Session {
	const sessionId = generateSessionId();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + daysValid * 24 * 60 * 60 * 1000);

	return {
		id: sessionId,
		user_id: userId,
		expires_at: expiresAt.toISOString(),
		created_at: now.toISOString()
	};
}

/**
 * Check if a session is valid (not expired)
 */
export function isSessionValid(session: Session): boolean {
	const now = new Date();
	const expiresAt = new Date(session.expires_at);
	return expiresAt > now;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: at least 8 characters, one uppercase, one lowercase, one number
 */
export function isValidPassword(password: string): boolean {
	if (password.length < 8) return false;
	if (!/[a-z]/.test(password)) return false;
	if (!/[A-Z]/.test(password)) return false;
	if (!/[0-9]/.test(password)) return false;
	return true;
}

/**
 * Validate username format
 * Requirements: 3-20 characters, alphanumeric and underscores only
 */
export function isValidUsername(username: string): boolean {
	const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
	return usernameRegex.test(username);
}

/**
 * Get user from database by email
 */
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
	const result = await db
		.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1')
		.bind(email)
		.first<User>();

	return result || null;
}

/**
 * Get user from database by username
 */
export async function getUserByUsername(db: D1Database, username: string): Promise<User | null> {
	const result = await db
		.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1')
		.bind(username)
		.first<User>();

	return result || null;
}

/**
 * Get user from database by ID
 */
export async function getUserById(db: D1Database, userId: number): Promise<User | null> {
	const result = await db
		.prepare('SELECT id, email, username, is_active, last_login, created_at, updated_at FROM users WHERE id = ? AND is_active = 1')
		.bind(userId)
		.first<User>();

	return result || null;
}

/**
 * Get session from database
 */
export async function getSession(db: D1Database, sessionId: string): Promise<Session | null> {
	const result = await db
		.prepare('SELECT * FROM sessions WHERE id = ?')
		.bind(sessionId)
		.first<Session>();

	return result || null;
}

/**
 * Delete a session from database
 */
export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
	await db
		.prepare('DELETE FROM sessions WHERE id = ?')
		.bind(sessionId)
		.run();
}

/**
 * Delete all expired sessions
 */
export async function cleanupExpiredSessions(db: D1Database): Promise<void> {
	const now = new Date().toISOString();
	await db
		.prepare('DELETE FROM sessions WHERE expires_at < ?')
		.bind(now)
		.run();
}
