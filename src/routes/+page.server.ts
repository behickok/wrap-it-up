import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { calculateSectionScore } from '$lib/readinessScore';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const user = locals.user;

	if (!user) {
		throw redirect(302, '/login');
	}

	const db = platform?.env?.DB;

	if (!db) {
		return {
			sectionData: {},
			userId: user.id
		};
	}

	try {
		const userId = user.id;

				const [
					personalResult,
					credentialsResult,
					contactsResult,
					legalResult,
					documentsResult,
					finalDaysResult,
					afterDeathResult,
					funeralResult,
					obituaryResult,
					conclusionResult,
					bankAccountsResult,
					insuranceResult,
					employmentResult,
					medicalResult,
					physiciansResult,
					residenceResult,
					vehiclesResult,
					familyMembersResult,
					familyHistoryResult
				] = await Promise.all([
					db.prepare(
						'SELECT * FROM personal_info WHERE user_id = ? AND person_type = ?'
					).bind(userId, 'self').first(),
					db.prepare('SELECT * FROM credentials WHERE user_id = ?').bind(userId).all(),
					db.prepare('SELECT * FROM key_contacts WHERE user_id = ?').bind(userId).all(),
				db.prepare('SELECT * FROM legal_documents WHERE user_id = ?').bind(userId).all(),
					db.prepare('SELECT * FROM documents WHERE user_id = ?').bind(userId).all(),
				db.prepare('SELECT * FROM final_days WHERE user_id = ?').bind(userId).first(),
				db.prepare('SELECT * FROM after_death WHERE user_id = ?').bind(userId).first(),
				db.prepare('SELECT * FROM funeral WHERE user_id = ?').bind(userId).first(),
				db.prepare('SELECT * FROM obituary WHERE user_id = ?').bind(userId).first(),
				db.prepare('SELECT * FROM conclusion WHERE user_id = ?').bind(userId).first(),
				db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').bind(userId).all(),
				db.prepare('SELECT * FROM insurance WHERE user_id = ?').bind(userId).all(),
					db.prepare('SELECT * FROM employment WHERE user_id = ?').bind(userId).all(),
					db.prepare('SELECT * FROM medical_info WHERE user_id = ?').bind(userId).first(),
					db.prepare('SELECT * FROM physicians WHERE user_id = ? ORDER BY id ASC').bind(userId).all(),
					db.prepare('SELECT * FROM primary_residence WHERE user_id = ?').bind(userId).first(),
					db.prepare('SELECT * FROM vehicles WHERE user_id = ?').bind(userId).all(),
					db.prepare(
						`SELECT fm.id, fm.user_id, fm.relationship, fm.personal_info_id,
							pi.legal_name, pi.date_of_birth, pi.mobile_phone, pi.email, pi.address, pi.occupation
						FROM family_members fm
						LEFT JOIN personal_info pi ON pi.id = fm.personal_info_id
						WHERE fm.user_id = ?
						ORDER BY fm.relationship, pi.legal_name`
						).bind(userId).all(),
					db.prepare(
						`SELECT * FROM family_history WHERE user_id = ?`
					).bind(userId).first()
				]);

			const physicians = physiciansResult?.results || [];
			const primaryPhysician = physicians[0];
			const familyMembers = familyMembersResult?.results || [];
			const familyHistory = familyHistoryResult || null;

			console.log('[Dashboard load] conclusion data', {
				userId,
				hasConclusion: Boolean(conclusionResult)
			});

			console.log('[Dashboard load] medical data lookup', {
				userId,
				hasMedical: Boolean(medicalResult),
				physiciansCount: physicians.length
			});

		return {
			sectionData: {
				personal: personalResult || {},
				credentials: credentialsResult?.results || [],
				contacts: contactsResult?.results || [],
				legal: legalResult?.results || [],
					documents: documentsResult?.results || [],
						'final-days': finalDaysResult || {},
						'after-death': afterDeathResult || {},
						funeral: funeralResult || {},
						obituary: obituaryResult || {},
						conclusion: conclusionResult || {},
						financial: bankAccountsResult?.results || [],
						insurance: insuranceResult?.results || [],
							employment: employmentResult?.results || [],
							residence: residenceResult || {},
							property: vehiclesResult?.results || [],
							family: {
								members: familyMembers,
								history: familyHistory || {}
							},
							medical: {
								...(medicalResult || {}),
								...(primaryPhysician
								? {
										physician_name: primaryPhysician.name,
										specialty: primaryPhysician.specialty,
										physician_phone: primaryPhysician.phone,
										physician_address: primaryPhysician.address
									}
								: {}),
							physicians
						}
			},
			userId
		};
	} catch (error) {
		console.error('Error loading dashboard data:', error);
		return {
			sectionData: {},
			userId: user.id
		};
	}
};

function getUserId(locals: App.Locals) {
	return locals.user?.id ?? null;
}

function getDb(platform: Readonly<App.Platform> | undefined) {
	return platform?.env?.DB;
}

async function updateSectionCompletion(db: any, userId: number, section: string, data: any) {
	const score = calculateSectionScore(section as any, data);

	await db.prepare(`
		INSERT INTO section_completion (user_id, section_name, score, last_updated)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(user_id, section_name) DO UPDATE SET
			score = excluded.score,
			last_updated = CURRENT_TIMESTAMP
	`).bind(userId, section, score).run();
}

export const actions: Actions = {
	addCredential: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			await db.prepare(`
				INSERT INTO credentials (
					user_id, site_name, web_address, username, password, category, other_info
				) VALUES (?, ?, ?, ?, ?, ?, ?)
			`).bind(
				userId,
				data.site_name || '',
				data.web_address || '',
				data.username || '',
				data.password || '',
				data.category || 'other',
				data.other_info || ''
			).run();

			const credentialsResult = await db.prepare(
				'SELECT * FROM credentials WHERE user_id = ?'
			).bind(userId).all();

			await updateSectionCompletion(db, userId, 'credentials', credentialsResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error adding credential:', error);
			return fail(500, { error: 'Failed to add credential' });
		}
	},

	updateCredential: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const credentialId = data.id;

			if (!credentialId) {
				return fail(400, { error: 'Credential ID required' });
			}

			await db.prepare(`
				UPDATE credentials SET
					site_name = ?,
					web_address = ?,
					username = ?,
					password = ?,
					category = ?,
					other_info = ?
				WHERE id = ? AND user_id = ?
			`).bind(
				data.site_name || '',
				data.web_address || '',
				data.username || '',
				data.password || '',
				data.category || 'other',
				data.other_info || '',
				credentialId,
				userId
			).run();

			const credentialsResult = await db.prepare(
				'SELECT * FROM credentials WHERE user_id = ?'
			).bind(userId).all();

			await updateSectionCompletion(db, userId, 'credentials', credentialsResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error updating credential:', error);
			return fail(500, { error: 'Failed to update credential' });
		}
	},

	deleteCredential: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const credentialId = formData.get('id');

			if (!credentialId) {
				return fail(400, { error: 'Credential ID required' });
			}

			await db.prepare(
				'DELETE FROM credentials WHERE id = ? AND user_id = ?'
			).bind(credentialId, userId).run();

			const credentialsResult = await db.prepare(
				'SELECT * FROM credentials WHERE user_id = ?'
			).bind(userId).all();

			await updateSectionCompletion(db, userId, 'credentials', credentialsResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error deleting credential:', error);
			return fail(500, { error: 'Failed to delete credential' });
		}
	},

	addContact: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			await db.prepare(`
				INSERT INTO key_contacts (
					user_id, relationship, name, phone, address, email, date_of_birth
				) VALUES (?, ?, ?, ?, ?, ?, ?)
			`).bind(
				userId,
				data.relationship || '',
				data.name || '',
				data.phone || '',
				data.address || '',
				data.email || '',
				data.date_of_birth || ''
			).run();

			const contactsResult = await db.prepare(
				'SELECT * FROM key_contacts WHERE user_id = ?'
			).bind(userId).all();

			await updateSectionCompletion(db, userId, 'contacts', contactsResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error adding contact:', error);
			return fail(500, { error: 'Failed to add contact' });
		}
	},

	updateContact: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const contactId = data.id;

			if (!contactId) {
				return fail(400, { error: 'Contact ID required' });
			}

			await db.prepare(`
				UPDATE key_contacts SET
					relationship = ?,
					name = ?,
					phone = ?,
					address = ?,
					email = ?,
					date_of_birth = ?
				WHERE id = ? AND user_id = ?
			`).bind(
				data.relationship || '',
				data.name || '',
				data.phone || '',
				data.address || '',
				data.email || '',
				data.date_of_birth || '',
				contactId,
				userId
			).run();

			const contactsResult = await db.prepare(
				'SELECT * FROM key_contacts WHERE user_id = ?'
			).bind(userId).all();

			await updateSectionCompletion(db, userId, 'contacts', contactsResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error updating contact:', error);
			return fail(500, { error: 'Failed to update contact' });
		}
	},

	deleteContact: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const contactId = formData.get('id');

			if (!contactId) {
				return fail(400, { error: 'Contact ID required' });
			}

			await db.prepare(
				'DELETE FROM key_contacts WHERE id = ? AND user_id = ?'
			).bind(contactId, userId).run();

			const contactsResult = await db.prepare(
				'SELECT * FROM key_contacts WHERE user_id = ?'
			).bind(userId).all();

			await updateSectionCompletion(db, userId, 'contacts', contactsResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error deleting contact:', error);
			return fail(500, { error: 'Failed to delete contact' });
		}
	},

	addBankAccount: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			await db.prepare(`
				INSERT INTO bank_accounts (
					user_id, institution_name, account_type, account_number, routing_number, balance
				) VALUES (?, ?, ?, ?, ?, ?)
			`).bind(
				userId,
				data.institution_name || '',
				data.account_type || '',
				data.account_number || '',
				data.routing_number || '',
				data.balance ? Number(data.balance) : 0
			).run();

			const accountsResult = await db
				.prepare('SELECT * FROM bank_accounts WHERE user_id = ?')
				.bind(userId)
				.all();

			await updateSectionCompletion(db, userId, 'financial', accountsResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error adding bank account:', error);
			return fail(500, { error: 'Failed to add bank account' });
		}
	},

	updateBankAccount: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const accountId = data.id;

			if (!accountId) {
				return fail(400, { error: 'Account ID required' });
			}

			await db.prepare(`
				UPDATE bank_accounts SET
					institution_name = ?,
					account_type = ?,
					account_number = ?,
					routing_number = ?,
					balance = ?
				WHERE id = ? AND user_id = ?
			`).bind(
				data.institution_name || '',
				data.account_type || '',
				data.account_number || '',
				data.routing_number || '',
				data.balance ? Number(data.balance) : 0,
				accountId,
				userId
			).run();

			const accountsResult = await db
				.prepare('SELECT * FROM bank_accounts WHERE user_id = ?')
				.bind(userId)
				.all();

			await updateSectionCompletion(db, userId, 'financial', accountsResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error updating bank account:', error);
			return fail(500, { error: 'Failed to update bank account' });
		}
	},

	deleteBankAccount: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const accountId = formData.get('id');

			if (!accountId) {
				return fail(400, { error: 'Account ID required' });
			}

			await db
				.prepare('DELETE FROM bank_accounts WHERE id = ? AND user_id = ?')
				.bind(accountId, userId)
				.run();

			const accountsResult = await db
				.prepare('SELECT * FROM bank_accounts WHERE user_id = ?')
				.bind(userId)
				.all();

			await updateSectionCompletion(db, userId, 'financial', accountsResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error deleting bank account:', error);
			return fail(500, { error: 'Failed to delete bank account' });
		}
	},

	addInsurance: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			await db.prepare(`
				INSERT INTO insurance (
					user_id, insurance_type, provider, policy_number, coverage_amount,
					beneficiary, agent_name, agent_phone, premium_amount, premium_frequency
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(
				userId,
				data.insurance_type || '',
				data.provider || '',
				data.policy_number || '',
				data.coverage_amount ? Number(data.coverage_amount) : 0,
				data.beneficiary || '',
				data.agent_name || '',
				data.agent_phone || '',
				data.premium_amount ? Number(data.premium_amount) : 0,
				data.premium_frequency || ''
			).run();

			const policiesResult = await db
				.prepare('SELECT * FROM insurance WHERE user_id = ?')
				.bind(userId)
				.all();

			await updateSectionCompletion(db, userId, 'insurance', policiesResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error adding insurance policy:', error);
			return fail(500, { error: 'Failed to add insurance policy' });
		}
	},

	updateInsurance: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const policyId = data.id;

			if (!policyId) {
				return fail(400, { error: 'Policy ID required' });
			}

			await db.prepare(`
				UPDATE insurance SET
					insurance_type = ?,
					provider = ?,
					policy_number = ?,
					coverage_amount = ?,
					beneficiary = ?,
					agent_name = ?,
					agent_phone = ?,
					premium_amount = ?,
					premium_frequency = ?
				WHERE id = ? AND user_id = ?
			`).bind(
				data.insurance_type || '',
				data.provider || '',
				data.policy_number || '',
				data.coverage_amount ? Number(data.coverage_amount) : 0,
				data.beneficiary || '',
				data.agent_name || '',
				data.agent_phone || '',
				data.premium_amount ? Number(data.premium_amount) : 0,
				data.premium_frequency || '',
				policyId,
				userId
			).run();

			const policiesResult = await db
				.prepare('SELECT * FROM insurance WHERE user_id = ?')
				.bind(userId)
				.all();

			await updateSectionCompletion(db, userId, 'insurance', policiesResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error updating insurance policy:', error);
			return fail(500, { error: 'Failed to update insurance policy' });
		}
	},

	deleteInsurance: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const policyId = formData.get('id');

			if (!policyId) {
				return fail(400, { error: 'Policy ID required' });
			}

			await db
				.prepare('DELETE FROM insurance WHERE id = ? AND user_id = ?')
				.bind(policyId, userId)
				.run();

			const policiesResult = await db
				.prepare('SELECT * FROM insurance WHERE user_id = ?')
				.bind(userId)
				.all();

			await updateSectionCompletion(db, userId, 'insurance', policiesResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error deleting insurance policy:', error);
			return fail(500, { error: 'Failed to delete insurance policy' });
		}
	},

	addEmployment: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			await db.prepare(`
				INSERT INTO employment (
					user_id, employer_name, address, phone, position, hire_date, supervisor,
					supervisor_contact, is_current
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(
				userId,
				data.employer_name || '',
				data.address || '',
				data.phone || '',
				data.position || '',
				data.hire_date || '',
				data.supervisor || '',
				data.supervisor_contact || '',
				data.is_current === 'false' ? 0 : 1
			).run();

			const employmentResult = await db
				.prepare('SELECT * FROM employment WHERE user_id = ?')
				.bind(userId)
				.all();

			await updateSectionCompletion(db, userId, 'employment', employmentResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error adding employment record:', error);
			return fail(500, { error: 'Failed to add employment record' });
		}
	},

	updateEmployment: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const employmentId = data.id;

			if (!employmentId) {
				return fail(400, { error: 'Employment ID required' });
			}

			await db.prepare(`
				UPDATE employment SET
					employer_name = ?,
					address = ?,
					phone = ?,
					position = ?,
					hire_date = ?,
					supervisor = ?,
					supervisor_contact = ?,
					is_current = ?
				WHERE id = ? AND user_id = ?
			`).bind(
				data.employer_name || '',
				data.address || '',
				data.phone || '',
				data.position || '',
				data.hire_date || '',
				data.supervisor || '',
				data.supervisor_contact || '',
				data.is_current === 'false' ? 0 : 1,
				employmentId,
				userId
			).run();

			const employmentResult = await db
				.prepare('SELECT * FROM employment WHERE user_id = ?')
				.bind(userId)
				.all();

			await updateSectionCompletion(db, userId, 'employment', employmentResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error updating employment record:', error);
			return fail(500, { error: 'Failed to update employment record' });
		}
	},

	deleteEmployment: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const employmentId = formData.get('id');

			if (!employmentId) {
				return fail(400, { error: 'Employment ID required' });
			}

			await db
				.prepare('DELETE FROM employment WHERE id = ? AND user_id = ?')
				.bind(employmentId, userId)
				.run();

			const employmentResult = await db
				.prepare('SELECT * FROM employment WHERE user_id = ?')
				.bind(userId)
				.all();

			await updateSectionCompletion(db, userId, 'employment', employmentResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error deleting employment record:', error);
			return fail(500, { error: 'Failed to delete employment record' });
		}
	},

	addDocument: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			await db.prepare(`
				INSERT INTO documents (
					user_id, document_type, file_path, uploaded_at
				) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
			`).bind(
				userId,
				data.document_type || '',
				data.file_path || ''
			).run();

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error adding document:', error);
			return fail(500, { error: 'Failed to add document' });
		}
	},

	updateDocument: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const documentId = data.id;

			if (!documentId) {
				return fail(400, { error: 'Document ID required' });
			}

			await db.prepare(`
				UPDATE documents SET
					document_type = ?,
					file_path = ?
				WHERE id = ? AND user_id = ?
			`).bind(
				data.document_type || '',
				data.file_path || '',
				documentId,
				userId
			).run();

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error updating document:', error);
			return fail(500, { error: 'Failed to update document' });
		}
	},

	deleteDocument: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const documentId = formData.get('id');

			if (!documentId) {
				return fail(400, { error: 'Document ID required' });
			}

			await db.prepare(
				'DELETE FROM documents WHERE id = ? AND user_id = ?'
			).bind(documentId, userId).run();

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error deleting document:', error);
			return fail(500, { error: 'Failed to delete document' });
		}
	},

	addLegalDocument: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			await db.prepare(`
				INSERT INTO legal_documents (
					user_id, document_type, location, attorney_name, attorney_contact, notes
				) VALUES (?, ?, ?, ?, ?, ?)
			`).bind(
				userId,
				data.document_type || '',
				data.location || '',
				data.attorney_name || '',
				data.attorney_contact || '',
				data.notes || ''
			).run();

			const legalResult = await db.prepare(
				'SELECT * FROM legal_documents WHERE user_id = ?'
			).bind(userId).all();

			await updateSectionCompletion(db, userId, 'legal', legalResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error adding legal document:', error);
			return fail(500, { error: 'Failed to add legal document' });
		}
	},

	updateLegalDocument: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const documentId = data.id;

			if (!documentId) {
				return fail(400, { error: 'Document ID required' });
			}

			await db.prepare(`
				UPDATE legal_documents SET
					document_type = ?,
					location = ?,
					attorney_name = ?,
					attorney_contact = ?,
					notes = ?
				WHERE id = ? AND user_id = ?
			`).bind(
				data.document_type || '',
				data.location || '',
				data.attorney_name || '',
				data.attorney_contact || '',
				data.notes || '',
				documentId,
				userId
			).run();

			const legalResult = await db.prepare(
				'SELECT * FROM legal_documents WHERE user_id = ?'
			).bind(userId).all();

			await updateSectionCompletion(db, userId, 'legal', legalResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error updating legal document:', error);
			return fail(500, { error: 'Failed to update legal document' });
		}
	},

	deleteLegalDocument: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);

			if (!userId) {
				return fail(401, { error: 'Not authenticated' });
			}

			const db = getDb(platform);

			if (!db) {
				return fail(500, { error: 'Database not available' });
			}

			const formData = await request.formData();
			const documentId = formData.get('id');

			if (!documentId) {
				return fail(400, { error: 'Document ID required' });
			}

			await db.prepare(
				'DELETE FROM legal_documents WHERE id = ? AND user_id = ?'
			).bind(documentId, userId).run();

			const legalResult = await db.prepare(
				'SELECT * FROM legal_documents WHERE user_id = ?'
			).bind(userId).all();

			await updateSectionCompletion(db, userId, 'legal', legalResult.results || []);

			return { success: true };
		} catch (error) {
			if ('status' in (error as any)) {
				throw error;
			}
			console.error('Error deleting legal document:', error);
			return fail(500, { error: 'Failed to delete legal document' });
		}
	}
};
