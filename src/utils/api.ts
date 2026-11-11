import type {
  ScholarshipApplication,
  ScholarshipStatus,
  NotificationItem,
  AcademicTerm,
  StorageStatusResponse,
} from '../types';

export interface QuotaRecord {
  id?: string;
  _id?: string;
  grantType: string;
  totalSlots: number;
  allocatedSlots: number;
  isLocked: boolean;
  remainingSlots?: number;
  baseline?: number;
  stipendPerSem?: number;
  agency?: string;
}

export interface AuditLogRecord {
  _id?: string;
  timestamp: string;
  userEmail: string;
  userName?: string;
  role: string;
  action: string;
  details?: string;
  applicationNo?: string;
  ipAddress?: string;
  sessionHash?: string;
}

export interface UserRecord {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'student' | 'evaluator' | 'admin';
  college?: string | null;
  studentNumber?: string | null;
  employeeId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE = '/api';

/**
 * Helper to construct request headers including Bearer JWT token if authenticated
 */
export function getAuthHeaders(isJson: boolean = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('earist_sfao_jwt');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

/**
 * 1. Fetch applications with optional query filters
 */
export async function fetchApplicationsApi(filters?: {
  college?: string;
  grant?: string;
  status?: string;
  search?: string;
  term?: string;
}): Promise<ScholarshipApplication[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.college && filters.college !== 'All' && filters.college !== 'All Colleges') {
      params.append('college', filters.college);
    }
    if (filters?.grant && filters.grant !== 'All' && filters.grant !== 'All Programs') {
      params.append('grant', filters.grant);
    }
    if (filters?.status && filters.status !== 'All') {
      params.append('status', filters.status);
    }
    if (filters?.term && filters.term !== 'All') {
      params.append('term', filters.term);
    }
    if (filters?.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }

    const res = await fetch(`${API_BASE}/applications?${params.toString()}`, {
      headers: getAuthHeaders(false),
    });
    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('API applications fetch failed, using fallback:', err);
    throw err;
  }
}

/**
 * 2. Track application by studentId or applicationNo
 */
export async function trackApplicationApi(query: string): Promise<ScholarshipApplication> {
  const res = await fetch(`${API_BASE}/applications/track/${encodeURIComponent(query.trim())}`);
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `No record found for "${query}"`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * 3. Submit new application (FormData or JSON)
 */
export async function submitApplicationApi(
  payload: FormData | Record<string, unknown>
): Promise<{ success: boolean; application: ScholarshipApplication; referenceNumber: string }> {
  const isFormData = payload instanceof FormData;
  const res = await fetch(`${API_BASE}/applications`, {
    method: 'POST',
    headers: isFormData ? getAuthHeaders(false) : getAuthHeaders(true),
    body: isFormData ? payload : JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to submit scholarship application.');
  }
  return json;
}

/**
 * 4. Update application status
 */
export async function updateApplicationStatusApi(
  id: string,
  update: {
    status: ScholarshipStatus;
    evaluatorRemarks?: string;
    evaluatedBy?: string;
    verifiedDocs?: string[];
    flagReason?: string;
    role?: string;
    userEmail?: string;
  }
): Promise<ScholarshipApplication> {
  const res = await fetch(`${API_BASE}/applications/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(update),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to update application status.');
  }
  return json.data;
}

/**
 * 5. Resolve application deficiency with re-uploaded file
 */
export async function resolveDeficiencyApi(
  id: string,
  formData: FormData
): Promise<ScholarshipApplication> {
  const res = await fetch(`${API_BASE}/applications/${encodeURIComponent(id)}/resolve-deficiency`, {
    method: 'PATCH',
    headers: getAuthHeaders(false),
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to resolve deficiency.');
  }
  return json.data;
}

/**
 * 6. Fetch real-time quota slot limits
 */
export async function fetchQuotasApi(): Promise<QuotaRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/quotas`);
    if (!res.ok) throw new Error(`Quotas API returned ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Failed to fetch quotas from API:', err);
    throw err;
  }
}

/**
 * 7. Update quota allocation or manual intake lock override
 */
export async function updateQuotaApi(
  grantType: string,
  update: {
    totalSlots?: number;
    allocatedSlots?: number;
    isLocked?: boolean;
    adminName?: string;
    adminEmail?: string;
  }
): Promise<QuotaRecord> {
  const res = await fetch(`${API_BASE}/quotas`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ grantType, ...update }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to update quota.');
  }
  return json.data;
}

/**
 * 8. Fetch institutional Audit Logs (RA 10173)
 */
export async function fetchAuditLogsApi(): Promise<AuditLogRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: getAuthHeaders(false),
    });
    if (!res.ok) throw new Error(`Audit logs API returned ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Failed to fetch audit logs:', err);
    throw err;
  }
}

/**
 * 9. Trigger Disaster Recovery Snapshot Download
 */
export function downloadArchivalSnapshot(): void {
  const a = document.createElement('a');
  a.href = `${API_BASE}/archive/snapshot`;
  a.download = `EARIST_SFAO_DisasterRecovery_Snapshot_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * 10. Fetch in-app notifications
 */
export async function fetchNotificationsApi(params?: {
  role?: string;
  college?: string;
  studentNumber?: string;
}): Promise<NotificationItem[]> {
  try {
    const q = new URLSearchParams();
    if (params?.role) q.append('role', params.role);
    if (params?.college) q.append('college', params.college);
    if (params?.studentNumber) q.append('studentNumber', params.studentNumber);

    const res = await fetch(`${API_BASE}/notifications?${q.toString()}`, {
      headers: getAuthHeaders(false),
    });
    if (!res.ok) throw new Error(`Notifications API returned ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Failed to fetch notifications:', err);
    return [];
  }
}

/**
 * 11. Mark single notification as read
 */
export async function markNotificationReadApi(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(false),
    });
  } catch (err) {
    console.warn('Failed to mark notification as read:', err);
  }
}

/**
 * 12. Mark all notifications as read
 */
export async function markAllNotificationsReadApi(payload?: {
  role?: string;
  college?: string;
  studentNumber?: string;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload || {}),
    });
  } catch (err) {
    console.warn('Failed to mark all notifications as read:', err);
  }
}

/**
 * 13. Fetch System Storage Telemetry & Orphaned Files
 */
export async function fetchStorageTelemetryApi(): Promise<StorageStatusResponse> {
  const res = await fetch(`${API_BASE}/system/storage`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error(`Storage telemetry API returned ${res.status}`);
  return await res.json();
}

/**
 * 14. Purge unreferenced orphaned files from storage
 */
export async function purgeOrphanedFilesApi(payload?: {
  adminName?: string;
  adminEmail?: string;
}): Promise<{ success: boolean; message: string; purgedCount: number; recoveredMB: number }> {
  const res = await fetch(`${API_BASE}/system/purge-orphans`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) throw new Error(`Purge API returned ${res.status}`);
  return await res.json();
}

/**
 * 15. Fetch Academic Terms
 */
export async function fetchAcademicTermsApi(): Promise<AcademicTerm[]> {
  try {
    const res = await fetch(`${API_BASE}/terms`, {
      headers: getAuthHeaders(false),
    });
    if (!res.ok) throw new Error(`Terms API returned ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Failed to fetch terms:', err);
    return [];
  }
}

/**
 * 16. Archive Current Term & Initialize Next Term
 */
export async function archiveAcademicTermApi(payload: {
  currentTermName: string;
  nextTermName: string;
  adminName: string;
  adminEmail: string;
}): Promise<{ success: boolean; message: string; data: unknown }> {
  const res = await fetch(`${API_BASE}/terms/archive`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to archive academic term.');
  }
  return json;
}

/**
 * 17. User Login API
 */
export async function loginApi(
  identifier: string,
  password: string
): Promise<{
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    role: 'student' | 'evaluator' | 'admin';
    name: string;
    college?: string | null;
    studentNumber?: string | null;
    employeeId?: string | null;
    isActive: boolean;
  };
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: identifier, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Authentication failed (Status ${res.status})`);
  }
  return data;
}

/**
 * 18. Student Self-Registration API
 */
export async function registerStudentApi(payload: {
  name: string;
  email: string;
  studentNumber: string;
  college: string;
  password: string;
}): Promise<{
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    studentNumber: string;
    college: string;
    role: string;
    isActive: boolean;
  };
}> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed. Please verify your details.');
  }
  return data;
}

/**
 * 19. Request Password Recovery OTP (Gmail)
 */
export async function requestPasswordOtpApi(email: string): Promise<{
  success: boolean;
  message: string;
  simulated?: boolean;
}> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to request password reset code.');
  }
  return data;
}

/**
 * 20. Verify OTP & Reset Password
 */
export async function verifyOtpAndResetPasswordApi(payload: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/auth/verify-otp-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Verification failed. Please check your code.');
  }
  return data;
}

/**
 * 21. Fetch All User Accounts (Super Admin)
 */
export async function fetchUsersApi(): Promise<UserRecord[]> {
  const res = await fetch(`${API_BASE}/users`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch user accounts (Status ${res.status})`);
  }
  const data = await res.json();
  return data.users || [];
}

/**
 * 22. Create Staff User Account (Super Admin)
 */
export async function createStaffUserApi(payload: {
  name: string;
  email: string;
  password: string;
  role: 'evaluator' | 'admin';
  college?: string;
  employeeId?: string;
  adminName?: string;
  adminEmail?: string;
}): Promise<{
  success: boolean;
  message: string;
  user: UserRecord;
}> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create staff account.');
  }
  return data;
}

/**
 * 23. Toggle User Account Status (Active vs Suspended)
 */
export async function toggleUserStatusApi(
  id: string,
  isActive: boolean,
  adminName?: string,
  adminEmail?: string
): Promise<{
  success: boolean;
  message: string;
  user: { id: string; email: string; isActive: boolean };
}> {
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ isActive, adminName, adminEmail }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update account status.');
  }
  return data;
}
