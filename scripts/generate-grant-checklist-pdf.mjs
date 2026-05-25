/**
 * Regenerate public/downloads/RTM_Grant_Checklist.pdf from the HTML source.
 *
 * Windows (Chrome): run from repo root in PowerShell — see GRANT_CHECKLIST_LEADS.md
 * Optional: npm i -D puppeteer && node scripts/generate-grant-checklist-pdf.mjs --puppeteer
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "public", "downloads", "RTM_Grant_Checklist.html");
const pdfPath = path.join(root, "public", "downloads", "RTM_Grant_Checklist.pdf");
const usePuppeteer = process.argv.includes("--puppeteer");

if (usePuppeteer) {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });
  await page.pdf({
    path: pdfPath,
    format: "Letter",
    printBackground: true,
    margin: { top: "0.4in", right: "0.5in", bottom: "0.4in", left: "0.5in" },
  });
  await browser.close();
} else {
  const chromeCandidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ].filter(Boolean);
  const browser = chromeCandidates.find((p) => fs.existsSync(p));
  if (!browser) {
    console.error("Chrome/Edge not found. Install Chrome or run with --puppeteer after npm i -D puppeteer");
    process.exit(1);
  }
  const result = spawnSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${pdfPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!fs.existsSync(pdfPath)) {
  console.error("PDF was not created:", pdfPath);
  process.exit(1);
}
console.log("Wrote", pdfPath);
