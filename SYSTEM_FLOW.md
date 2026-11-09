# EARIST e-Scholarship Management System (SFAO) — Visual System Flow & Architecture
**Document Version:** 2.4.0-PROD  
**Classification:** Institutional Capstone / Enterprise Technical Architecture  
**Author:** Senior Principal Software Architect & Technical Lead  
**Target Institution:** Eulogio "Amang" Rodriguez Institute of Science and Technology (EARIST)  
**Governing Body:** Office of Student Financial Assistance (SFAO) & CHED UniFAST Board  
**Target Standard:** ISO/IEC 25010 Quality Model & RA 10173 (Data Privacy Act of 2012)

---

## 1. High-Level Architecture

The system implements a decoupled modern web architecture separating the high-traffic public student portal from the authenticated, high-security SFAO evaluator workstation, administrative analytics core, background audit workers, and external regulatory reporting bridges.

```mermaid
flowchart TB
    %% Client Tier
    subgraph CLIENT_TIER["Client Layer (Presentation Tier)"]
        direction TB
        c_student["Public Student & Beneficiary Web App<br/>(React 19 + Tailwind v4 + Lucide)"]
        c_evaluator["SFAO Evaluator Workstation<br/>(Dossier Modal + Multi-Doc Viewer)"]
        c_admin["Executive & Director Analytics Portal<br/>(KPI Cards + Batch Masterlist Engine)"]
        c_print["Print Engine (@media print)<br/>(Tripartite Formal Signatory View)"]
    end

    %% Security & Edge Gateway
    subgraph GATEWAY_TIER["Edge Gateway & Security Layer"]
        direction TB
        gw_waf["Cloudflare / Reverse Proxy WAF<br/>(DDoS Protection + SSL/TLS 1.3 Termination)"]
        gw_ratelimit["Rate Limiter & Quota Gatekeeper<br/>(Bucket Algorithm: 60 req/min per IP)"]
        gw_cors["CORS & Security Headers<br/>(CSP, HSTS, X-Content-Type, X-Frame-Options)"]
        gw_jwt["JWT Auth Guard & Session Validator<br/>(HttpOnly Cookie + Role-Based Access Control)"]
    end

    %% Application & API Layer
    subgraph API_TIER["Backend Services & Application Logic"]
        direction TB
        api_auth["Auth & Identity Service<br/>(Bcrypt, Salt Rounds 12, JWT Issuance)"]
        api_intake["Application Intake & Validation Router<br/>(Schema Validation, Sanitization)"]
        api_eval["Evaluator Audit & Deliberation Engine<br/>(Checklist Toggle, Status Mutation)"]
        api_batch["Batch Operations & Quota Arbiter<br/>(Bulk Approve, Endorse, Cap Enforcer)"]
        api_export["Export & Reporting Microservice<br/>(RFC 4180 CSV + PDF Document Assembly)"]
    end

    %% Processing Workers & Microservices
    subgraph WORKER_TIER["AI & Processing Microservices"]
        direction TB
        proc_doccheck["Document Integrity & Quota Validator<br/>(2MB File Limit, PDF/PNG MIME Guard)"]
        proc_scorer["GWA & Indigency Scoring Engine<br/>(Multi-Criteria Weighted Prioritization)"]
        proc_notif["Notification Dispatcher Worker<br/>(SMS Gateway + Automated Email Alerts)"]
        proc_audit["Immutable Audit Log Daemon<br/>(SHA-256 Event Hashing & Action Trails)"]
    end

    %% External Infrastructure & Cloud
    subgraph EXT_TIER["External Cloud Integrations & Gateways"]
        direction TB
        ext_s3["Cloudinary / S3 Document Store<br/>(Presigned Encrypted Uploads, COR/Grades)"]
        ext_sms["Philippine SMS Gateway (Semaphore/Twilio)<br/>(Deficiency & Endorsement Notices)"]
        ext_ched["CHED UniFAST National Portal API<br/>(Masterlist Ingest & Disbursement Sync)"]
        ext_email["SMTP / SendGrid Mailer<br/>(Institutional Acknowledgments)"]
    end

    %% Persistence Layer
    subgraph DB_TIER["Data Persistence & State Management"]
        direction TB
        db_sql["PostgreSQL Primary Database<br/>(Relational Integrity, Foreign Keys, ACID)"]
        db_cache["Redis In-Memory Cache<br/>(Session Cache, Live Quota Limits, Rate Counters)"]
        db_local["Client Browser LocalStorage<br/>(Offline Cache & High-Speed Hydration)"]
    end

    %% Connections
    c_student -->|HTTPS / REST| gw_waf
    c_evaluator -->|HTTPS / Bearer Auth| gw_waf
    c_admin -->|HTTPS / Master Token| gw_waf
    c_print -->|Local CSS Print Hook| c_admin

    gw_waf --> gw_ratelimit
    gw_ratelimit --> gw_cors
    gw_cors --> gw_jwt

    gw_jwt -->|Public Routes| api_intake
    gw_jwt -->|Auth Required| api_auth
    gw_jwt -->|Evaluator Guard| api_eval
    gw_jwt -->|Admin Guard| api_batch
    gw_jwt -->|Authorized Reports| api_export

    api_intake --> proc_doccheck
    api_intake --> proc_scorer
    api_eval --> proc_audit
    api_batch --> proc_notif

    proc_doccheck -->|Presigned Storage Call| ext_s3
    proc_notif -->|SMS Dispatch| ext_sms
    proc_notif -->|Email Alerts| ext_email
    api_export -->|UniFAST Export API| ext_ched

    api_auth --> db_sql
    api_intake --> db_sql
    api_eval --> db_sql
    api_batch --> db_sql
    api_batch --> db_cache
    c_student -.->|Browser Cache Sync| db_local
```

---

## 2. Authentication & Authorization Flow

The system employs a zero-trust, role-segregated authentication architecture. Evaluators and administrators authenticate using cryptographically salted credentials, receiving an ephemeral JSON Web Token (`JWT`) packaged inside an `HttpOnly`, `SameSite=Strict`, `Secure` cookie to mitigate Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF).

```mermaid
sequenceDiagram
    autonumber
    actor User as SFAO Evaluator / Admin
    participant Browser as Client Browser (React)
    participant Gateway as API Gateway / Auth Guard
    participant AuthService as Auth Microservice
    participant Database as PostgreSQL (Users Table)
    participant AuditLog as Audit Daemon

    Note over User,Browser: 1. Evaluator Login Initiation
    User->>Browser: Enters institutional email (@earist.edu.ph) & Password
    Browser->>Gateway: POST /api/v1/auth/login (TLS 1.3)
    Gateway->>Gateway: Enforce IP Rate Limiting (5 attempts / 15 mins)

    Note over Gateway,AuthService: 2. Credential Verification & Hash Comparison
    Gateway->>AuthService: Delegate credentials payload
    AuthService->>Database: SELECT id, password_hash, role, college, is_active FROM users WHERE email = ?
    Database-->>AuthService: Return User Record
    AuthService->>AuthService: bcrypt.compare(inputPassword, storedHash, saltRounds=12)

    alt Password Invalid or Account Inactive
        AuthService->>AuditLog: Log Failed Auth Attempt (IP, Email, Timestamp)
        AuthService-->>Gateway: 401 Unauthorized ("Invalid credentials")
        Gateway-->>Browser: 401 Unauthorized Response
        Browser-->>User: Display error banner & lockout counter
    else Password Valid
        AuthService->>AuthService: Sign JWT Payload {userId, role, college, exp: 8h, iss: 'earist-sfao'}
        AuthService->>AuditLog: Record Successful Login (User ID, College, Role)
        AuthService-->>Gateway: Set-Cookie: token=JWT; HttpOnly; Secure; SameSite=Strict; Path=/
        Gateway-->>Browser: 200 OK + { user: { name, role, college, permissions } }
        Browser->>Browser: Store user state in memory; Redirect to /scholarships#evaluator
        Browser-->>User: Render Evaluator Masterlist Workspace
    end

    Note over User,Browser: 3. Subsequent Protected API Invocation
    User->>Browser: Clicks "Batch Approve Candidates"
    Browser->>Gateway: PATCH /api/v1/applications/batch-status + HttpOnly Cookie
    Gateway->>Gateway: Extract & Verify JWT Signature (RS256 with Public Key)
    Gateway->>Gateway: Check Role Claims (Required: 'EVALUATOR' or 'ADMIN')
    
    alt Unauthorized Role
        Gateway-->>Browser: 403 Forbidden ("Insufficient institutional privilege")
    else Authorized
        Gateway->>AuthService: Inject x-user-id, x-user-role, x-user-college headers
        Gateway->>Database: Execute batch update transaction
        Database-->>Gateway: Updated 12 candidate records
        Gateway->>AuditLog: Log Batch Action (Admin ID, Scope: CAS/CEN, Count: 12)
        Gateway-->>Browser: 200 OK { success: true, count: 12 }
        Browser-->>User: Re-render table with "Approved" status badges & toast
    end
```

---

## 3. Role-Based Routing Table

The system enforces strict boundary isolation across public applicants, departmental evaluators, system administrators, and executive signatories.

| Route / URI Path | Allowed Roles | Middleware & Security Guards | Redirection on Unauthorized | Portal Entry Point / View Component |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `Public`, `Guest`, `Student` | None (Public cache headers enabled) | N/A | `HeaderNav` + `HeroBanner` + `CollegesGrid` |
| `/#scholarships` or `/scholarships` | `Public`, `Student` | Public view mode default; sanitization | N/A | `ScholarshipModule (viewMode='public')` |
| `/scholarships/apply` | `Public`, `Student` | Session throttle, 2MB payload guard | Return to `/scholarships` | `SubmitApplicationModal` |
| `/scholarships/track` | `Public`, `Student` | Rate limit (20 req/min), anti-enumeration | Return to `/scholarships` | `TrackApplicationModal` |
| `/scholarships#evaluator` | `Evaluator`, `Admin`, `SFAO Director` | `requireAuth()`, `requireRole(['EVALUATOR', 'ADMIN'])` | `/scholarships` (with Login modal) | `ScholarshipModule (viewMode='evaluator')` |
| `/api/v1/applications/list` | `Evaluator`, `Admin` | JWT verification, College tenancy scope | HTTP 401 / 403 JSON | `ScholarshipReportTable` |
| `/api/v1/applications/:id` | `Evaluator`, `Admin` | JWT verification, College tenancy check | HTTP 403 Forbidden | `ApplicationDetailsModal` |
| `/api/v1/applications/batch` | `Admin`, `SFAO Director` | `requireRole(['ADMIN'])`, CSRF token check | HTTP 403 Forbidden | Batch Action Bar (`ScholarshipReportTable`) |
| `/scholarships#analytics` | `Admin`, `SFAO Director`, `VPAA` | `requireRole(['ADMIN', 'DIRECTOR'])` | `/scholarships#evaluator` | `ScholarshipAnalyticsTab` |
| `/scholarships/print-report` | `Evaluator`, `Admin`, `Director` | JWT verify + print layout CSS trigger | `/scholarships` | `PrintReportModal` |
| `/api/v1/export/csv` | `Evaluator`, `Admin` | JWT verify, RFC 4180 UTF-8 BOM generator | HTTP 401 Unauthorized | `exportApplicationsToCSV` |

---

## 4. Primary User Workflows

The system encompasses four distinct operational vectors: Student Applicant, SFAO Evaluator, Executive Director, and Institutional Signatory.

```mermaid
flowchart LR
    %% Workflow A: Student
    subgraph WF_STUDENT["A. Student Beneficiary Journey"]
        direction LR
        s1["Visit Public Portal"] --> s2["Explore Grant Catalog<br/>(TES, TDP, DOST, LGU)"]
        s2 --> s3["Launch Online Application"]
        s3 --> s4["Upload Mandatory Docs<br/>(COR, Grades, Indigency, ID)"]
        s4 --> s5["Receive Control #<br/>(APP-2026-XXXX)"]
        s5 --> s6["Self-Service Status Tracker"]
        s6 --> s7["Resolve Document Flags / Deficiencies"]
    end

    %% Workflow B: Evaluator
    subgraph WF_EVALUATOR["B. Departmental Evaluator Workflow"]
        direction LR
        e1["Authenticate with SFAO Credentials"] --> e2["Filter by College<br/>(e.g., CAS, CEN, CBA)"]
        e2 --> e3["Open Student Application Dossier"]
        e3 --> e4["Audit Attached Credentials<br/>(Validate COR & Dean's Seal)"]
        e4 --> e5{"Fulfills GWA & Income Criteria?"}
        e5 -->|Deficiency Found| e6["Flag Application<br/>(Log Required Revision)"]
        e5 -->|Compliant| e7["Mark Documents Verified<br/>(Endorse for UniFAST)"]
    end

    %% Workflow C: Administrator
    subgraph WF_ADMIN["C. SFAO Director / Admin Operations"]
        direction LR
        a1["Access Executive Analytics Tab"] --> a2["Review Quota Capacity Limits<br/>(TES: 50, TDP: 40, DOST: 20)"]
        a2 --> a3["Select Multi-Candidate Batches"]
        a3 --> a4["Execute Bulk Approval / Endorsement"]
        a4 --> a5["Generate RFC 4180 CSV Masterlist"]
        a5 --> a6["Transmit UniFAST Endorsement"]
    end

    %% Workflow D: Executive Signatory
    subgraph WF_SIGNATORY["D. Formal Tripartite Signatory Flow"]
        direction LR
        sg1["Open Weekly Accomplishment View"] --> sg2["Audit Earmarked Funds & Beneficiary Count"]
        sg2 --> sg3["Render Formal SFAO Letterhead"]
        sg3 --> sg4["Signatory 1: SFAO Evaluator Review"]
        sg4 --> sg5["Signatory 2: SFAO Director Certification"]
        sg5 --> sg6["Signatory 3: VPAA Final Approval"]
        sg6 --> sg7["Export Official Archival PDF"]
    end
```

---

## 5. Core Specialized Processing Pipelines

### Pipeline 1: Multi-Document Verification & Quota Ingestion Engine

```mermaid
flowchart TB
    start_doc["Document File Ingest (COR, Grades, Indigency, Valid ID)"] --> check_size{"Payload Size Check<br/>(Strict 2MB Quota)"}
    
    check_size -->|Size > 2MB| err_size["Reject 413: 'Exceeds 2MB file limit'"]
    check_size -->|Size <= 2MB| check_mime{"MIME Type Validation"}
    
    check_mime -->|Invalid Type| err_mime["Reject 415: 'Only PDF and PNG files allowed'"]
    check_mime -->|application/pdf or image/png| virus_scan["Virus & Malicious Script Buffer Scan"]
    
    virus_scan -->|Threat Detected| err_sec["Quarantine & Emit Security Alert"]
    virus_scan -->|Clean Buffer| hash_gen["Compute SHA-256 Content Checksum"]
    
    hash_gen --> upload_s3["Upload to Encrypted Blob Storage (S3 / Cloudinary)"]
    upload_s3 --> create_rec["Create DocumentChecklist Record (verified: false)"]
    create_rec --> update_dossier["Attach to ScholarshipApplication State"]
    update_dossier --> emit_ready["Trigger Automated Scorer & Evaluator Queue"]
```

### Pipeline 2: GWA & Socio-Economic Priority Scoring Engine

The priority score matrix evaluates student qualification based on General Weighted Average (academic performance) and declared Monthly Household Income (economic vulnerability) in accordance with CHED UniFAST memorandum circulars.

```mermaid
flowchart TB
    start_eval["Intake Candidate Application"] --> parse_acad["Extract General Weighted Average (GWA)"]
    start_eval --> parse_inc["Extract Monthly Household Income"]

    parse_acad --> calc_acad{"GWA Evaluation"}
    calc_acad -->|GWA 1.00 - 1.45| score_acad_hi["Academic Score: 50 / 50<br/>(President's / Dean's List Tier)"]
    calc_acad -->|GWA 1.46 - 1.75| score_acad_med["Academic Score: 40 / 50<br/>(Honors Tier)"]
    calc_acad -->|GWA 1.76 - 2.50| score_acad_reg["Academic Score: 30 / 50<br/>(Good Standing Tier)"]
    calc_acad -->|GWA > 2.50| score_acad_low["Academic Score: 10 / 50<br/>(Conditional / Ineligible for Honors)"]

    parse_inc --> calc_inc{"Income Evaluation"}
    calc_inc -->|Income <= PHP 10,000| score_inc_hi["Economic Need: 50 / 50<br/>(DSWD 4Ps / Indigent Tier)"]
    calc_inc -->|Income PHP 10,001 - 20,000| score_inc_med["Economic Need: 40 / 50<br/>(Low Income Tier)"]
    calc_inc -->|Income PHP 20,001 - 35,000| score_inc_low["Economic Need: 25 / 50<br/>(Lower-Middle Income Tier)"]
    calc_inc -->|Income > PHP 35,000| score_inc_none["Economic Need: 10 / 50<br/>(Disqualified from Need-Based Grants)"]

    score_acad_hi & score_acad_med & score_acad_reg & score_acad_low --> agg_score["Aggregate Priority Score = (Academic * 0.50) + (Need * 0.50)"]
    score_inc_hi & score_inc_med & score_inc_low & score_inc_none --> agg_score

    agg_score --> check_quota{"Check Program Cap & Quotas<br/>(TES: 50 | TDP: 40 | DOST: 20)"}
    check_quota -->|Quota Available| auto_queue["Rank in Evaluator Priority Queue<br/>Status: Pending Review"]
    check_quota -->|Quota Full| waitlist_queue["Assign Waitlist Flag<br/>Status: Pending Capacity Release"]
```

---

## 6. Secondary & Client User Portal Flow

The public-facing student journey provides transparency from initial landing to final stipend disbursement tracking.

```mermaid
flowchart TD
    p_land["Student visits EARIST SFAO Portal"] --> p_explore["Browses Active Grants Catalog<br/>(Filter by: All, National, Institutional, LGU)"]
    p_explore --> p_decision{"Student Intent"}

    %% Track Intent
    p_decision -->|Track Existing Application| p_track_open["Open Track Application Modal"]
    p_track_open --> p_track_input["Enter Student ID (e.g., 2024-05189-MN-0)<br/>or Control # (APP-2026-1041)"]
    p_track_input --> p_track_fetch["Query Status & Deficiency Logs"]
    p_track_fetch --> p_track_display["Render 4-Stage Interactive Timeline:<br/>1. Received -> 2. Audited -> 3. Deliberation -> 4. Disbursed"]
    
    p_track_display --> p_def_check{"Are there Flagged Deficiencies?"}
    p_def_check -->|Yes| p_resolve["Display Deficiency Banner & Required Documents"]
    p_resolve --> p_reupload["Upload Corrected COR / Indigency Certificate"]
    p_reupload --> p_track_submit["Update Application to 'Pending Review'"]
    p_def_check -->|No| p_done_track["Student monitors disbursement release"]

    %% Apply Intent
    p_decision -->|File New Application| p_apply_open["Click 'Apply Online' / 'Apply for Scholarship'"]
    p_apply_open --> p_form_fill["Fill Student Profile:<br/>Name, College (CAS/CBA/CED/CIT/CEN/CAFA/CHM), Course, GWA, Income"]
    p_form_fill --> p_prog_select["Select Grant Program (Auto-populates Stipend amount)"]
    p_prog_select --> p_doc_upload["Drag-and-Drop 4 Mandatory Documents (COR, Grades, Indigency, ID)"]
    p_doc_upload --> p_validate{"Client-Side Pre-Flight Check"}
    
    p_validate -->|Missing Mandatory Docs or Size > 2MB| p_err_prompt["Show Alert & Highlight Invalid Input"]
    p_err_prompt --> p_form_fill
    
    p_validate -->|Valid| p_submit_action["Dispatch POST /applications"]
    p_submit_action --> p_gen_control["Generate Official Tracking ID (APP-2026-XXXX)"]
    p_gen_control --> p_receipt["Render Official Submission Receipt with Printable Summary"]
    p_receipt --> p_track_open
```

---

## 7. Administrative & Executive Dashboard Flow

```mermaid
flowchart TD
    admin_auth["Administrator Authenticated"] --> dash_hub["SFAO Central Management Dashboard"]
    
    dash_hub --> view_cards["Weekly KPI Summary Cards:<br/>- Total Submitted<br/>- Verified Documents Rate<br/>- Endorsed Beneficiaries<br/>- Flagged Action Items<br/>- Total Earmarked Allocation (PHP)"]
    
    dash_hub --> filter_pane["Multi-Dimensional Filter Bar:<br/>- Date Presets (7 Days, 14 Days, All)<br/>- Grant Program (TES, TDP, DOST, etc.)<br/>- College Filter (CAS, CBA, CED, CIT, CEN, CAFA, CHM)<br/>- Live Search (Name, Student ID, Course)"]
    
    filter_pane --> master_table["Interactive Masterlist Data Table"]
    
    master_table --> row_action{"Evaluator Action"}
    
    row_action -->|Single Candidate| dossier_modal["Open Application Details Dossier"]
    dossier_modal --> doc_toggle["Interactive Verification Checklist<br/>(Toggle verified flag on COR, Grades, Indigency)"]
    doc_toggle --> add_notes["Append Evaluator Audit Remarks & Flag Reasons"]
    add_notes --> mutate_status["Mutate Status: Approved / Endorsed / Flagged"]
    
    row_action -->|Multi-Select Batch| batch_ops["Batch Processing Bar"]
    batch_ops --> b_app["Bulk Mark 'Approved'"]
    batch_ops --> b_end["Bulk Mark 'Endorsed UniFAST'"]
    batch_ops --> b_pen["Bulk Mark 'Pending Review'"]
    batch_ops --> b_exp["Export Selected Masterlist"]
    
    dash_hub --> analytics_tab["College Breakdown & Portfolio Analytics"]
    analytics_tab --> chart_alloc["Financial Grant Allocation by College"]
    analytics_tab --> chart_quota["Real-Time Quota Utilization Gauges"]
    
    dash_hub --> export_engine["Export & Formal Output Suite"]
    export_engine --> rfc_csv["Generate RFC 4180 CSV Masterlist with UTF-8 BOM"]
    export_engine --> print_modal["Formal Printable Weekly Accomplishment Report<br/>- Republic of the Philippines Letterhead<br/>- Tripartite Signatory Blocks<br/>- Ready for A4 / Letter PDF Export"]
```

---

## 8. Data Model Relationships

The schema guarantees referential integrity, supporting many-to-one departmental mappings, audit trail links, and document verification structures.

```mermaid
erDiagram
    STUDENT ||--o{ APPLICATION : "submits"
    COLLEGE ||--o{ STUDENT : "enrolls"
    COLLEGE ||--o{ EVALUATOR : "employs"
    PROGRAM ||--o{ APPLICATION : "funds"
    APPLICATION ||--o{ DOCUMENT : "contains"
    APPLICATION ||--o{ AUDIT_LOG : "generates"
    EVALUATOR ||--o{ APPLICATION : "evaluates"
    APPLICATION ||--o{ DISBURSEMENT : "qualifies_for"

    STUDENT {
        string student_id PK "Unique EARIST ID (e.g., 2024-05189-MN-0)"
        string first_name "Given student name"
        string last_name "Surname"
        string email UK "Institutional or verified personal email"
        string contact_number "Mobile telephone number"
        string college_code FK "Foreign key to COLLEGE"
        string course "Degree title (e.g. BSCS)"
        string year_and_section "e.g. 2nd Year - CS-2A"
        decimal gwa "General Weighted Average (1.00 - 5.00)"
        decimal monthly_household_income "Declared family income in PHP"
        datetime created_at "Registration timestamp"
    }

    COLLEGE {
        string code PK "CAS, CBA, CED, CIT, CEN, CAFA, CHM"
        string full_name "Full official name of College"
        string dean_name "Presiding Dean"
        int programs_count "Number of recognized degree programs"
    }

    PROGRAM {
        string program_id PK "e.g., CHED-TDP, UNIFAST-TES, DOST-SEI"
        string name "Official Program Title"
        decimal stipend_amount "Allocated semester stipend in PHP"
        int max_quota "Maximum grant capacity"
        string funding_agency "CHED, DOST, LGU, EARIST"
        boolean is_active "Active intake status"
    }

    APPLICATION {
        string id PK "Control Number (APP-2026-XXXX)"
        string student_id FK "References STUDENT(student_id)"
        string program_id FK "References PROGRAM(program_id)"
        string college_code FK "References COLLEGE(code)"
        string status "Pending Review | Approved | Endorsed | Flagged"
        decimal stipend_amount "Allocated grant value"
        string assigned_evaluator FK "Assigned SFAO evaluator name"
        string evaluator_notes "Audit remarks and evaluation notes"
        string flag_reason "Deficiency explanation if flagged"
        datetime submission_date "Timestamp of intake"
        datetime last_updated "Timestamp of last status alteration"
    }

    DOCUMENT {
        string id PK "Unique UUID"
        string application_id FK "References APPLICATION(id)"
        string document_type "cor | grades | indigency | valid_id"
        string file_name "Original stored file name"
        string file_url "Encrypted blob object URI"
        int file_size_bytes "Size in bytes"
        boolean verified "Evaluator audit verification state"
        boolean required "Mandatory submission flag"
        datetime uploaded_at "Upload timestamp"
    }

    EVALUATOR {
        string id PK "Evaluator UUID"
        string email UK "Institutional email (@earist.edu.ph)"
        string full_name "Full name with academic title"
        string role "EVALUATOR | SFAO_DIRECTOR | SYSTEM_ADMIN"
        string college_code FK "Departmental assignment"
        string password_hash "Bcrypt salted hash"
        boolean is_active "Employment status"
    }

    AUDIT_LOG {
        string id PK "Sequential bigserial or UUID"
        string application_id FK "References APPLICATION(id)"
        string actor_id "ID of User performing action"
        string action "STATUS_MUTATED | DOC_VERIFIED | EXPORT_GENERATED"
        string previous_state "Snapshot before mutation"
        string new_state "Snapshot after mutation"
        string ip_address "Origin IPv4/IPv6"
        datetime timestamp "Immutable creation time"
    }

    DISBURSEMENT {
        string id PK "Disbursement record UUID"
        string application_id FK "References APPLICATION(id)"
        string batch_code "CHED-DISB-2026-B1"
        decimal amount "Disbursed PHP amount"
        string release_channel "Landbank Cash Card | SFAO Cashier"
        string release_status "Scheduled | Disbursed | Awaiting Claim"
        datetime release_date "Disbursement date"
    }
```

---

## 9. Core State Machine / Lifecycle

The state machine governs the end-to-end lifecycle of a scholarship candidate application, enforcing strict transactional transition rules and deficiency rollback mechanisms.

```mermaid
stateDiagram-v2
    [*] --> Draft : Student initiates application modal

    Draft --> PendingReview : Submit application with all 4 mandatory docs
    Draft --> [*] : Student abandons form

    state PendingReview {
        [*] --> InIntakeQueue
        InIntakeQueue --> EvaluatorAssigned : Auto-routed to College Evaluator
        EvaluatorAssigned --> DocumentAudit : Evaluator opens dossier
    }

    PendingReview --> Flagged : Evaluator detects deficient / blurred / unsealed document
    
    state Flagged {
        [*] --> DeficiencyNotified
        DeficiencyNotified --> StudentRevision : Student accesses self-service tracker
        StudentRevision --> DocumentReuploaded : Uploads corrected document
    }

    Flagged --> PendingReview : Student submits resolved credentials
    Flagged --> Rejected : Deficiency unaddressed past 14-day deadline

    PendingReview --> Endorsed : All documents verified & GWA/Income criteria met
    
    state Endorsed {
        [*] --> UniFASTQueue
        UniFASTQueue --> MasterlistExported : Added to Weekly Accomplishment Masterlist
    }

    Endorsed --> Approved : SFAO Director & Executive Signatories approve allocation
    
    state Approved {
        [*] --> EarmarkedFundAllocated
        EarmarkedFundAllocated --> ReadyForPayroll : Transmitted to Accounting / Cashier
    }

    Approved --> Disbursed : Stipend released via Landbank Cash Card / UniFAST Check
    
    Disbursed --> Archived : End of Academic Term audit reconciliation
    Rejected --> Archived : Permanent audit retention (RA 10173 compliant)
    
    Archived --> [*]
```

---

## 10. Complete Request/Response Cycle

This trace illustrates the end-to-end lifecycle when an evaluator reviews an application, verifies the Certificate of Registration, mutates the candidate's status to **Endorsed**, triggers the immutable audit trail, updates quota cache, and dispatches a real-time notification to the student.

```mermaid
sequenceDiagram
    autonumber
    actor Evaluator as SFAO Evaluator
    participant UI as Evaluator Workspace (React)
    participant Gateway as API Gateway (Rate Limit + JWT Guard)
    participant AppController as Applications Controller
    participant Service as Application Review Service
    participant DB as PostgreSQL Database
    participant Cache as Redis Quota Cache
    participant Worker as Background Notification Worker
    participant Student as Student Beneficiary

    Evaluator->>UI: Checks "Certificate of Registration Verified" & clicks "Endorse UniFAST"
    UI->>UI: Optimistically update local application state
    UI->>Gateway: PATCH /api/v1/applications/APP-2026-1041/status<br/>{ status: 'Endorsed', verifiedDocId: 'doc_cor_01', notes: 'COR authenticated' }
    
    Gateway->>Gateway: Validate JWT claims (Role: 'EVALUATOR', College: 'CAS')
    Gateway->>AppController: Forward request with x-user-id: 'eval_santos_m'
    
    AppController->>Service: handleStatusUpdate(appId, newStatus, evaluatorId, notes)
    
    Note over Service,DB: Begin ACID Transaction
    Service->>DB: UPDATE documents SET verified = true WHERE id = 'doc_cor_01'
    Service->>DB: UPDATE applications SET status = 'Endorsed', evaluator_notes = ?, last_updated = NOW() WHERE id = 'APP-2026-1041'
    Service->>DB: INSERT INTO audit_logs (app_id, actor_id, action, old_status, new_status, timestamp) VALUES (...)
    DB-->>Service: Transaction Committed Successfully
    Note over Service,DB: End ACID Transaction

    Service->>Cache: INCR program:UNIFAST-TES:endorsed_count
    Cache-->>Service: New Count: 46 / 50
    
    Service->>Worker: Enqueue Task: 'NOTIFY_STUDENT_STATUS'<br/>{ studentId: '2024-05189-MN-0', status: 'Endorsed', program: 'CHED UniFAST TES' }
    
    Service-->>AppController: Return updated application payload & quota summary
    AppController-->>Gateway: HTTP 200 OK + JSON { success: true, application: {...} }
    Gateway-->>UI: HTTP 200 OK
    UI-->>Evaluator: Display Green Toast "Application APP-2026-1041 Endorsed Successfully"

    par Asynchronous Notification Delivery
        Worker->>Worker: Fetch student contact information (+63 917 555 0192)
        Worker->>Student: Send Philippine SMS: "EARIST SFAO: Good day! Your CHED UniFAST TES application (APP-2026-1041) has been officially ENDORSED."
    end
```
