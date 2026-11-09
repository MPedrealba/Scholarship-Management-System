export type ScholarshipStatus = 'Pending Review' | 'Approved' | 'Endorsed' | 'Flagged';

export type ScholarshipProgram =
  | 'CHED TDP'
  | 'Tertiary Education Subsidy (TES)'
  | 'Academic Excellence Grant'
  | 'Barangay/LGU Assistance'
  | 'DOST-SEI Grant'
  | 'Student Assistantship Program (SAP)';

export type CollegeCode = 'CAS' | 'CBA' | 'CED' | 'CIT' | 'CEN' | 'CAFA' | 'CHM';

export type UserRoleType = 'student' | 'evaluator' | 'superadmin';

export interface AuthUser {
  role: UserRoleType;
  name: string;
  email: string;
  college?: CollegeCode;
  collegeName?: string;
  title: string;
}

export interface ApplicationAuditEntry {
  id: string;
  evaluatorName: string;
  role: string;
  action: string;
  remarks?: string;
  timestamp: string;
}

export interface DocumentChecklist {
  id: string;
  name: string;
  verified: boolean;
  required: boolean;
  uploadedAt: string;
  fileSize: string;
  mimeType?: string; // e.g. 'application/pdf' | 'image/png'
  documentType?: 'cor' | 'grades' | 'indigency' | 'validId' | string;
  fileUrl?: string;
}

export interface ScholarshipApplication {
  id: string;
  studentId: string;
  studentName: string;
  college: CollegeCode;
  collegeName: string;
  course: string;
  yearAndSection: string;
  program: ScholarshipProgram;
  submissionDate: string; // ISO date string
  status: ScholarshipStatus;
  assignedEvaluator: string;
  gwa: number;
  monthlyHouseholdIncome: number;
  contactNumber: string;
  email: string;
  attachedDocuments: DocumentChecklist[];
  evaluatorNotes: string;
  flagReason?: string;
  lastUpdated: string;
  stipendAmount: number;
  auditTrail?: ApplicationAuditEntry[];
}

export interface ReportFilterState {
  startDate: string;
  endDate: string;
  program: string;
  status: string;
  college: string;
  searchQuery: string;
}

export interface ReportSummaryKPIs {
  totalSubmitted: number;
  verifiedDocuments: number;
  approvedOrEndorsed: number;
  flaggedOrPending: number;
  approvedCount: number;
  endorsedCount: number;
  pendingCount: number;
  flaggedCount: number;
  totalGrantAllocation: number;
}

export interface HeroSlide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  secondaryCtaText: string;
  ctaAction: 'scholarships' | 'admissions' | 'news';
  bgGradient: string;
  tag: string;
}

export interface QuickServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  href?: string;
  isPortalEntry?: boolean;
  badge?: string;
  colorScheme: 'maroon' | 'gold' | 'blue' | 'emerald';
}

export interface AnnouncementItem {
  id: string;
  date: string;
  title: string;
  category: 'Scholarship' | 'Academic' | 'Advisory' | 'Event';
  summary: string;
  author: string;
}

export interface CollegeInfo {
  code: CollegeCode;
  name: string;
  dean: string;
  programsCount: number;
  activeGrantees: number;
  iconName: string;
}
