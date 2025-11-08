import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, locals }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const db = platform?.env?.DB;
	if (!db) {
		return json({ error: 'Database not available' }, { status: 500 });
	}

	try {
		// Fetch all user data from all tables
		const [
			personalInfo,
			credentials,
			pets,
			keyContacts,
			medicalInfo,
			physicians,
			employment,
			primaryResidence,
			vehicles,
			insurance,
			bankAccounts,
			legalDocuments,
			finalDays,
			obituary,
			afterDeath,
			funeral
		] = await Promise.all([
			db
				.prepare('SELECT * FROM personal_info WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM credentials WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM pets WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM key_contacts WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM medical_info WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM physicians WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM employment WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM primary_residence WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM vehicles WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM insurance WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM bank_accounts WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM legal_documents WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM final_days WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM obituary WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM after_death WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results),
			db
				.prepare('SELECT * FROM funeral WHERE user_id = ?')
				.bind(user.id)
				.all()
				.then((r) => r.results)
		]);

		return json({
			user: {
				username: user.username,
				email: user.email
			},
			data: {
				personalInfo,
				credentials,
				pets,
				keyContacts,
				medicalInfo,
				physicians,
				employment,
				primaryResidence,
				vehicles,
				insurance,
				bankAccounts,
				legalDocuments,
				finalDays,
				obituary,
				afterDeath,
				funeral
			},
			exportedAt: new Date().toISOString()
		});
	} catch (error) {
		console.error('Error fetching user data:', error);
		return json({ error: 'Failed to fetch user data' }, { status: 500 });
	}
};
