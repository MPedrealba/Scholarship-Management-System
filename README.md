# EARIST Homepage Clone & Scholarship Management System

An institutional web application inspired by the official **Eulogio "Amang" Rodriguez Institute of Science and Technology** ([EARIST](https://earist.edu.ph/)) website, integrating a dedicated **EARIST Scholarship Management System (e-Scholarship / SFAO)** module and administrative **Weekly Scholarship Accomplishment / Activity Report Generator**.

---

## 🏛️ Institutional Branding & Design Language
- **Primary Institutional Colors:**
  - Institutional Maroon: `#800000` / `#4a0000` / `#6b0000`
  - Gold & Yellow Accents: `#FFC107` / `#D4AF37` / `#FFD700`
  - Clean Off-White Backgrounds: `#F8FAFC` / `#FAFAFA`
- **Official Institutional Identity:** High-fidelity vector SVG reproduction of the EARIST Circular Seal (established 1945, Manila) with technological gear, flame of wisdom, book of knowledge, and Filipino national colors.

---

## 🚀 Key Modules & Architecture

### 1. EARIST Institutional Homepage Clone
- **Top Utility Bar:** Nagtahan Manila campus info, contact phone `(02) 8716-6273`, institutional email `sfao@earist.edu.ph`, Philippine Transparency Seal, Citizen's Charter, Careers, and Quick Access links.
- **Main Header & Navigation (`HeaderNav`):** Responsive institutional navbar featuring the official emblem, college dropdowns (CAS, CBA, CED, CIT, CEN, CAFA, CHM), admissions, services, and the **highlighted "EARIST Scholarship Portal" entry point** with live status indicator.
- **Hero Banner Carousel (`HeroBanner`):** Multi-slide carousel highlighting active 1st Semester A.Y. 2026-2027 scholarship grant filings, institutional history since 1945, admissions screening, and quick CTA routing to the scholarship module.
- **Quick e-Services (`QuickServices`):** Interactive cards showcasing key campus systems, with priority prominence given to the **EARIST Scholarship Portal (e-Scholarship)**.
- **Colleges Grid (`CollegesGrid`):** Overview of EARIST undergraduate colleges, their respective deans, degree programs, and active scholarship grantees monitored.
- **Campus Advisories (`AnnouncementsSection`):** Real-time notices from SFAO and Academic Affairs regarding CHED TDP / TES disbursements.
- **Institutional Footer (`Footer`):** Bagong Pilipinas / PH Transparency Seal compliance, Main Manila and Cavite campus addresses, SFAO office directory, and legal disclosures.

---

### 2. Dedicated Scholarship Management Module (`/scholarships`)
Directly accessible from the main navigation, hero banner, or quick services grid with full URL routing synchronization (`#scholarships` / `/scholarships`).

#### A. Weekly KPI Rollup Cards (`ReportSummaryCards`)
- **Total Applications Submitted this Week** (active in window)
- **Verified / Validated Documents Count** (Registrar seals & grade slips audit)
- **Endorsed & Approved Beneficiaries** (CHED UniFAST qualified count)
- **Flagged or Pending Action Count** (deficiencies requiring student resubmission)
- **Financial Grant Allocation Banner** (Calculated total stipend value earmarked for current filtered beneficiaries)

#### B. Filter & Date Range Controls (`FilterControls`)
- **Date Range Selector:** Flexible Start and End date picking (defaults to the current 7-day week, e.g. Oct 29 – Nov 05, 2026).
- **Quick Presets:** Instant selection for `Current 7 Days`, `Last 14 Days`, and `All Dates`.
- **Scholarship Program Dropdown:** Filter by `CHED TDP`, `Tertiary Education Subsidy (TES)`, `Academic Excellence Grant`, `Barangay/LGU Assistance`, `DOST-SEI Grant`, `Student Assistantship Program (SAP)`, or `All Programs`.
- **Status Selector:** `All`, `Pending Review`, `Approved`, `Endorsed`, and `Flagged`.
- **College Selector:** Filter across CAS, CBA, CED, CIT, CEN, CAFA, and CHM.
- **Real-Time Search:** Search across student names, student IDs (`2023-XXXXX-MN-0`), submission IDs, or degree programs.

#### C. Weekly Data Table (`ScholarshipReportTable`)
- Displays comprehensive columns:
  - `Submission ID` (e.g., `APP-2026-1041`)
  - `Student ID` & `Student Full Name`
  - `Course / Year & Section` & College badge
  - `Scholarship Grant` & Stipend amount
  - `Submission Date` with timestamp
  - `Docs Status` (interactive document verification count)
  - `Verification Status` badge
  - `Assigned Evaluator` (e.g. `Prof. Marlon Santos (SFAO-CAS)`)
  - `Actions` (View full dossier modal, quick inline status change)
- **Batch Processing & Multi-Select:** Select multiple candidate rows to execute bulk actions: `Batch Approve`, `Batch Endorse UniFAST`, `Batch Mark Pending`, and `Export Selected`.
- Realistic sample records for students across all major EARIST colleges.

#### D. Student Application Dossier Modal (`ApplicationDetailsModal`)
- Detailed student profile with GWA, monthly household income, contact details, and course information.
- Interactive **Document Verification Checklist** allowing evaluators to validate or unvalidate submitted documents (Certificate of Registration, Grades, Indigency, Good Moral, etc.).
- Evaluator audit notes editor and flag deficiency tracking.
- Immediate status transitions (`Approve`, `Endorse UniFAST`, `Pending`, `Flag`).

#### E. New Application Registration & Filing (`SubmitApplicationModal`)
- End-to-end student grant intake form with automatic college degree program auto-fill, evaluator routing, and stipend calculation.
- Interactive checklist for uploading certified documents (COR, Grades, Indigency, Good Moral, PhilSys/Student ID).
- Automatic generation of official control numbers (e.g. `APP-2026-XXXX`) and printable confirmation receipt.

#### F. Student Application Status Tracker (`TrackApplicationModal`)
- Self-service student tracking console: search by Student ID or Control Number.
- 4-stage visual progress timeline: *Submission Received*, *Credential Verification Audit*, *Evaluator Deliberation*, and *Endorsement & Disbursement*.
- Actionable deficiency alerts with direct instructions for clearing flagged documents.

#### G. College Breakdown & Financial Analytics (`ScholarshipAnalyticsTab`)
- Executive dashboard tracking total earmarked funds (e.g. PHP 228,000+), cash disbursable sums, and document verification rates.
- College-by-college scholar volume and funding distribution across CAS, CBA, CED, CIT, CEN, CAFA, and CHM.
- Real-time grant portfolio breakdown across CHED TDP, TES, Academic Excellence, LGU, and DOST-SEI.

#### H. Export & Formal Print Capabilities
- **Export Summary (CSV / Excel):** Generates an RFC 4180 compliant CSV download with UTF-8 BOM, including executive KPI rollups and individual candidate rows for spreadsheet processing.
- **Formal Institutional Printable View (`PrintReportModal`):**
  - Formatted Republic of the Philippines and EARIST SFAO letterhead.
  - SFAO Manila contact numbers and UniFAST accreditation badge.
  - Formal tabular rollups and student beneficiaries roster.
  - Tripartite institutional signatory block:
    - *Prepared & Audited by:* Head Scholarship Evaluator, SFAO
    - *Verified & Certified Correct:* Director, SFAO
    - *Approved for Endorsement:* Vice President for Academic Affairs / College President
  - Built-in `@media print` CSS engine for printing or saving directly as clean PDF.

#### I. Data Persistence (`storageUtils`)
- Auto-syncs all student records, document verifications, evaluator notes, and new submissions with browser `localStorage`.
- Includes a 1-click **Reset Demo** control to restore the official seed records anytime.

---

## 🛠️ Tech Stack
- **Framework:** React 19 + TypeScript
- **Bundler & Build Tool:** Vite 8 (builds in ~700ms)
- **Styling:** Tailwind CSS v4 with bespoke institutional theme variables and `@media print` print styles
- **Icons:** Lucide React

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Production Build & Preview
```bash
npm run build
npm run preview
```
