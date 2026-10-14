import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import ExcelJS from 'exceljs';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, 'data');
const leadsPath = path.join(dataDir, 'leads.json');
const workbookPath = path.join(dataDir, 'leads.xlsx');
const distPath = path.resolve(here, '..', 'dist');
const port = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === 'production';
const adminToken = process.env.ADMIN_TOKEN || (!isProduction ? 'local-admin-change-me' : '');

if (!adminToken || (isProduction && (adminToken.length < 32 || adminToken === 'replace-with-a-long-random-secret'))) {
  console.error('ERROR: Set ADMIN_TOKEN to a unique random secret of at least 32 characters before starting in production.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null,
    },
  },
}));
app.use(express.json({ limit: '20kb' }));

let leads = [];
let writeQueue = Promise.resolve();

const fieldLimits = {
  name: 100,
  phone: 25,
  email: 254,
  address: 250,
  city: 100,
  postalCode: 6,
  interest: 100,
  budget: 80,
  plotSize: 80,
  preferredContact: 20,
  message: 1500,
  selectedListing: 120,
  source: 120,
};

function cleanText(value, limit) {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').trim().slice(0, limit);
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireAdmin(req, res, next) {
  const supplied = req.get('x-admin-token');
  if (!supplied || !safeEqual(supplied, adminToken)) {
    return res.status(401).json({ success: false, message: 'Admin authentication is required.' });
  }
  return next();
}

async function writeExcel(allLeads) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Landora Lead Register';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = 'Property enquiry submissions';
  const sheet = workbook.addWorksheet('Enquiries', {
    views: [{ state: 'frozen', ySplit: 1 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const columns = [
    { header: 'Lead ID', key: 'id', width: 25 },
    { header: 'Submitted At', key: 'createdAt', width: 22 },
    { header: 'Full Name', key: 'name', width: 24 },
    { header: 'Phone Number', key: 'phone', width: 20, style: { numFmt: '@' } },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Address', key: 'address', width: 34 },
    { header: 'City', key: 'city', width: 20 },
    { header: 'PIN Code', key: 'postalCode', width: 12, style: { numFmt: '@' } },
    { header: 'Interest', key: 'interest', width: 24 },
    { header: 'Budget Range', key: 'budget', width: 24 },
    { header: 'Preferred Plot Size', key: 'plotSize', width: 22 },
    { header: 'Preferred Contact', key: 'preferredContact', width: 20 },
    { header: 'Message', key: 'message', width: 48 },
    { header: 'Selected Listing', key: 'selectedListing', width: 28 },
    { header: 'Consent', key: 'consent', width: 12 },
    { header: 'Enquiry Source', key: 'source', width: 24 },
  ];
  sheet.columns = columns;
  sheet.addRows(allLeads.map((lead) => ({
    ...lead,
    createdAt: new Date(lead.createdAt),
    consent: lead.consent ? 'Yes' : 'No',
  })));
  sheet.getRow(1).height = 28;
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF173F35' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFC8A775' } } };
  });
  sheet.getColumn('createdAt').numFmt = 'dd mmm yyyy, hh:mm';
  sheet.getColumn('phone').numFmt = '@';
  sheet.getColumn('postalCode').numFmt = '@';
  sheet.autoFilter = { from: 'A1', to: { row: Math.max(1, allLeads.length + 1), column: columns.length } };
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'top', wrapText: true };
      if (rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F5F0' } };
        });
      }
    }
  });
  await workbook.xlsx.writeFile(workbookPath);
  await fs.chmod(workbookPath, 0o600);
}

async function persistLeads() {
  const nextWrite = writeQueue.catch(() => {}).then(async () => {
    await fs.mkdir(dataDir, { recursive: true });
    const tempPath = `${leadsPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(leads, null, 2), { mode: 0o600 });
    await fs.rename(tempPath, leadsPath);
    await writeExcel(leads);
  });
  writeQueue = nextWrite;
  return nextWrite;
}

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many submissions from this connection. Please try again later.' },
});

app.get('/api/health', (_req, res) => res.json({ success: true, service: 'landora-leads-api' }));

app.post('/api/leads', submitLimiter, async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    // Quietly accept obvious bot submissions, without storing the filled honeypot field.
    if (cleanText(body.website, 200)) return res.status(201).json({ success: true, lead: { id: 'received' } });

    const lead = {};
    for (const [key, limit] of Object.entries(fieldLimits)) lead[key] = cleanText(body[key], limit);
    lead.name = lead.name.replace(/[<>]/g, '');
    lead.phone = lead.phone.replace(/[<>]/g, '');
    lead.email = lead.email.toLowerCase();
    lead.consent = body.consent === true;

    if (lead.name.length < 2) return res.status(400).json({ success: false, message: 'Please enter your full name.' });
    if (!lead.phone) return res.status(400).json({ success: false, message: 'Please enter your phone number.' });
    const digitCount = (lead.phone.match(/\d/g) || []).length;
    if (digitCount < 8 || digitCount > 15 || !/^[0-9+()\s-]+$/.test(lead.phone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number.' });
    }
    if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (lead.postalCode && !/^\d{6}$/.test(lead.postalCode)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit PIN code.' });
    }
    if (!lead.consent) return res.status(400).json({ success: false, message: 'Please provide consent so the team can follow up on this enquiry.' });

    lead.id = crypto.randomUUID();
    lead.createdAt = new Date().toISOString();
    lead.interest = lead.interest || 'General enquiry';
    lead.preferredContact = ['Phone', 'WhatsApp', 'Email'].includes(lead.preferredContact) ? lead.preferredContact : 'Phone';
    lead.selectedListing = lead.selectedListing || 'General enquiry';
    lead.source = lead.source || 'Website enquiry form';

    leads.unshift(lead);
    try {
      await persistLeads();
    } catch (error) {
      leads = leads.filter((item) => item.id !== lead.id);
      throw error;
    }
    return res.status(201).json({ success: true, message: 'Your enquiry has been saved.', lead: { id: lead.id, createdAt: lead.createdAt } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/leads', requireAdmin, (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 5000) : 1000;
  const search = cleanText(typeof req.query.search === 'string' ? req.query.search : '', 100).toLowerCase();
  const filtered = search ? leads.filter((lead) => [lead.name, lead.phone, lead.email, lead.city, lead.address, lead.interest, lead.plotSize, lead.budget].some((value) => String(value || '').toLowerCase().includes(search))) : leads;
  return res.json({ success: true, total: filtered.length, leads: filtered.slice(0, limit) });
});

app.get('/api/leads/export', requireAdmin, async (_req, res, next) => {
  try {
    await writeQueue;
    await fs.access(workbookPath).catch(async () => writeExcel(leads));
    res.setHeader('Cache-Control', 'no-store');
    return res.download(workbookPath, 'landora-leads.xlsx');
  } catch (error) {
    return next(error);
  }
});

app.use(express.static(distPath, { index: false, maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !path.extname(req.path)) {
    return fs.access(path.join(distPath, 'index.html'))
      .then(() => res.sendFile(path.join(distPath, 'index.html')))
      .catch(() => next());
  }
  return next();
});
app.use((req, res) => res.status(404).json({ success: false, message: 'Not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (res.headersSent) return;
  return res.status(500).json({ success: false, message: 'The server could not process this request. Please try again later.' });
});

async function start() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const raw = await fs.readFile(leadsPath, 'utf8');
    const parsed = JSON.parse(raw);
    leads = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    leads = [];
  }
  await persistLeads();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Lead API listening on http://localhost:${port}`);
    if (process.env.NODE_ENV !== 'production' && !process.env.ADMIN_TOKEN) {
      console.log('Local admin token: local-admin-change-me (change this before deployment).');
    }
  });
}

start().catch((error) => {
  console.error('Could not start the lead API:', error);
  process.exit(1);
});
