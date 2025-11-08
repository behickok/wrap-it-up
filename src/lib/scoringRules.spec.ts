import { describe, expect, it } from 'vitest';
import {
        calculateContactsScore,
        calculateCredentialsScore,
        calculateEmploymentScore,
        calculateFieldBasedScore,
        calculateFinancialScore,
        calculateInsuranceScore,
        calculatePetsScore
} from './scoringRules';
import type {
        BankAccount,
        Credential,
        Employment,
        Insurance,
        KeyContact,
        Pet
} from './types';

describe('calculateCredentialsScore', () => {
        it('awards base, category, and completeness points', () => {
                const credentials: Credential[] = [
                        {
                                user_id: 1,
                                site_name: 'Mail',
                                web_address: 'https://mail.example.com',
                                username: 'jane',
                                password: 'secret',
                                category: 'email',
                                other_info: ''
                        },
                        {
                                user_id: 1,
                                site_name: 'Bank',
                                web_address: 'https://bank.example.com',
                                username: 'jane.bank',
                                password: 'hunter2',
                                category: 'banking',
                                other_info: ''
                        },
                        {
                                user_id: 1,
                                site_name: 'Utilities',
                                web_address: 'https://power.example.com',
                                username: 'jane.power',
                                password: 'lights-on',
                                category: 'utilities',
                                other_info: ''
                        }
                ];

                const result = calculateCredentialsScore(credentials);

                expect(result.basePoints).toBe(30);
                expect(result.categoryPoints).toBe(30); // email + banking + utilities
                expect(result.completenessPoints).toBe(15); // 3 fully complete credentials
                expect(result.total).toBe(75);
        });

        it('caps the completeness bonus at 30 points', () => {
                const credentials: Credential[] = Array.from({ length: 8 }).map((_, index) => ({
                        user_id: 1,
                        site_name: `Site ${index}`,
                        web_address: `https://site${index}.example.com`,
                        username: `user${index}`,
                        password: 'complete',
                        category: 'other',
                        other_info: ''
                }));

                const result = calculateCredentialsScore(credentials);

                expect(result.completenessPoints).toBe(30);
                expect(result.total).toBe(60); // base 30 + completeness 30
        });

        it('returns zeros when no credentials are provided', () => {
                expect(calculateCredentialsScore([])).toEqual({
                        basePoints: 0,
                        categoryPoints: 0,
                        completenessPoints: 0,
                        total: 0
                });
        });
});

describe('calculatePetsScore', () => {
        it('combines base, veterinarian, and completeness bonuses', () => {
                const pets: Pet[] = [
                        {
                                user_id: 1,
                                name: 'Buddy',
                                breed: 'Labrador',
                                date_of_birth: '2020-01-01',
                                license_chip_info: '12345',
                                medications: 'None',
                                veterinarian: 'Dr. Vet',
                                vet_phone: '555-1111',
                                pet_insurance: '',
                                policy_number: '',
                                other_info: ''
                        },
                        {
                                user_id: 1,
                                name: 'Mittens',
                                breed: 'Tabby',
                                date_of_birth: '2018-02-02',
                                license_chip_info: '67890',
                                medications: 'Insulin',
                                veterinarian: 'Dr. Cat',
                                vet_phone: '555-2222',
                                pet_insurance: '',
                                policy_number: '',
                                other_info: ''
                        }
                ];

                expect(calculatePetsScore(pets)).toBe(70); // 30 base + 20 vet + 20 completeness
        });

        it('returns zero when no pets are recorded', () => {
                expect(calculatePetsScore([])).toBe(0);
        });
});

describe('calculateContactsScore', () => {
        it('rewards category coverage and completeness', () => {
                const contacts: KeyContact[] = [
                        {
                                user_id: 1,
                                relationship: 'Emergency contact',
                                name: 'Alex',
                                phone: '555-1000',
                                address: '',
                                email: '',
                                date_of_birth: ''
                        },
                        {
                                user_id: 1,
                                relationship: 'Primary doctor',
                                name: 'Dr. Smith',
                                phone: '555-2000',
                                address: '',
                                email: '',
                                date_of_birth: ''
                        },
                        {
                                user_id: 1,
                                relationship: 'Family attorney',
                                name: 'Jordan Counsel',
                                phone: '555-3000',
                                address: '',
                                email: '',
                                date_of_birth: ''
                        },
                        {
                                user_id: 1,
                                relationship: 'Financial advisor',
                                name: 'Taylor Finance',
                                phone: '555-4000',
                                address: '',
                                email: '',
                                date_of_birth: ''
                        }
                ];

                expect(calculateContactsScore(contacts)).toBe(100); // 20 base + 60 category + 20 completeness
        });

        it('awards completeness points for fully detailed contacts', () => {
                const contacts: KeyContact[] = [
                        {
                                user_id: 1,
                                relationship: 'Sibling',
                                name: 'Alex',
                                phone: '555-1000',
                                address: '123 Main St',
                                email: 'alex@example.com',
                                date_of_birth: '1990-01-01'
                        },
                        {
                                user_id: 1,
                                relationship: 'Neighbor',
                                name: 'Sam',
                                phone: '555-2000',
                                address: '456 Oak Ave',
                                email: 'sam@example.com',
                                date_of_birth: '1992-02-02'
                        }
                ];

                expect(calculateContactsScore(contacts)).toBe(30); // 20 base + 10 completeness
        });
});

describe('calculateInsuranceScore', () => {
        it('awards points for multiple coverage types and completeness', () => {
                const policies: Insurance[] = [
                        {
                                user_id: 1,
                                insurance_type: 'Health',
                                provider: 'HealthCo',
                                policy_number: 'H123',
                                coverage_amount: 100000,
                                beneficiary: '',
                                agent_name: 'Dr. Care',
                                agent_phone: '555-1111',
                                premium_amount: 100,
                                premium_frequency: 'monthly'
                        },
                        {
                                user_id: 1,
                                insurance_type: 'Auto',
                                provider: 'DriveSafe',
                                policy_number: 'A456',
                                coverage_amount: 50000,
                                beneficiary: '',
                                agent_name: 'Auto Agent',
                                agent_phone: '555-2222',
                                premium_amount: 80,
                                premium_frequency: 'monthly'
                        },
                        {
                                user_id: 1,
                                insurance_type: 'Life',
                                provider: 'LifeSecure',
                                policy_number: 'L789',
                                coverage_amount: 250000,
                                beneficiary: '',
                                agent_name: 'Life Agent',
                                agent_phone: '555-3333',
                                premium_amount: 150,
                                premium_frequency: 'monthly'
                        }
                ];

                expect(calculateInsuranceScore(policies)).toBe(80); // 20 base + 45 coverage + 15 completeness
        });
});

describe('calculateFinancialScore', () => {
        it('rewards account diversity and completeness', () => {
                const accounts: BankAccount[] = [
                        {
                                user_id: 1,
                                institution_name: 'Bank 1',
                                account_type: 'Checking',
                                account_number: '123',
                                routing_number: '111',
                                balance: 1000
                        },
                        {
                                user_id: 1,
                                institution_name: 'Bank 2',
                                account_type: 'Savings',
                                account_number: '456',
                                routing_number: '222',
                                balance: 2000
                        },
                        {
                                user_id: 1,
                                institution_name: 'Brokerage',
                                account_type: 'Investment',
                                account_number: '789',
                                routing_number: '333',
                                balance: 5000
                        },
                        {
                                user_id: 1,
                                institution_name: 'Credit Union',
                                account_type: 'Checking',
                                account_number: '987',
                                routing_number: '444',
                                balance: 3000
                        }
                ];

                expect(calculateFinancialScore(accounts)).toBe(94); // 30 base + 30 diversity + 24 completeness + 10 bonus
        });
});

describe('calculateEmploymentScore', () => {
        it('rewards current positions, diverse employers, and completeness', () => {
                const jobs: Employment[] = [
                        {
                                user_id: 1,
                                employer_name: 'Wrap It Up',
                                address: '123 Memory Ln',
                                phone: '555-0001',
                                position: 'Lead Planner',
                                hire_date: '2021-03-01',
                                supervisor: 'Jordan',
                                supervisor_contact: '555-2222',
                                is_current: true
                        },
                        {
                                user_id: 1,
                                employer_name: 'Legacy Co',
                                address: '456 Future Ave',
                                phone: '555-0002',
                                position: 'Archivist',
                                hire_date: '2018-04-15',
                                supervisor: 'Alex',
                                supervisor_contact: '555-3333',
                                is_current: false
                        },
                        {
                                user_id: 1,
                                employer_name: 'Care Labs',
                                address: '789 Plan Rd',
                                phone: '555-0003',
                                position: 'Coordinator',
                                hire_date: '2015-07-20',
                                supervisor: 'Sam',
                                supervisor_contact: '555-4444',
                                is_current: false
                        }
                ];

                // 30 base + 20 current + 20 diversity (3 employers) + 18 completeness
                expect(calculateEmploymentScore(jobs)).toBe(88);
        });

        it('returns zero when no employment history is provided', () => {
                expect(calculateEmploymentScore([])).toBe(0);
        });
});

describe('calculateFieldBasedScore', () => {
        it('uses weighted fields to produce a percentage score', () => {
                const data = {
                        legal_name: 'Jane Doe',
                        date_of_birth: '1985-01-01',
                        address: '123 Main St',
                        ssn_or_green_card: '123-45-6789',
                        mobile_phone: '555-1212',
                        email: '',
                        drivers_license: 'D1234567'
                } as const;

                const score = calculateFieldBasedScore(
                        data,
                        ['legal_name', 'date_of_birth', 'address', 'ssn_or_green_card'],
                        ['mobile_phone', 'email', 'drivers_license'],
                        []
                );

                // 4 critical fields (40 points) + 2 important (10 points) out of 55 possible -> 91 rounded
                expect(score).toBe(91);
        });

        it('returns zero when no field weights are provided', () => {
                expect(calculateFieldBasedScore({}, [], [], [])).toBe(0);
        });
});
