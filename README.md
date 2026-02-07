# accounts.xmenu.dev

The authentication and accounts management system for XMenu services.

## Overview

This repository contains the login/registration system for XMenu, built with Supabase for authentication and user management.

## Files

- **index.html** - Main login/registration page with user profile management
- **callback.html** - OAuth callback handler for cross-domain authentication
- **api/delete-user.js** - Serverless function for account deletion

## Features

- ✅ Email/password login and registration
- ✅ Email confirmation support
- ✅ User profile management (display name)
- ✅ Account deletion
- ✅ Multi-language support (English/German)
- ✅ Cross-domain authentication via callback
- ✅ Comprehensive error handling and logging
- ✅ Input validation (email format, password length)
- ✅ Security: Domain whitelist for redirect URLs
- ✅ Security: Protection against open redirect attacks

## Authentication Flow

1. User visits `accounts.xmenu.dev/?returnTo=https://xmenu.dev/`
2. User logs in or registers
3. On success, user is redirected to `https://xmenu.dev/auth/callback.html#access_token=...&refresh_token=...&returnTo=https://xmenu.dev/`
4. The callback page sets the Supabase session and redirects to the final destination

## Security

- **Domain Whitelist**: Only allows redirects to `*.xmenu.dev` domains and `localhost` (for development)
- **Protocol Validation**: Only allows `http://` and `https://` protocols
- **Input Validation**: Client-side validation for email format and password requirements
- **Console Logging**: Comprehensive logging for debugging (prefixed with `[Auth]`, `[Profile]`, `[Redirect]`, etc.)

## Required Setup

The target domain (e.g., `xmenu.dev`, `rls.xmenu.dev`) must have a `/auth/callback.html` file that:
1. Extracts tokens from URL hash
2. Calls `supabase.auth.setSession()` with the tokens
3. Redirects to the returnTo URL

You can use the `callback.html` file from this repository as a template.

## Environment Variables (for Vercel deployment)

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)

## Development

To run locally:

```bash
# Start a local server
python3 -m http.server 8080

# Visit http://localhost:8080/?returnTo=http://localhost:3000/
```

Note: For full functionality, you'll need valid Supabase credentials configured in the HTML files.
