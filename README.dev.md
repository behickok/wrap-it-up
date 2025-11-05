# Wrap It Up - End of Life Planning Workbook

A compassionate web application to help people organize their end-of-life planning information, built with SvelteKit and deployed on Cloudflare.

## Features

- **17 Comprehensive Sections**: From personal information to funeral arrangements
- **Readiness Score**: Track your progress with a visual score in the header
- **Ask AI**: Get help filling out sections using OpenAI integration
- **Auto-save**: Your progress is automatically saved to Cloudflare D1
- **Beautiful UI**: Clean, modern interface with responsive design
- **Privacy-focused**: All data stored securely in your Cloudflare D1 database

## Tech Stack

- **Frontend**: SvelteKit 2 with Svelte 5
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages
- **AI**: OpenAI API (GPT-3.5)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Cloudflare account
- (Optional) OpenAI API key for AI assistance feature

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create your environment variables:
```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and add your OpenAI API key (optional).

3. Set up the local D1 database:
```bash
# Create the database locally
npx wrangler d1 create wrap-it-up-db

# This will output a database_id - update wrangler.jsonc with this ID

# Initialize the database schema
npx wrangler d1 execute wrap-it-up-db --local --file=./schema.sql
```

4. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:5173` to see your app!

## Database Setup for Production

When deploying to production, you'll need to:

1. Create a production D1 database:
```bash
npx wrangler d1 create wrap-it-up-db
```

2. Run the schema on production:
```bash
npx wrangler d1 execute wrap-it-up-db --file=./schema.sql
```

3. Add environment variables in Cloudflare dashboard:
   - Go to your Pages project settings
   - Add `OPENAI_API_KEY` under Environment Variables

## Project Structure

```
src/
├── lib/
│   ├── components/        # Reusable Svelte components
│   │   ├── FormField.svelte
│   │   └── AskAI.svelte
│   ├── types.ts          # TypeScript type definitions
│   └── readinessScore.ts # Score calculation logic
├── routes/
│   ├── +layout.svelte    # Main layout with header/footer
│   ├── +layout.server.ts # Load readiness score
│   ├── +page.svelte      # Dashboard page
│   ├── section/
│   │   └── [slug]/       # Dynamic section pages
│   └── api/
│       └── ask-ai/       # OpenAI integration endpoint
└── app.d.ts              # TypeScript declarations

schema.sql                # Database schema
wrangler.jsonc           # Cloudflare configuration
```

## The 17 Sections

1. Usernames & Passwords
2. Personal Information ✓ (implemented)
3. Family History
4. Pets
5. Key Contacts
6. Medical
7. Employment
8. Primary Residence
9. Property
10. Insurance
11. Financial
12. Legal
13. Final Days ✓ (implemented)
14. Obituary
15. After Death
16. Funeral & Celebration
17. Conclusion

✓ = Form fully implemented
(Others show placeholder "coming soon" message)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare
npm run deploy
```

## Customization

### Adding More Section Forms

To add a form for a new section:

1. Update `/src/routes/section/[slug]/+page.server.ts` - Add a case in the `load` function and `save` action
2. Update `/src/routes/section/[slug]/+page.svelte` - Add an `{:else if}` block with your form fields
3. Use the `FormField` component for consistent styling

### Adjusting Section Weights

Section weights determine their importance in the readiness score. Edit in `/src/lib/types.ts`:

```typescript
export const SECTIONS = [
  { id: 'legal', name: 'Legal', weight: 9 }, // High priority
  { id: 'pets', name: 'Pets', weight: 3 },  // Lower priority
  // ...
];
```

## Security Notes

- Never commit `.dev.vars` or real API keys
- The app uses a simplified auth model (userId = 1) for demonstration
- For production, implement proper authentication (Cloudflare Access, Auth0, etc.)
- Consider encrypting sensitive data in the database

## License

This project is created for helping people organize important end-of-life information.

## Support

For questions or issues, please open an issue on the repository.
