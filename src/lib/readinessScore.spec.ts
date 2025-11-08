import { describe, expect, it } from 'vitest';

import {
        calculateReadinessScore,
        calculateSectionScore,
        getCompletionColor,
        getMotivationalMessage
} from './readinessScore';
import type {
        BankAccount,
        Credential,
        Employment,
        Insurance,
        KeyContact,
        Pet,
        SectionCompletion
} from './types';
import { SECTIONS } from './types';
import {
        calculateCredentialsScore,
        calculateContactsScore,
        calculateFieldBasedScore,
        calculateFinancialScore,
        calculateInsuranceScore,
        calculateEmploymentScore,
        calculatePetsScore,
        SECTION_FIELDS
} from './scoringRules';

describe('calculateReadinessScore', () => {
        it('returns a perfect score when every section is complete', () => {
                const completions: SectionCompletion[] = SECTIONS.map((section, index) => ({
                        id: index,
                        user_id: 1,
                        section_name: section.id,
                        score: 100,
                        last_updated: new Date().toISOString()
                }));

                const result = calculateReadinessScore(completions);

                expect(result.total_score).toBe(100);
                SECTIONS.forEach((section) => {
                        expect(result.sections[section.id]).toBe(100);
                });
        });

        it('applies section weights and defaults missing sections to zero', () => {
                const completions: SectionCompletion[] = [
                        {
                                id: 1,
                                user_id: 1,
                                section_name: 'credentials',
                                score: 80,
                                last_updated: new Date().toISOString()
                        },
                        {
                                id: 2,
                                user_id: 1,
                                section_name: 'personal',
                                score: 40,
                                last_updated: new Date().toISOString()
                        }
                ];

                const result = calculateReadinessScore(completions);

                const totalWeight = SECTIONS.reduce((sum, section) => sum + section.weight, 0);
                const expectedWeighted = SECTIONS.reduce((sum, section) => {
                        const providedScore =
                                section.id === 'credentials'
                                        ? 80
                                        : section.id === 'personal'
                                        ? 40
                                        : 0;
                        return sum + (providedScore * section.weight) / 100;
                }, 0);
                const expectedTotal = Math.round((expectedWeighted / totalWeight) * 100);

                expect(result.total_score).toBe(expectedTotal);
                expect(result.sections.credentials).toBe(80);
                expect(result.sections.personal).toBe(40);
                expect(result.sections.pets).toBe(0);
        });
});

describe('calculateSectionScore', () => {
        it('returns zero when no data is provided', () => {
                expect(calculateSectionScore('personal', undefined)).toBe(0);
        });

        it('returns the credential scoring total for credential sections', () => {
                const credentials: Credential[] = [
                        {
                                user_id: 1,
                                site_name: 'Personal Email',
                                web_address: 'https://mail.example.com',
                                username: 'jane.doe',
                                password: 'secret',
                                category: 'email',
                                other_info: ''
                        },
                        {
                                user_id: 1,
                                site_name: 'Banking',
                                web_address: 'https://bank.example.com',
                                username: 'jane.doe.bank',
                                password: 'more-secret',
                                category: 'banking',
                                other_info: ''
                        }
                ];

                const expected = calculateCredentialsScore(credentials).total;
                const result = calculateSectionScore('credentials', credentials);

                expect(result).toBe(expected);
        });

        it('handles singular pet entries by wrapping them in an array', () => {
                const pet: Pet = {
                        user_id: 1,
                        breed: 'Labrador',
                        name: 'Buddy',
                        date_of_birth: '2020-01-01',
                        license_chip_info: '12345',
                        medications: 'None',
                        veterinarian: 'Dr. Vet',
                        vet_phone: '555-1234',
                        pet_insurance: 'PetPlan',
                        policy_number: 'POL-001',
                        other_info: 'Loves walks'
                };

                const expected = calculatePetsScore([pet]);
                const result = calculateSectionScore('pets', pet);

                expect(result).toBe(expected);
        });

        it('uses configured field weights for fixed-field sections', () => {
                const personalData = {
                        legal_name: 'Jane Doe',
                        date_of_birth: '1985-04-12',
                        address: '123 Main Street',
                        ssn_or_green_card: '123-45-6789',
                        mobile_phone: '555-111-2222',
                        email: 'jane@example.com',
                        drivers_license: 'D1234567'
                } satisfies Record<string, string>;

                const fields = SECTION_FIELDS.personal;
                const expected = calculateFieldBasedScore(
                        personalData,
                        fields.critical,
                        fields.important,
                        fields.optional
                );
                const result = calculateSectionScore('personal', personalData);

                expect(result).toBe(expected);
        });

        it('falls back to simple field scoring when no configuration exists', () => {
                const familyData = {
                        family_tree: 'Complete',
                        reunion_notes: ''
                } satisfies Record<string, string>;

                const expected = calculateFieldBasedScore(familyData, [], Object.keys(familyData), []);
                const result = calculateSectionScore('family', familyData);

                expect(result).toBe(expected);
        });

        it('delegates to key contact scoring for contact sections', () => {
                const contacts: KeyContact[] = [
                        {
                                user_id: 1,
                                relationship: 'Emergency contact',
                                name: 'Alex',
                                phone: '555-1111',
                                address: '',
                                email: '',
                                date_of_birth: ''
                        }
                ];

                const expected = calculateContactsScore(contacts);
                const result = calculateSectionScore('contacts', contacts);

                expect(result).toBe(expected);
        });

        it('delegates to insurance scoring for insurance sections', () => {
                const policies: Insurance[] = [
                        {
                                user_id: 1,
                                insurance_type: 'Health',
                                provider: 'HealthCo',
                                policy_number: 'H123',
                                coverage_amount: 100000,
                                beneficiary: '',
                                agent_name: 'Agent',
                                agent_phone: '555-2222',
                                premium_amount: 100,
                                premium_frequency: 'monthly'
                        }
                ];

                const expected = calculateInsuranceScore(policies);
                const result = calculateSectionScore('insurance', policies);

                expect(result).toBe(expected);
        });

        it('delegates to financial scoring for financial sections', () => {
                const accounts: BankAccount[] = [
                        {
                                user_id: 1,
                                institution_name: 'Bank',
                                account_type: 'Checking',
                                account_number: '123',
                                routing_number: '111',
                                balance: 500
                        }
                ];

                const expected = calculateFinancialScore(accounts);
                const result = calculateSectionScore('financial', accounts);

                expect(result).toBe(expected);
        });

        it('delegates to employment scoring for employment sections', () => {
                const jobs: Employment[] = [
                        {
                                user_id: 1,
                                employer_name: 'Wrap It Up',
                                address: '123 Memory Ln',
                                phone: '555-1234',
                                position: 'Planner',
                                hire_date: '2020-01-01',
                                supervisor: 'Jordan',
                                supervisor_contact: '555-8888',
                                is_current: true
                        },
                        {
                                user_id: 1,
                                employer_name: 'Legacy Co',
                                address: '789 Future Rd',
                                phone: '555-2222',
                                position: 'Archivist',
                                hire_date: '2016-05-01',
                                supervisor: 'Alex',
                                supervisor_contact: '555-3333',
                                is_current: false
                        }
                ];

                const expected = calculateEmploymentScore(jobs);
                const result = calculateSectionScore('employment', jobs);

                expect(result).toBe(expected);
        });
});

describe('getCompletionColor', () => {
        it('returns the correct color for each threshold', () => {
                expect(getCompletionColor(85)).toBe('green');
                expect(getCompletionColor(70)).toBe('yellow');
                expect(getCompletionColor(30)).toBe('orange');
                expect(getCompletionColor(10)).toBe('red');
        });
});

describe('getMotivationalMessage', () => {
        it('provides tailored feedback for readiness milestones', () => {
                expect(getMotivationalMessage(95)).toBe("Outstanding! You're well-prepared for the future.");
                expect(getMotivationalMessage(80)).toBe("Great progress! You're almost there.");
                expect(getMotivationalMessage(60)).toBe('Good start! Keep filling out the remaining sections.');
                expect(getMotivationalMessage(35)).toBe("You're on your way. Every step counts!");
                expect(getMotivationalMessage(5)).toBe("Welcome! Let's start organizing your important information.");
        });
});
