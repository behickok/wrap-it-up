import { afterEach, describe, expect, it, vi } from 'vitest';

import { exportToPDF } from './pdfExport';

type MockDoc = ReturnType<typeof createMockDocument>;

const jsPDFInstances: MockDoc[] = [];

const autoTableMock = vi.fn((doc: MockDoc, options: Record<string, any> = {}) => {
	const startY = options?.startY ?? 0;
	doc.lastAutoTable = { finalY: startY + 10 };
	if (typeof options?.didDrawPage === 'function') {
		options.didDrawPage({ cursor: { y: doc.lastAutoTable.finalY } });
	}
});

function createMockDocument() {
	const doc: any = {
		internal: {
			pageSize: {
				getWidth: () => 210,
				getHeight: () => 297
			}
		},
		pages: 1,
		lastAutoTable: { finalY: 0 },
		setFontSize: vi.fn(),
		setFont: vi.fn(),
		setTextColor: vi.fn(),
		text: vi.fn(),
		splitTextToSize: vi.fn(() => ['split']),
		setFillColor: vi.fn(),
		rect: vi.fn(),
		setDrawColor: vi.fn(),
		line: vi.fn(),
		save: vi.fn(),
		setPage: vi.fn()
	};

	doc.addPage = vi.fn(() => {
		doc.pages += 1;
		return doc;
	});
	doc.getNumberOfPages = vi.fn(() => doc.pages);

	return doc;
}

const jsPDFConstructor = vi.fn(function () {
	const doc = createMockDocument();
	jsPDFInstances.push(doc);
	return doc;
});

vi.mock('jspdf', () => ({
	default: jsPDFConstructor
}));

vi.mock('jspdf-autotable', () => ({
	default: autoTableMock
}));

function createExportPayload() {
	return {
		user: {
			username: 'casey',
			email: 'casey@example.com'
		},
		data: {
			personalInfo: [{ legal_name: 'Casey Planner' }],
			credentials: [{ site_name: 'Mail', username: 'casey', password: 'secret', category: 'email', other_info: '' }],
			pets: [{ name: 'Buddy' }],
			keyContacts: [{ name: 'Alex', relationship: 'Emergency contact', phone: '555-1234' }],
			medicalInfo: [{ name: 'Casey', blood_type: 'O+' }],
			physicians: [{ name: 'Jordan Primary', specialty: 'Family', phone: '555-8888', medical_info_id: 1 }],
			employment: [{ employer_name: 'Wrap It Up', position: 'Lead', hire_date: '2020-01-01', supervisor: 'Taylor', supervisor_contact: '555-6789', is_current: true }],
			primaryResidence: [{ address: '123 Memory Ln', own_or_rent: 'own' }],
			vehicles: [{ make: 'Tesla', model: 'Model 3', year: 2022 }],
			insurance: [{ insurance_type: 'Health', provider: 'HealthCo', policy_number: 'HC-1', agent_name: 'Agent', agent_phone: '555-1111' }],
			bankAccounts: [{ institution_name: 'Legacy Bank', account_type: 'Checking', account_number: '1234' }],
			legalDocuments: [{ document_type: 'Will', location: 'Safe' }],
			finalDays: [{ who_around: 'Family' }],
			obituary: [{ obituary_text: 'A life well lived.' }],
			afterDeath: [{ contact_name: 'Jordan', contact_phone: '555-1212' }],
			funeral: [{ location_name: 'Community Hall', director_name: 'Sam' }]
		},
		exportedAt: '2024-01-01T00:00:00.000Z'
	};
}

describe('exportToPDF', () => {
	afterEach(() => {
		delete (globalThis as any).window;
		delete (globalThis as any).fetch;
		jsPDFInstances.length = 0;
		autoTableMock.mockClear();
		jsPDFConstructor.mockClear();
		vi.useRealTimers();
	});

	it('returns a helpful error when invoked outside the browser', async () => {
		const result = await exportToPDF();

		expect(result).toEqual({
			success: false,
			error: 'PDF export is only available in the browser'
		});
		expect(jsPDFConstructor).not.toHaveBeenCalled();
	});

	it('surface fetch failures when export data cannot load', async () => {
		(globalThis as any).window = {};
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		(globalThis as any).fetch = vi.fn(async () => ({
			ok: false,
			json: vi.fn()
		}));

		const result = await exportToPDF();

		expect(result).toEqual({
			success: false,
			error: 'Failed to fetch data'
		});
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('saves the generated PDF with the user-specific filename when data loads successfully', async () => {
		(globalThis as any).window = {};
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-02-15T12:00:00Z'));
		const payload = createExportPayload();

		(globalThis as any).fetch = vi.fn(async () => ({
			ok: true,
			json: async () => payload
		}));

		const result = await exportToPDF();

		expect(result.success).toBe(true);
		expect(result.filename).toContain('casey');
		expect(result.filename).toContain('2024-02-15');
		expect(jsPDFInstances).toHaveLength(1);
		expect(jsPDFInstances[0].save).toHaveBeenCalledWith(result.filename);
	});
});
