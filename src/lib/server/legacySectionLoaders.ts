const DEFAULT_EMPTY_OBJECT = {};

export const LEGACY_SECTION_SLUGS = [
	'personal',
	'credentials',
	'contacts',
	'legal',
	'documents',
	'final-days',
	'after-death',
	'funeral',
	'obituary',
	'conclusion',
	'financial',
	'insurance',
	'employment',
	'medical',
	'physicians',
	'residence',
	'vehicles',
	'family',
	'pets',
	'property',
	'marriage_license',
	'prenup',
	'joint_accounts',
	'name_change',
	'venue',
	'vendors',
	'guest_list',
	'registry',
	'home_setup'
] as const;

export type LegacySectionSlug = (typeof LEGACY_SECTION_SLUGS)[number];

export async function loadLegacySectionData(
	db: D1Database,
	userId: number,
	slug: LegacySectionSlug
): Promise<any> {
	switch (slug) {
		case 'personal': {
			const record = await db
				.prepare('SELECT * FROM personal_info WHERE user_id = ? AND person_type = ?')
				.bind(userId, 'self')
				.first();
			return record ?? {};
		}
		case 'credentials': {
			const result = await db.prepare('SELECT * FROM credentials WHERE user_id = ?').bind(userId).all();
			return result?.results || [];
		}
		case 'contacts': {
			const result = await db.prepare('SELECT * FROM key_contacts WHERE user_id = ?').bind(userId).all();
			return result?.results || [];
		}
		case 'legal': {
			const result = await db.prepare('SELECT * FROM legal_documents WHERE user_id = ?').bind(userId).all();
			return result?.results || [];
		}
		case 'documents': {
			const result = await db.prepare('SELECT * FROM documents WHERE user_id = ?').bind(userId).all();
			return result?.results || [];
		}
		case 'final-days': {
			const record = await db.prepare('SELECT * FROM final_days WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		case 'after-death': {
			const record = await db.prepare('SELECT * FROM after_death WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		case 'funeral': {
			const record = await db.prepare('SELECT * FROM funeral WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		case 'obituary': {
			const record = await db.prepare('SELECT * FROM obituary WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		case 'conclusion': {
			const record = await db.prepare('SELECT * FROM conclusion WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		case 'financial': {
			const result = await db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').bind(userId).all();
			return result?.results || [];
		}
		case 'insurance': {
			const result = await db.prepare('SELECT * FROM insurance WHERE user_id = ?').bind(userId).all();
			return result?.results || [];
		}
		case 'employment': {
			const result = await db.prepare('SELECT * FROM employment WHERE user_id = ?').bind(userId).all();
			return result?.results || [];
		}
		case 'medical': {
			const [medicalInfo, physicians] = await Promise.all([
				db.prepare('SELECT * FROM medical_info WHERE user_id = ?').bind(userId).first(),
				db.prepare('SELECT * FROM physicians WHERE user_id = ? ORDER BY id ASC').bind(userId).all()
			]);
			return {
				...(medicalInfo ?? {}),
				physicians: physicians?.results || []
			};
		}
		case 'physicians': {
			const result = await db.prepare('SELECT * FROM physicians WHERE user_id = ? ORDER BY id ASC').bind(userId).all();
			return result?.results || [];
		}
		case 'residence': {
			const record = await db.prepare('SELECT * FROM primary_residence WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		case 'vehicles': {
			const result = await db.prepare('SELECT * FROM vehicles WHERE user_id = ?').bind(userId).all();
			return result?.results || [];
		}
		case 'family': {
			const [members, history] = await Promise.all([
				db.prepare(
					`SELECT fm.id, fm.user_id, fm.relationship, fm.personal_info_id,
						pi.legal_name, pi.date_of_birth, pi.mobile_phone, pi.email, pi.address, pi.occupation
					 FROM family_members fm
					 LEFT JOIN personal_info pi ON pi.id = fm.personal_info_id
					 WHERE fm.user_id = ?
					 ORDER BY fm.relationship, pi.legal_name`
				)
					.bind(userId)
					.all(),
				db.prepare('SELECT * FROM family_history WHERE user_id = ?').bind(userId).first()
			]);
			return {
				members: members?.results || [],
				history: history ?? {}
			};
		}
		case 'pets': {
			const result = await db.prepare('SELECT * FROM pets WHERE user_id = ?').bind(userId).all();
			return result?.results || [];
		}
		case 'property': {
			return [];
		}
		case 'marriage_license': {
			const record = await db.prepare('SELECT * FROM wedding_marriage_license WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		case 'prenup': {
			const record = await db.prepare('SELECT * FROM wedding_prenup WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		case 'joint_accounts': {
			const record = await db.prepare('SELECT * FROM wedding_joint_finances WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		case 'name_change': {
			const record = await db.prepare('SELECT * FROM wedding_name_change WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		case 'venue': {
			const record = await db.prepare('SELECT * FROM wedding_venue WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		case 'vendors': {
			const result = await db
				.prepare('SELECT * FROM wedding_vendors WHERE user_id = ? ORDER BY vendor_type, business_name')
				.bind(userId)
				.all();
			return result?.results || [];
		}
		case 'guest_list': {
			const result = await db
				.prepare('SELECT * FROM wedding_guest_list WHERE user_id = ? ORDER BY guest_name')
				.bind(userId)
				.all();
			return result?.results || [];
		}
		case 'registry': {
			const result = await db
				.prepare('SELECT * FROM wedding_registry_items WHERE user_id = ? ORDER BY priority DESC, item_name')
				.bind(userId)
				.all();
			return result?.results || [];
		}
		case 'home_setup': {
			const record = await db.prepare('SELECT * FROM wedding_home_setup WHERE user_id = ?').bind(userId).first();
			return record ?? {};
		}
		default:
			return DEFAULT_EMPTY_OBJECT;
	}
}
