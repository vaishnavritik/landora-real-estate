# Landora — Responsive Real Estate Website + Lead Management

A mobile-friendly real-estate enquiry website built with **React + Vite** and a **Node.js + Express** backend. The website captures a prospect's contact details, stores each valid submission on the server, and automatically updates an Excel workbook (`.xlsx`). A protected admin screen lists the submitted enquiries and downloads the workbook.

The design is a new template informed by common real-estate website patterns; it does not copy either reference site's branding or content.

## Features

- Responsive React website for mobile, tablet and desktop.
- Enquiry form fields: full name, phone, email, address, city, PIN code, property interest, budget, preferred plot size, preferred contact method, message and follow-up consent.
- Server-side validation, phone/email checks, request-size limit, basic submission rate limit and a honeypot field.
- Persistent lead storage at `server/data/leads.json`.
- Styled Excel workbook regenerated after each successful submission at `server/data/leads.xlsx`.
- Protected admin page at `/admin` with search, refresh and Excel download.
- Admin API routes require the `X-Admin-Token` header.
- One Node.js server can serve the production React build and API from the same origin.

## Requirements

- Node.js 20.19+ (Node.js 22 LTS recommended)
- npm

Check with:

```bash
node --version
npm --version
```

## Run locally

From the project root:

```bash
npm install
npm run dev
```

Open the URLs shown in the terminal; normally:

- Website: `http://localhost:5173`
- Admin screen: `http://localhost:5173/admin`
- Backend health check: `http://localhost:4000/api/health`

For local development, if `ADMIN_TOKEN` is not set, the backend uses this local-only token:

```text
local-admin-change-me
```

Open `/admin`, enter that token, and select **Open lead dashboard**. Change the token before deploying the app. To use your own local token, copy `.env.example` to `.env` and set `ADMIN_TOKEN` to a long random secret. Restart the backend after changing environment variables.

## What happens after a user submits the form?

1. The React form sends the entered details to `POST /api/leads`.
2. The Express server validates required fields and consent.
3. The server adds the lead to `server/data/leads.json` and regenerates `server/data/leads.xlsx`.
4. The authorized admin can view enquiries at `/admin` or download `landora-leads.xlsx` from the dashboard.

The workbook has an `Enquiries` sheet, frozen header row, filterable columns, date formatting and columns for name, phone, email, address, location, interest, budget, plot size, contact method, message, consent and submission source. Phone numbers and PIN codes are retained as text to protect leading zeros or a leading `+`.

The admin can also call:

- `GET /api/leads` — list enquiries (requires `X-Admin-Token`). Supports `?search=` and `?limit=`.
- `GET /api/leads/export` — download the latest Excel file (requires `X-Admin-Token`).
- `GET /api/health` — non-sensitive API health check.

## Production build

Build the frontend:

```bash
npm run build
```

Set environment variables in your hosting provider's environment configuration:

```text
NODE_ENV=production
ADMIN_TOKEN=<a-long-random-secret>
PORT=4000
```

Then run:

```bash
npm start
```

In production, the server refuses to start if `ADMIN_TOKEN` is missing. The Express server serves the compiled React site from `dist/` and the API from the same origin.

## Important deployment and privacy notes

- **Use persistent server storage.** This starter keeps JSON and Excel files under `server/data/`. Some hosting platforms use temporary filesystems that are erased when instances restart or redeploy; attach a persistent disk/volume or replace JSON-file storage with a database before deploying there.
- Back up `server/data/` regularly. Avoid manually editing the files while the server is running.
- Use HTTPS, configure a strong unique `ADMIN_TOKEN`, restrict admin access at the hosting/network layer where possible, and never commit `.env`, lead data, or downloaded workbooks to Git.
- Contact details and addresses are personal data. Publish a suitable privacy notice, explain the purpose of collection, set a retention policy, limit staff access, and use the data only for permitted follow-up.
- The example property cards, project names, images and locations are illustrative. Replace them with verified business information and real property listings before publishing.
- Update the business name, phone/WhatsApp details, logo, terms, and privacy policy before launch.
- This starter does not yet include email/SMS notifications, staff accounts/roles, a CRM integration or a database service. The admin token is a simple protection layer, suitable for a controlled starter but not a full multi-user identity system.
