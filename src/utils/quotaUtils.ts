import type { ScholarshipProgram, ScholarshipApplication } from '../types';

export interface GrantQuotaInfo {
  program: ScholarshipProgram;
  maxSlots: number;
  baselineApproved: number;
  currentApprovedCount: number;
  totalFilled: number;
  remainingSlots: number;
  isFull: number extends never ? false : boolean;
}

export const PROGRAM_MAX_QUOTAS: Record<ScholarshipProgram, { max: number; baseline: number }> = {
  'Tertiary Education Subsidy (TES)': { max: 50, baseline: 47 },
  'CHED TDP': { max: 40, baseline: 37 },
  'DOST-SEI Grant': { max: 20, baseline: 18 },
  'Academic Excellence Grant': { max: 25, baseline: 22 },
  'Student Assistantship Program (SAP)': { max: 20, baseline: 17 },
  'Barangay/LGU Assistance': { max: 30, baseline: 27 },
};

export function getGrantQuota(
  program: ScholarshipProgram,
  applications: ScholarshipApplication[]
): GrantQuotaInfo {
  const config = PROGRAM_MAX_QUOTAS[program] || { max: 40, baseline: 30 };
  
  // Count how many current applications for this program have status "Approved"
  const currentApprovedCount = applications.filter(
    (app) => app.program === program && app.status === 'Approved'
  ).length;

  const totalFilled = Math.min(config.max, config.baseline + currentApprovedCount);
  const remainingSlots = Math.max(0, config.max - totalFilled);

  return {
    program,
    maxSlots: config.max,
    baselineApproved: config.baseline,
    currentApprovedCount,
    totalFilled,
    remainingSlots,
    isFull: remainingSlots === 0,
  };
}

export function checkQuotaAvailability(
  program: ScholarshipProgram,
  applications: ScholarshipApplication[],
  isAlreadyApproved: boolean = false
): { allowed: boolean; reason?: string; quota: GrantQuotaInfo } {
  const quota = getGrantQuota(program, applications);

  // If the applicant is ALREADY approved, approving again does not consume an extra slot
  if (isAlreadyApproved) {
    return { allowed: true, quota };
  }

  if (quota.isFull) {
    return {
      allowed: false,
      reason: `Quota Reached: Grant slots fully allocated for this term (${quota.totalFilled}/${quota.maxSlots} filled). Further approvals are locked.`,
      quota,
    };
  }

  return { allowed: true, quota };
}
