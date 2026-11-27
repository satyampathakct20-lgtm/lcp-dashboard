import { chromium } from 'playwright';
import nodemailer from 'nodemailer';

const DASHBOARD_URL = 'https://<your-username>.github.io/lcpdailyreport/';

const today = new Date().toLocaleDateString('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Load dashboard and wait for Supabase data & Chart.js charts to finish rendering
await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle' });
await page.waitForSelector('#tblMaster', { timeout: 20000 });
await page.waitForTimeout(3000);

await page.screenshot({ path: 'lcp-snapshot.png', fullPage: true });
await page.pdf({
  path: 'lcp-snapshot.pdf',
  format: 'A4',
  landscape: true,
  printBackground: true,
});
await browser.close();

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.OUTLOOK_USER,
    pass: process.env.OUTLOOK_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
  },
});

await transporter.sendMail({
  from: `"LCP Daily Report" <${process.env.OUTLOOK_USER}>`,
  to: process.env.MAIL_TO,
  subject: `Limla Cement Plant — Daily Dashboard Snapshot (${today})`,
  html: `
    <p>Please find attached today's automated Limla Cement Plant operations snapshot (${today}).</p>
    <p><a href="${DASHBOARD_URL}">Open Live Interactive Dashboard</a></p>
    <br>
    <img src="cid:dashboard_img" style="max-width:100%; border:1px solid #ddd;" />
  `,
  attachments: [
    { filename: `LCP_Snapshot_${today}.png`, path: 'lcp-snapshot.png', cid: 'dashboard_img' },
    { filename: `LCP_Snapshot_${today}.pdf`, path: 'lcp-snapshot.pdf' },
  ],
});

console.log('Snapshot emailed successfully.');
