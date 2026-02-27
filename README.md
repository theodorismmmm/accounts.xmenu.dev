# accounts.xmenu.dev

The XMenu account system — static frontend backed by [Supabase](https://supabase.com), deployed as serverless API functions.

---

## API Endpoints

### `POST /api/login`

Authenticate with email and password. Returns a bearer token you can reuse.

**Request body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Success response `200`:**
```json
{
  "token": "<supabase-access-token>",
  "token_type": "Bearer",
  "expires_at": "2025-01-01T01:00:00.000Z",
  "refresh_token": "<supabase-refresh-token>"
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `400` | Missing or invalid `email`/`password` fields |
| `401` | Wrong credentials |
| `429` | Too many attempts (> 5 per minute per IP) |
| `500` | Server misconfiguration |

---

### `GET /api/me`

Validate a token and return basic account info.

**Request headers:**
```
Authorization: Bearer <token>
```

**Success response `200`:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "Display Name or null"
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `401` | Missing, invalid, or expired token |
| `500` | Server misconfiguration |

---

## Apple Shortcuts — Quick Start

### Step 1 — Log in and store the token

1. Add a **"Get Contents of URL"** action.
   - **URL:** `https://accounts.xmenu.dev/api/login`
   - **Method:** `POST`
   - **Request Body:** `JSON`
   - **JSON fields:**
     | Key | Value |
     |-----|-------|
     | `email` | your email address (or a Shortcut variable) |
     | `password` | your password (or a Shortcut variable) |

2. Add a **"Get Dictionary Value"** action on the result.
   - Key: `token`

3. Add a **"Save to iCloud Drive"** (or "Set Variable") action to persist the token for later reuse.

> **Tip:** The token expires in ~1 hour. Save `expires_at` alongside the token and re-login when it has passed.

---

### Step 2 — Call a protected endpoint (e.g. `/api/me`)

1. Add a **"Get Contents of URL"** action.
   - **URL:** `https://accounts.xmenu.dev/api/me`
   - **Method:** `GET`
   - **Headers:**
     | Header | Value |
     |--------|-------|
     | `Authorization` | `Bearer <your stored token>` |

2. Use **"Get Dictionary Value"** on the result to read `email`, `id`, or `username`.

---

## curl examples (local validation)

```bash
# Login
curl -s -X POST https://accounts.xmenu.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}' | jq .

# Store the token
TOKEN=$(curl -s -X POST https://accounts.xmenu.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}' | jq -r .token)

# Get account info
curl -s https://accounts.xmenu.dev/api/me \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Environment variables

See [`.env.example`](.env.example) for all required variables.

| Variable | Used by | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | all API functions | Supabase project URL |
| `SUPABASE_ANON_KEY` | `login.js`, `me.js` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `delete-user.js` | Secret service-role key |

Set these in your deployment platform's environment settings (e.g. Vercel → Project Settings → Environment Variables). **Never commit secrets.**

---

## Security notes

- **CORS:** All `/api/*` endpoints return `Access-Control-Allow-Origin: *`. Apple Shortcuts calls APIs directly (not through a browser), so CORS headers are informational only. If you want to restrict browser access, replace `*` with your specific origin.
- **Rate limiting:** `/api/login` is limited to 5 requests per IP per minute (in-memory, per serverless instance). This guards against brute-force within a single warm instance.
- **No secret leakage:** Error messages never include internal details or stack traces.
