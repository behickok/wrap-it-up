# Wrap It Up - TODO List

## High Priority Features

### Handling Forms with Multiple Records
**Status:** Not Started
**Description:** Implement multi-record support for sections that need to store multiple entries (credentials, pets, contacts, insurance policies, financial accounts, vehicles, employment history, etc.)

**Requirements:**
- Create UI for displaying list of existing records per section
- Add "Add Another" button to create new entries
- Implement edit/delete functionality for individual records
- Update backend API to handle arrays of data per section
- Add proper state management for multi-record sections
- Consider pagination or infinite scroll for sections with many records

**Affected Sections:**
- Credentials (multiple login accounts)
- Pets (multiple pets)
- Contacts (multiple key contacts)
- Insurance Policies (multiple policies)
- Financial Accounts (multiple bank accounts)
- Property (multiple vehicles)
- Employment (employment history)
- Legal Documents (multiple documents)

---

### Export to PDF or Excel
**Status:** Not Started
**Description:** Allow users to export their compiled information to PDF or Excel format for printing, backup, or sharing with trusted individuals.

**Requirements:**
- Implement PDF generation with proper formatting
  - Include all filled sections
  - Use branded header/footer
  - Organize by journey categories
  - Include table of contents
- Implement Excel export
  - One sheet per section or logical grouping
  - Proper column headers and formatting
  - Include metadata (export date, version, etc.)
- Add export button to dashboard
- Allow users to select which sections to include
- Consider password protection for sensitive exports
- Add print-friendly CSS for browser printing option

**Technical Considerations:**
- PDF: Consider using libraries like `pdfkit`, `jsPDF`, or server-side generation
- Excel: Consider using `xlsx` or `exceljs` library
- Large datasets may require streaming or chunked processing

---

### Encrypting Sensitive Information
**Status:** Not Started
**Description:** Implement encryption for sensitive data fields (passwords, SSN, financial info) to ensure user data is properly secured.

**Requirements:**
- Identify all sensitive fields that need encryption
  - Passwords (credentials section)
  - SSN/Green Card numbers
  - Financial account numbers
  - Passport numbers
  - Other PII (Personally Identifiable Information)
- Implement client-side encryption before storing data
- Choose appropriate encryption algorithm (AES-256-GCM recommended)
- Implement secure key management
  - User password-derived keys
  - Consider key rotation strategy
  - Secure key storage mechanism
- Add encryption indicator icons to encrypted fields
- Implement secure decryption flow with user authentication
- Consider adding master password feature
- Ensure compliance with data protection regulations (GDPR, CCPA, etc.)
- Add security audit logging

**Technical Considerations:**
- Use Web Crypto API for client-side encryption
- Consider `libsodium.js` or `tweetnacl` for additional cryptographic operations
- Implement proper key derivation (PBKDF2 or Argon2)
- Salt and IV generation for each encryption operation
- Backend should never have access to plaintext sensitive data

---

## Additional Future Enhancements

### User Experience
- [ ] Add progress indicators for each section
- [ ] Implement auto-save functionality
- [ ] Add data validation and helpful error messages
- [ ] Create onboarding wizard for new users
- [ ] Add keyboard shortcuts for power users

### Security & Privacy
- [ ] Implement two-factor authentication
- [ ] Add session timeout for inactive users
- [ ] Create audit log for data access
- [ ] Add option to share sections with trusted contacts
- [ ] Implement secure document upload for supporting files

### Data Management
- [ ] Add data import from common formats
- [ ] Implement version history/changelog for edits
- [ ] Create backup and restore functionality
- [ ] Add data portability (export all data)

### Notifications & Reminders
- [ ] Add email reminders to update information periodically
- [ ] Create expiration tracking for documents/policies
- [ ] Send notifications for incomplete sections

---

## Notes
- Consider creating a priority ranking system for these features
- Gather user feedback to determine which features are most valuable
- Ensure all features maintain the existing UI/UX design language
