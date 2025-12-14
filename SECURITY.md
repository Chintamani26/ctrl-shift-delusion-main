# Security Notice

## API Keys

**IMPORTANT**: Never commit API keys or sensitive credentials to the repository.

### Environment Variables

This project uses environment variables for sensitive configuration:

- **Python Backend**: Uses `.env` file (loaded via `python-dotenv`)
- **Next.js Frontend**: Uses `.env.local` for local development

### Setup Instructions

1. Copy the example file (if available) or create your own:
   ```bash
   # For Python backend
   cp .env.example .env
   
   # For Next.js frontend  
   cp .env.local.example .env.local
   ```

2. Add your actual API keys to these files (they are gitignored)

3. **Never commit** `.env` or `.env.local` files

### Required Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (get from https://makersuite.google.com/app/apikey)
- `NEXT_PUBLIC_GEMINI_API_KEY`: (Optional) For client-side Next.js usage

### If You Accidentally Commit a Key

1. **Immediately rotate/revoke the exposed key** in the service console
2. Remove the file from git: `git rm --cached .env .env.local`
3. Remove from history: Use `git filter-branch` or `git filter-repo`
4. Force push: `git push origin --force --all` (coordinate with team first!)

