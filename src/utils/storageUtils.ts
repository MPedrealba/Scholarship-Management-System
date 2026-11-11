import type { ScholarshipApplication, ApplicationAuditEntry } from '../types';
import { MOCK_APPLICATIONS } from '../data/mockData';
import { fetchApplicationsApi } from './api';

const STORAGE_KEY = 'earist_scholarship_applications_v2';

/**
 * Ensures each application has normalized document metadata and a valid audit trail
 */
export function normalizeApplication(app: ScholarshipApplication): ScholarshipApplication {
  const attachedDocuments = (app.attachedDocuments || []).map((doc) => {
    let mime = doc.mimeType;
    if (!mime) {
      if (doc.name.toLowerCase().includes('.pdf') || doc.name.toLowerCase().includes('cor') || doc.name.toLowerCase().includes('grade')) {
        mime = 'application/pdf';
      } else {
        mime = 'image/png';
      }
    }
    return {
      ...doc,
      mimeType: mime,
    };
  });

  const auditTrail: ApplicationAuditEntry[] =
    app.auditTrail && app.auditTrail.length > 0
      ? app.auditTrail
      : [
          {
            id: `init-audit-${app.id}`,
            evaluatorName: app.assignedEvaluator ? app.assignedEvaluator.replace(/\(.*\)/, '').trim() : 'SFAO Evaluator',
            role: `College Evaluator (SFAO-${app.college})`,
            action: app.status === 'Approved' ? 'Approved for Awarding' : app.status === 'Endorsed' ? 'Endorsed to SFAO' : 'Credential Verification Audit',
            remarks: app.evaluatorNotes || 'Initial academic credential audit completed.',
            timestamp: app.lastUpdated || app.submissionDate || new Date().toISOString(),
          },
        ];

  return {
    ...app,
    attachedDocuments,
    auditTrail,
  };
}

/**
 * Loads scholarship applications from browser localStorage,
 * falling back to the default MOCK_APPLICATIONS if not found.
 */
export function loadApplications(): ScholarshipApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const normalized = MOCK_APPLICATIONS.map(normalizeApplication);
      saveApplications(normalized);
      return normalized;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= MOCK_APPLICATIONS.length) {
      const sanitized = parsed.filter(
        (app: any) =>
          app.studentId !== '2024-99999-MN-0' &&
          app.studentNumber !== '2024-99999-MN-0' &&
          app.studentName !== 'Testing Scholar'
      );
      return sanitized.map(normalizeApplication);
    }
    // Update cache if new seed records are available
    const normalized = MOCK_APPLICATIONS.map(normalizeApplication);
    saveApplications(normalized);
    return normalized;
  } catch (err) {
    console.error('Failed to load scholarship records from localStorage:', err);
    return MOCK_APPLICATIONS.map(normalizeApplication);
  }
}

/**
 * Persists scholarship applications to browser localStorage.
 */
export function saveApplications(apps: ScholarshipApplication[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch (err) {
    console.error('Failed to persist scholarship records to localStorage:', err);
  }
}

/**
 * Syncs applications from live backend API to localStorage and returns normalized records.
 */
export async function syncApplicationsWithApi(): Promise<ScholarshipApplication[]> {
  try {
    const apiApps = await fetchApplicationsApi();
    if (apiApps && apiApps.length > 0) {
      const normalized = apiApps.map(normalizeApplication);
      saveApplications(normalized);
      return normalized;
    }
  } catch (err) {
    console.warn('Backend API sync unavailable, continuing with local store:', err);
  }
  return loadApplications();
}

/**
 * Resets applications to official initial seed data.
 */
export function resetApplicationsToDefault(): ScholarshipApplication[] {
  try {
    const normalized = MOCK_APPLICATIONS.map(normalizeApplication);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (err) {
    console.error('Failed to reset storage:', err);
    return MOCK_APPLICATIONS.map(normalizeApplication);
  }
}
