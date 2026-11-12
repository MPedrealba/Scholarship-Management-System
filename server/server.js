import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

import { connectDB } from './config/db.js';
import { upload } from './middleware/upload.js';
import { DataStore } from './data/store.js';
import { User } from './models/User.js';
import { sendOtpEmail } from './utils/mailer.js';
import { rateLimit } from 'express-rate-limit';
import { authenticateToken, optionalToken, requireRole } from './middleware/auth.js';
import { ensureSampleUploadsExist } from './utils/seedUploads.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'earist_sfao_jwt_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static file hosting for verified uploads & ensure sample assets exist
const uploadsPath = path.resolve('uploads');
ensureSampleUploadsExist(uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Security Rate Limiter: Password Recovery OTP
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many OTP requests from this network address. Institutional security requires a 15-minute cooldown before requesting another code.',
  },
});

// Initiate MongoDB Atlas Connection (with automatic background retry)
connectDB();
mongoose.connection.on('connected', () => {
  DataStore.syncToMongoAtlas();
});
setTimeout(() => {
  DataStore.syncToMongoAtlas();
}, 2000);

// Helper for formatting application objects
const COLLEGE_NAMES = {
  CAS: 'College of Arts and Sciences',
  CBA: 'College of Business Administration',
  CED: 'College of Education',
  CIT: 'College of Industrial Technology',
  CEN: 'College of Engineering',
  CAFA: 'Architecture and Fine Arts',
  CHM: 'Hospitality Management',
};

function formatAppForClient(rawApp) {
  const obj = rawApp.toObject ? rawApp.toObject() : { ...rawApp };

  const attachedDocuments = (obj.documents || obj.attachedDocuments || []).map((doc, idx) => ({
    id: doc._id ? doc._id.toString() : doc.id || `doc-${idx + 1}`,
    name: doc.fileName || doc.name || `Document ${idx + 1}`,
    verified: Boolean(doc.isVerified || doc.verified),
    required: true,
    uploadedAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString().replace('T', ' ').substring(0, 16)
      : doc.uploadedAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
    fileSize: doc.fileSize
      ? typeof doc.fileSize === 'number'
        ? doc.fileSize >= 1024 * 1024
          ? `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(doc.fileSize / 1024)} KB`
        : doc.fileSize
      : '1.2 MB',
    mimeType:
      doc.mimeType ||
      (doc.fileName && doc.fileName.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'application/pdf'),
    documentType: doc.docType || doc.documentType || 'cor',
    fileUrl: doc.filePath || doc.fileUrl || '/uploads/sample.pdf',
  }));

  const collegeCode = obj.college || 'CIT';

  return {
    ...obj,
    id: obj.applicationNo || obj.id || (obj._id ? obj._id.toString() : 'APP-2026-0001'),
    studentId: obj.studentNumber || obj.studentId || '2023-00000-MN-0',
    studentName: obj.studentName || 'Student Beneficiary',
    college: collegeCode,
    collegeName: COLLEGE_NAMES[collegeCode] || `${collegeCode} Department`,
    course: obj.degreeProgram || obj.course || 'Bachelor of Science',
    yearAndSection: obj.yearLevel || obj.yearAndSection || '1st Year',
    program: obj.scholarshipGrant || obj.program || 'CHED TDP',
    academicTerm: obj.academicTerm || '1st Sem A.Y. 2026-2027',
    submissionDate: obj.createdAt
      ? new Date(obj.createdAt).toISOString()
      : obj.submissionDate || new Date().toISOString(),
    status: obj.status || 'Pending Review',
    assignedEvaluator: obj.evaluatedBy || obj.assignedEvaluator || 'Prof. Noel Carpio (SFAO-CIT)',
    gwa: parseFloat(obj.gwa) || 1.75,
    monthlyHouseholdIncome: parseFloat(obj.monthlyIncome || obj.monthlyHouseholdIncome) || 15000,
    contactNumber: obj.contactMobile || obj.contactNumber || '09170000000',
    email: obj.email || 'applicant@earist.edu.ph',
    stipendAmount: obj.stipendAmount || 20000,
    evaluatorNotes: obj.evaluatorRemarks || obj.evaluatorNotes || '',
    flagReason: obj.flagReason || (obj.status === 'Flagged' ? obj.evaluatorRemarks || obj.evaluatorNotes : ''),
    attachedDocuments,
    lastUpdated: obj.updatedAt
      ? new Date(obj.updatedAt).toISOString()
      : obj.lastUpdated || new Date().toISOString(),
    auditTrail: obj.auditTrail || [],
  };
}

// ==========================================
// REST API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'EARIST SFAO Scholarship Management System API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    database: 'MongoDB Atlas + High-Availability Local Failover Store',
  });
});

/**
 * 1. POST /api/applications
 * Submits student application with form fields and file attachments.
 * Includes Duplicate Application Prevention (Feature 2) & Automated Notifications (Feature 4).
 */
app.post('/api/applications', optionalToken, (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds strict institutional limit of 2MB.',
        });
      }
      return res.status(400).json({ success: false, error: err.message });
    }

    try {
      const {
        studentNumber,
        studentName,
        contactMobile,
        email,
        college,
        degreeProgram,
        yearLevel,
        gwa,
        monthlyIncome,
        scholarshipGrant,
        stipendAmount,
      } = req.body;

      let academicTerm = req.body.academicTerm ? String(req.body.academicTerm).trim() : '';
      if (!academicTerm) {
        try {
          const terms = await DataStore.getAcademicTerms();
          const activeTerm = Array.isArray(terms) ? terms.find((t) => t.isActive) : null;
          academicTerm = activeTerm && activeTerm.termName ? activeTerm.termName.trim() : '1st Sem A.Y. 2026-2027';
        } catch {
          academicTerm = '1st Sem A.Y. 2026-2027';
        }
      }

      const requiredFields = [
        'studentNumber',
        'studentName',
        'contactMobile',
        'email',
        'college',
        'degreeProgram',
        'yearLevel',
        'gwa',
        'monthlyIncome',
        'scholarshipGrant',
      ];

      const missing = requiredFields.filter((f) => !req.body[f] || !String(req.body[f]).trim());
      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required application fields: ${missing.join(', ')}`,
        });
      }

      // EARIST Student ID Regex Validation (YYYY-NNNNN-MN-0)
      const studentNoRegex = /^\d{4}-\d{5}-MN-\d$/;
      const cleanStudentNumber = studentNumber.trim();
      if (!studentNoRegex.test(cleanStudentNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid EARIST Student ID format. Must match pattern YYYY-NNNNN-MN-0 (e.g., 2024-01849-MN-0).',
        });
      }

      // Bind Authenticated Student Identity (Prevent Impersonation Loophole)
      if (req.user && req.user.role === 'student' && req.user.studentNumber) {
        if (req.user.studentNumber.trim().toUpperCase() !== cleanStudentNumber.toUpperCase()) {
          return res.status(403).json({
            success: false,
            error: `Identity mismatch: You are authenticated as Student Number ${req.user.studentNumber} and cannot submit an application under a different Student Number (${cleanStudentNumber}).`,
          });
        }
      }

      // ==============================================================
      // 2. DUPLICATE APPLICATION PREVENTION (FEATURE 2)
      // Check MongoDB/Store matching { studentNumber, scholarshipGrant, academicTerm }
      // ==============================================================
      const duplicateApp = await DataStore.findDuplicateApplication(cleanStudentNumber, scholarshipGrant, academicTerm);
      if (duplicateApp) {
        return res.status(409).json({
          success: false,
          error: `An active application for this scholarship grant already exists under Student Number ${cleanStudentNumber} for the current semester (${academicTerm}).`,
          duplicateApplicationNo: duplicateApp.applicationNo || duplicateApp.id,
        });
      }

      // Look up dynamic ScholarshipProgram & enforce eligibility
      const programDoc = await DataStore.getScholarshipByName(scholarshipGrant);
      if (programDoc) {
        if (!programDoc.isActive) {
          return res.status(400).json({
            success: false,
            error: `Application rejected: Scholarship grant "${scholarshipGrant}" is currently inactive and not accepting new applicants.`,
          });
        }

        // Validate GWA dynamically against program maxGwa
        const studentGwa = parseFloat(gwa);
        if (!isNaN(studentGwa) && programDoc.maxGwa && studentGwa > programDoc.maxGwa) {
          return res.status(400).json({
            success: false,
            error: `Application rejected: ${scholarshipGrant} requires a General Weighted Average (GWA) of ${Number(programDoc.maxGwa).toFixed(2)} or better. Your declared GWA (${studentGwa.toFixed(2)}) does not meet eligibility requirements.`,
          });
        }

        // Validate Monthly Income dynamically against program maxMonthlyIncome
        const studentIncome = parseFloat(monthlyIncome);
        if (
          !isNaN(studentIncome) &&
          programDoc.maxMonthlyIncome !== null &&
          programDoc.maxMonthlyIncome !== undefined &&
          studentIncome > programDoc.maxMonthlyIncome
        ) {
          return res.status(400).json({
            success: false,
            error: `Application rejected: ${scholarshipGrant} statutory financial cap requires monthly household income not exceeding PHP ${Number(programDoc.maxMonthlyIncome).toLocaleString()}. Your declared monthly income (PHP ${studentIncome.toLocaleString()}) exceeds this statutory threshold.`,
          });
        }
      }

      // Check Quota Status & Active Pipeline Capacity Enforcement
      const quotas = await DataStore.getQuotas();
      const quota = quotas.find(
        (q) =>
          q.grantType === scholarshipGrant ||
          q.grantType.toLowerCase().includes(scholarshipGrant.toLowerCase())
      );

      if (quota && quota.isLocked) {
        return res.status(400).json({
          success: false,
          error: `Application rejected: Quota for grant "${scholarshipGrant}" is locked by SFAO administration (intake closed).`,
        });
      }

      if (quota && quota.allocatedSlots >= quota.totalSlots) {
        return res.status(400).json({
          success: false,
          error: `Application rejected: Quota limit (${quota.totalSlots} slots) for "${scholarshipGrant}" has reached 100% capacity.`,
        });
      }

      const existingApps = await DataStore.getApplications();
      const activePipelineCount = existingApps.filter(
        (a) =>
          (a.scholarshipGrant === scholarshipGrant || a.program === scholarshipGrant) &&
          ['Approved', 'Endorsed', 'Pending Review'].includes(a.status) &&
          (!a.academicTerm || a.academicTerm === academicTerm)
      ).length;

      if (quota && activePipelineCount >= quota.totalSlots) {
        return res.status(400).json({
          success: false,
          error: `Application rejected: Total active candidate intake (${activePipelineCount}/${quota.totalSlots} slots) for "${scholarshipGrant}" has reached 100% capacity for ${academicTerm}.`,
        });
      }

      // Generate institutional Application Number: APP-2026-XXXX
      const nextSequence = String(existingApps.length + 1041).padStart(4, '0');
      const currentYear = new Date().getFullYear();
      const applicationNo = `APP-${currentYear}-${nextSequence}`;

      // Process uploaded files with standard docType mapping
      const documents = [];
      const defaultDocTypes = ['cor', 'grades', 'indigency', 'validId'];

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        req.files.forEach((file, index) => {
          let docType = defaultDocTypes[index] || 'supporting_doc';
          if (file.fieldname.startsWith('doc_')) {
            docType = file.fieldname.replace('doc_', '');
          } else if (file.originalname.toLowerCase().includes('cor') || file.originalname.toLowerCase().includes('registration')) {
            docType = 'cor';
          } else if (file.originalname.toLowerCase().includes('grade')) {
            docType = 'grades';
          } else if (file.originalname.toLowerCase().includes('indigency') || file.originalname.toLowerCase().includes('barangay')) {
            docType = 'indigency';
          } else if (file.originalname.toLowerCase().includes('id')) {
            docType = 'validId';
          }

          documents.push({
            docType,
            fileName: file.originalname,
            filePath: `/uploads/${file.filename}`,
            fileSize: file.size,
            mimeType: file.mimetype,
            isVerified: false,
          });
        });
      } else if (req.body.documents) {
        const bodyDocs =
          typeof req.body.documents === 'string'
            ? JSON.parse(req.body.documents)
            : req.body.documents;

        if (Array.isArray(bodyDocs)) {
          bodyDocs.forEach((d, idx) => {
            documents.push({
              docType: d.docType || d.documentType || defaultDocTypes[idx] || 'cor',
              fileName: d.fileName || d.name || `document_${idx + 1}.pdf`,
              filePath: d.filePath || d.fileUrl || '/uploads/sample.pdf',
              fileSize: d.fileSize || 512000,
              mimeType: d.mimeType || 'application/pdf',
              isVerified: d.isVerified || false,
            });
          });
        }
      }

      const auditTrail = [
        {
          evaluatorName: 'Online Admission Portal',
          role: 'System Intake',
          action: 'Application Dossier Submitted',
          remarks: `Direct online intake via SFAO Student Application Portal for ${academicTerm}. Attachments queued for verification.`,
          timestamp: new Date().toISOString(),
        },
      ];

      const newAppRecord = {
        applicationNo,
        studentNumber: studentNumber.trim(),
        studentName: studentName.trim(),
        contactMobile: contactMobile.trim(),
        email: email.trim().toLowerCase(),
        college,
        degreeProgram: degreeProgram.trim(),
        yearLevel: yearLevel.trim(),
        academicTerm,
        gwa: String(gwa).trim(),
        monthlyIncome: String(monthlyIncome).trim(),
        scholarshipGrant: scholarshipGrant.trim(),
        stipendAmount: programDoc?.stipendAmount !== undefined ? Number(programDoc.stipendAmount) : (stipendAmount ? Number(stipendAmount) : 20000),
        documents,
        status: 'Pending Review',
        evaluatorRemarks: 'Initial submission received and queued for college document verification.',
        auditTrail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await DataStore.saveApplication(newAppRecord);

      // Audit Log
      await DataStore.addAuditLog({
        userEmail: newAppRecord.email,
        userName: newAppRecord.studentName,
        role: 'student',
        action: `Submitted Scholarship Application ${newAppRecord.applicationNo}`,
        details: `Program: ${newAppRecord.scholarshipGrant}, College: ${newAppRecord.college}, Term: ${academicTerm}`,
        applicationNo: newAppRecord.applicationNo,
        ipAddress: req.ip || '127.0.0.1',
      });

      // ==============================================================
      // AUTOMATIC NOTIFICATIONS (FEATURE 4)
      // 1. Alert College Evaluator
      // ==============================================================
      await DataStore.addNotification({
        recipientRole: 'evaluator',
        recipientCollege: college,
        targetRefNo: applicationNo,
        title: 'New College Application Filed',
        message: `${newAppRecord.studentName} (${newAppRecord.studentNumber}) filed an application for ${newAppRecord.scholarshipGrant} in ${college}.`,
        type: 'submission',
      });

      // 2. Alert Student Confirmation
      await DataStore.addNotification({
        recipientRole: 'student',
        recipientCollege: college,
        recipientStudentNumber: newAppRecord.studentNumber,
        targetRefNo: applicationNo,
        title: 'Application Dossier Registered',
        message: `Your scholarship application (${applicationNo}) for ${newAppRecord.scholarshipGrant} has been officially recorded and queued for college review.`,
        type: 'submission',
      });

      const formatted = formatAppForClient(newAppRecord);

      return res.status(201).json({
        success: true,
        message: 'Scholarship application submitted and logged successfully.',
        application: formatted,
        data: formatted,
        referenceNumber: newAppRecord.applicationNo,
      });
    } catch (error) {
      console.error('Error saving application:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });
});

/**
 * 2. GET /api/applications
 * Retrieves applicants with college, grant, status, term, and search filters.
 */
app.get('/api/applications', authenticateToken, requireRole('evaluator', 'admin'), async (req, res) => {
  try {
    const query = { ...req.query };
    // Evaluators are strictly scoped to their assigned college
    if (req.user.role === 'evaluator' && req.user.college) {
      query.college = req.user.college;
    }
    const apps = await DataStore.getApplications(query);
    const formatted = apps.map(formatAppForClient);
    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. GET /api/applications/track/:query
 * Fetches live status by Student Number or Application No.
 */
app.get('/api/applications/track/:query', async (req, res) => {
  try {
    const query = req.params.query.trim();
    const appRecord = await DataStore.findApplication(query);

    if (!appRecord) {
      return res.status(404).json({
        success: false,
        error: `No scholarship application found for reference: "${query}". Please check your Student Number or Reference Code.`,
      });
    }

    res.json({
      success: true,
      data: formatAppForClient(appRecord),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. PATCH /api/applications/:id/status
 * Updates status (Endorse, Approve, Flag) with evaluator notes and records who made the change.
 * Triggers Student and Quota Capacity Notifications (Feature 4).
 */
app.patch('/api/applications/:id/status', authenticateToken, requireRole('evaluator', 'admin'), async (req, res) => {
  try {
    let _currentQuotaObj = null;
    const { id } = req.params;
    const { status, evaluatorRemarks, evaluatedBy, verifiedDocs, flagReason } = req.body;

    const validStatuses = ['Pending Review', 'Endorsed', 'Approved', 'Flagged'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status "${status}". Allowed: ${validStatuses.join(', ')}`,
      });
    }

    const appRecord = await DataStore.findApplication(id);
    if (!appRecord) {
      return res.status(404).json({ success: false, error: 'Application not found with provided ID.' });
    }

    // Role-based tenant scope enforcement: Evaluator can only mutate dossiers within their college
    if (req.user.role === 'evaluator' && req.user.college && appRecord.college !== req.user.college) {
      return res.status(403).json({
        success: false,
        error: `Institutional scope restriction: Evaluators from ${req.user.college} cannot evaluate applications belonging to ${appRecord.college}.`,
      });
    }

    const previousStatus = appRecord.status;

    const activeEvaluatorName = req.user.name || evaluatedBy || 'SFAO Evaluator';
    const activeEvaluatorRole = req.user.role === 'admin' ? 'SFAO Director' : `${req.user.college || 'College'} Evaluator`;

    if (status) appRecord.status = status;
    if (evaluatorRemarks !== undefined) appRecord.evaluatorRemarks = evaluatorRemarks;
    if (flagReason !== undefined) appRecord.flagReason = flagReason;
    if (status === 'Flagged' && !appRecord.flagReason && evaluatorRemarks) {
      appRecord.flagReason = evaluatorRemarks;
    }
    appRecord.evaluatedBy = activeEvaluatorName;
    appRecord.updatedAt = new Date().toISOString();

    // Document verification updates
    const docs = appRecord.documents || appRecord.attachedDocuments || [];
    if (Array.isArray(verifiedDocs)) {
      docs.forEach((doc) => {
        const docIdentifier = doc._id ? doc._id.toString() : doc.id || doc.docType;
        if (
          verifiedDocs.includes(docIdentifier) ||
          verifiedDocs.includes(doc.docType) ||
          verifiedDocs.includes(doc.fileName) ||
          verifiedDocs.includes(doc.name)
        ) {
          doc.isVerified = true;
          doc.verified = true;
        }
      });
    }
    appRecord.documents = docs;

    // Append Audit Trail to Application
    const actionTitle =
      status === 'Approved'
        ? 'Approved for Final Awarding'
        : status === 'Endorsed'
        ? 'Endorsed to SFAO'
        : status === 'Flagged'
        ? 'Flagged with Deficiency Advisory'
        : 'Status Updated';

    const auditEntry = {
      evaluatorName: activeEvaluatorName,
      role: activeEvaluatorRole,
      action: actionTitle,
      remarks: evaluatorRemarks || `Application transitioned from ${previousStatus} to ${status}.`,
      timestamp: new Date().toISOString(),
    };

    appRecord.auditTrail = [auditEntry, ...(appRecord.auditTrail || [])];

    // ==============================================================
    // AUTOMATED QUOTA LOCK & INTAKE ENFORCEMENT (SLIDES 4 & 6)
    // ==============================================================
    const grantName = appRecord.scholarshipGrant || appRecord.program;

    if (status === 'Approved' && previousStatus !== 'Approved') {
      const quotas = await DataStore.getQuotas();
      const quota = quotas.find(
        (q) => q.grantType === grantName || q.grantType.toLowerCase().includes(grantName.toLowerCase())
      );
      if (quota) {
        const nextAllocated = Math.min(quota.totalSlots, quota.allocatedSlots + 1);
        const shouldLock = nextAllocated >= quota.totalSlots;
        _currentQuotaObj = await DataStore.updateQuota(quota.grantType, {
          allocatedSlots: nextAllocated,
          isLocked: shouldLock,
        });

        // Check if Quota hits >= 90% capacity -> Alert Super Admin
        const capacityPct = Math.round((nextAllocated / quota.totalSlots) * 100);
        if (capacityPct >= 90) {
          await DataStore.addNotification({
            recipientRole: 'superadmin',
            targetRefNo: quota.grantType,
            title: `Grant Quota Alert (${capacityPct}% Capacity)`,
            message: `Capacity warning: ${quota.grantType} has reached ${capacityPct}% capacity (${nextAllocated}/${quota.totalSlots} slots).`,
            type: 'quota',
          });
        }
      }
    } else if (previousStatus === 'Approved' && (status === 'Flagged' || status === 'Pending Review')) {
      const quotas = await DataStore.getQuotas();
      const quota = quotas.find(
        (q) => q.grantType === grantName || q.grantType.toLowerCase().includes(grantName.toLowerCase())
      );
      if (quota) {
        const nextAllocated = Math.max(0, quota.allocatedSlots - 1);
        const shouldLock = nextAllocated >= quota.totalSlots;
        _currentQuotaObj = await DataStore.updateQuota(quota.grantType, {
          allocatedSlots: nextAllocated,
          isLocked: shouldLock,
        });
      }
    }

    await DataStore.saveApplication(appRecord);

    // Global Audit Log
    await DataStore.addAuditLog({
      userEmail: userEmail || 'evaluator@earist.edu.ph',
      userName: evaluatedBy || 'SFAO Official',
      role: role || 'Evaluator',
      action: `Updated status of ${appRecord.applicationNo || appRecord.id} to ${status}`,
      details: evaluatorRemarks || `Status mutation: ${previousStatus} -> ${status}`,
      applicationNo: appRecord.applicationNo || appRecord.id,
      ipAddress: req.ip || '127.0.0.1',
    });

    // ==============================================================
    // AUTOMATIC NOTIFICATIONS TO STUDENT (FEATURE 4)
    // ==============================================================
    if (status && status !== previousStatus) {
      let notifTitle = 'Application Status Updated';
      let notifMsg = `Your application ${appRecord.applicationNo} status is now "${status}".`;
      let notifType = 'submission';

      if (status === 'Endorsed') {
        notifTitle = 'Application Endorsed by College';
        notifMsg = `Your application ${appRecord.applicationNo} has been verified and endorsed to SFAO by ${evaluatedBy || 'College Evaluator'}.`;
        notifType = 'endorsement';
      } else if (status === 'Flagged') {
        notifTitle = 'Requirement Deficiency Flagged';
        notifMsg = `Action required for ${appRecord.applicationNo}: ${evaluatorRemarks || appRecord.flagReason || 'Document deficiency detected. Please re-upload required files.'}`;
        notifType = 'flagged';
      } else if (status === 'Approved') {
        notifTitle = 'Scholarship Award Approved';
        notifMsg = `Congratulations! Your scholarship application ${appRecord.applicationNo} has been approved for semestral awarding.`;
        notifType = 'approval';
      }

      await DataStore.addNotification({
        recipientRole: 'student',
        recipientCollege: appRecord.college,
        recipientStudentNumber: appRecord.studentNumber,
        targetRefNo: appRecord.applicationNo,
        title: notifTitle,
        message: notifMsg,
        type: notifType,
      });
    }

    const formatted = formatAppForClient(appRecord);
    res.json({
      success: true,
      message: `Application ${formatted.id} status updated to "${status}".`,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5. PATCH /api/applications/:id/resolve-deficiency
 * Notification & Deficiency Resolution (Slide 5)
 */
app.patch('/api/applications/:id/resolve-deficiency', optionalToken, (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds strict institutional limit of 2MB.',
        });
      }
      return res.status(400).json({ success: false, error: err.message });
    }

    try {
      const { id } = req.params;
      const { docId, docType, studentRemarks } = req.body;

      // Mandatory replacement document upload verification
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'A valid authenticated replacement document (.pdf or .png <= 2MB) is mandatory to resolve a deficiency.',
        });
      }

      const appRecord = await DataStore.findApplication(id);
      if (!appRecord) {
        return res.status(404).json({ success: false, error: 'Application record not found.' });
      }

      // Security check: If authenticated as student, prevent resolving other applicants' deficiencies
      if (req.user && req.user.role === 'student' && req.user.studentNumber) {
        if (req.user.studentNumber.trim().toUpperCase() !== appRecord.studentNumber.trim().toUpperCase()) {
          return res.status(403).json({
            success: false,
            error: 'Access denied: You cannot resolve a deficiency for another applicant.',
          });
        }
      }

      let uploadedDoc = null;
      if (req.files && req.files.length > 0) {
        const file = req.files[0];
        uploadedDoc = {
          docType: docType || file.fieldname.replace('doc_', '') || 'cor',
          fileName: file.originalname,
          filePath: `/uploads/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype,
          isVerified: false,
        };

        const docs = appRecord.documents || appRecord.attachedDocuments || [];
        let replaced = false;
        docs.forEach((d, idx) => {
          if ((docId && (String(d._id) === String(docId) || d.id === docId)) || d.docType === uploadedDoc.docType) {
            docs[idx] = { ...d, ...uploadedDoc, verified: false, isVerified: false };
            replaced = true;
          }
        });

        if (!replaced) {
          docs.push(uploadedDoc);
        }
        appRecord.documents = docs;
      }

      appRecord.status = 'Pending Review';
      appRecord.evaluatorRemarks = studentRemarks
        ? `Deficiency resolved: ${studentRemarks}`
        : 'Student re-uploaded deficiency document. Queued for SFAO re-verification.';
      appRecord.flagReason = '';
      appRecord.updatedAt = new Date().toISOString();

      const auditEntry = {
        evaluatorName: appRecord.studentName,
        role: 'Student Applicant',
        action: 'Resolved Requirement Deficiency',
        remarks:
          studentRemarks ||
          `Re-uploaded authenticated replacement file (${uploadedDoc?.fileName || 'document'}).`,
        timestamp: new Date().toISOString(),
      };
      appRecord.auditTrail = [auditEntry, ...(appRecord.auditTrail || [])];

      await DataStore.saveApplication(appRecord);

      await DataStore.addAuditLog({
        userEmail: appRecord.email,
        userName: appRecord.studentName,
        role: 'student',
        action: `Resolved Deficiency for ${appRecord.applicationNo || appRecord.id}`,
        details: studentRemarks || `Re-uploaded document: ${uploadedDoc?.fileName || 'file'}`,
        applicationNo: appRecord.applicationNo || appRecord.id,
        ipAddress: req.ip || '127.0.0.1',
      });

      // Notify Evaluator of re-upload
      await DataStore.addNotification({
        recipientRole: 'evaluator',
        recipientCollege: appRecord.college,
        targetRefNo: appRecord.applicationNo,
        title: 'Requirement Deficiency Re-uploaded',
        message: `${appRecord.studentName} (${appRecord.studentNumber}) re-submitted requested documentation for review.`,
        type: 'submission',
      });

      const formatted = formatAppForClient(appRecord);
      return res.json({
        success: true,
        message: 'Requirement submitted successfully! Status has returned to "Pending Review".',
        data: formatted,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });
});

// =========================================================================
// SCHOLARSHIP MANAGEMENT API (DYNAMIC SCHOLARSHIP CRUD & QUOTA SYNC)
// =========================================================================

/**
 * GET /api/scholarships
 * Public: Returns active scholarships with live Quota slot counts.
 * Authenticated Admins: Returns all including inactive when includeInactive=true.
 */
app.get('/api/scholarships', optionalToken, async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const includeInactive = isAdmin && req.query.includeInactive === 'true';
    const scholarships = await DataStore.getScholarships(includeInactive);
    res.json({
      success: true,
      count: scholarships.length,
      data: scholarships,
    });
  } catch (error) {
    console.error('Fetch scholarships error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scholarships
 * Admin Only: Creates a new scholarship program + initializes its Quota record.
 */
app.post('/api/scholarships', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      name,
      category,
      agency,
      stipendAmount,
      description,
      maxGwa,
      maxMonthlyIncome,
      requiredDocuments,
      totalSlots,
      isActive,
    } = req.body;

    if (!name || !category || !agency || stipendAmount === undefined || !description || !totalSlots) {
      return res.status(400).json({
        success: false,
        error: 'Missing required scholarship fields: name, category, agency, stipendAmount, description, totalSlots.',
      });
    }

    const created = await DataStore.createScholarship({
      name,
      category,
      agency,
      stipendAmount,
      description,
      maxGwa,
      maxMonthlyIncome,
      requiredDocuments,
      totalSlots,
      isActive,
    });

    const adminEmail = req.user?.email || 'admin@earist.edu.ph';
    const adminName = req.user?.name || 'Super Administrator';

    await DataStore.addAuditLog({
      userEmail: adminEmail,
      userName: adminName,
      role: 'admin',
      action: `Created Scholarship Program "${created.name}"`,
      details: `Category: ${created.category}, Agency: ${created.agency}, Stipend: PHP ${Number(created.stipendAmount).toLocaleString()}, Slots: ${created.totalSlots}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: `Scholarship program "${created.name}" created successfully.`,
      data: created,
    });
  } catch (error) {
    console.error('Create scholarship error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/scholarships/:id
 * Admin Only: Edits program details, stipend, GWA/income criteria, total slots, active status, and syncs Quota.
 */
app.put('/api/scholarships/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await DataStore.getScholarshipById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Scholarship program not found.',
      });
    }

    const updated = await DataStore.updateScholarship(id, req.body);

    const adminEmail = req.user?.email || 'admin@earist.edu.ph';
    const adminName = req.user?.name || 'Super Administrator';

    await DataStore.addAuditLog({
      userEmail: adminEmail,
      userName: adminName,
      role: 'admin',
      action: `Updated Scholarship Program "${updated?.name || existing.name}"`,
      details: `Administrative parameters updated for ${updated?.name || existing.name}.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: `Scholarship program "${updated?.name || existing.name}" updated successfully.`,
      data: updated,
    });
  } catch (error) {
    console.error('Update scholarship error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/scholarships/:id
 * Admin Only: Deletes the scholarship program.
 * If existing student applications reference this grant, require force=true or return warning.
 */
app.delete('/api/scholarships/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await DataStore.getScholarshipById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Scholarship program not found.',
      });
    }

    const applicationCount = await DataStore.countApplicationsForGrant(existing.name);
    const isForce = req.query.force === 'true' || req.body?.force === true;

    if (applicationCount > 0 && !isForce) {
      return res.status(400).json({
        success: false,
        hasApplications: true,
        applicationCount,
        error: `Cannot delete "${existing.name}" because ${applicationCount} student application(s) currently reference this grant. Please archive or confirm forced removal.`,
      });
    }

    await DataStore.deleteScholarship(id);

    const adminEmail = req.user?.email || 'admin@earist.edu.ph';
    const adminName = req.user?.name || 'Super Administrator';

    await DataStore.addAuditLog({
      userEmail: adminEmail,
      userName: adminName,
      role: 'admin',
      action: `Deleted Scholarship Program "${existing.name}"`,
      details: `Program removed from catalog by Super Administrator. (Referenced applications: ${applicationCount})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: `Scholarship program "${existing.name}" deleted successfully.`,
    });
  } catch (error) {
    console.error('Delete scholarship error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 6. GET /api/quotas
 * Fetches real-time slot limits.
 */
app.get('/api/quotas', async (req, res) => {
  try {
    const quotas = await DataStore.getQuotas();
    res.json({
      success: true,
      count: quotas.length,
      data: quotas,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 7. PATCH /api/quotas/:id or PATCH /api/quotas
 * Manual Admin Quota Override & Intake Unlock (Slide 4 & 6)
 */
app.patch(['/api/quotas/:id', '/api/quotas'], authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const id = req.body.grantType || req.body.id || req.params.id;
    const { totalSlots, isLocked, allocatedSlots } = req.body;
    const adminName = req.user?.name || req.body.adminName || 'Super Administrator';
    const adminEmail = req.user?.email || req.body.adminEmail || 'admin@earist.edu.ph';

    const updated = await DataStore.updateQuota(id, {
      ...(totalSlots !== undefined && { totalSlots: Number(totalSlots) }),
      ...(allocatedSlots !== undefined && { allocatedSlots: Number(allocatedSlots) }),
      ...(isLocked !== undefined && { isLocked: Boolean(isLocked) }),
    });

    await DataStore.addAuditLog({
      userEmail: adminEmail,
      userName: adminName,
      role: 'admin',
      action: `Admin Quota Override for ${updated?.grantType || id}`,
      details: `Updated parameters: totalSlots=${totalSlots}, isLocked=${isLocked}, allocatedSlots=${allocatedSlots}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: 'Quota capacity updated successfully.',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 8. GET /api/audit-logs & POST /api/audit-logs
 * Institutional Immutable Audit Logging (RA 10173)
 */
app.get('/api/audit-logs', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const logs = await DataStore.getAuditLogs();
    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const { userEmail, userName, role, action, details, applicationNo } = req.body;
    if (!userEmail || !action) {
      return res.status(400).json({ success: false, error: 'Missing required audit parameters.' });
    }

    const log = await DataStore.addAuditLog({
      userEmail,
      userName: userName || 'Institutional User',
      role: role || 'Staff',
      action,
      details: details || '',
      applicationNo: applicationNo || null,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 9. NOTIFICATION CENTER ROUTES (FEATURE 4)
 * GET /api/notifications, PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all
 */
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { role, college, studentNumber } = req.query;
    const notifications = await DataStore.getNotifications({
      role: role || req.user.role,
      college: college || req.user.college,
      studentNumber: studentNumber || req.user.studentNumber,
    });
    res.json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notif = await DataStore.markNotificationRead(req.params.id);
    res.json({ success: true, data: notif });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const role = req.body.role || req.user.role;
    const college = req.body.college || req.user.college;
    const studentNumber = req.body.studentNumber || req.user.studentNumber;
    await DataStore.markAllNotificationsRead(role, college, studentNumber);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 10. STORAGE TELEMETRY & ORPHANED FILE PURGE (FEATURE 5 / PROPOSAL SLIDE 6)
 * GET /api/system/storage, POST /api/system/purge-orphans
 */
app.get('/api/system/storage', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }

    const diskFiles = fs.readdirSync(uploadsPath);
    let totalBytes = 0;
    const fileStats = [];

    diskFiles.forEach((file) => {
      try {
        const filePath = path.join(uploadsPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          totalBytes += stat.size;
          fileStats.push({ name: file, size: stat.size, mtime: stat.mtime });
        }
      } catch (e) {
        console.warn('Stat file error:', e.message);
      }
    });

    const totalMB = Number((totalBytes / (1024 * 1024)).toFixed(2));
    const maxStorageMB = 500;
    const usedPercent = Math.min(100, Math.round((totalMB / maxStorageMB) * 100));

    // Gather all referenced files from applications
    const apps = await DataStore.getApplications();
    const referencedFiles = new Set();

    apps.forEach((app) => {
      const docs = app.documents || app.attachedDocuments || [];
      docs.forEach((doc) => {
        if (doc.filePath) referencedFiles.add(path.basename(doc.filePath).toLowerCase());
        if (doc.fileName) referencedFiles.add(path.basename(doc.fileName).toLowerCase());
      });
    });

    // Detect orphaned files (files on disk not referenced in any app)
    const orphanedFiles = [];
    fileStats.forEach((f) => {
      const baseName = f.name.toLowerCase();
      if (baseName === 'sample.pdf' || baseName === '.gitkeep') return;
      if (!referencedFiles.has(baseName)) {
        orphanedFiles.push({
          fileName: f.name,
          fileSize: f.size,
          formattedSize:
            f.size >= 1024 * 1024
              ? `${(f.size / (1024 * 1024)).toFixed(2)} MB`
              : `${Math.round(f.size / 1024)} KB`,
          modifiedAt: f.mtime.toISOString(),
        });
      }
    });

    const mongoReady = mongoose.connection.readyState;
    const mongoStatus =
      mongoReady === 1
        ? 'Connected'
        : mongoReady === 2
        ? 'Connecting'
        : 'High-Availability Local Failover Store';

    res.json({
      success: true,
      storage: {
        totalBytes,
        totalMB,
        fileCount: fileStats.length,
        maxStorageMB,
        usedPercent,
      },
      mongoStatus,
      isMongoConnected: mongoReady === 1,
      orphanedFiles: {
        count: orphanedFiles.length,
        files: orphanedFiles,
        orphanedBytes: orphanedFiles.reduce((acc, o) => acc + o.fileSize, 0),
        orphanedMB: Number(
          (orphanedFiles.reduce((acc, o) => acc + o.fileSize, 0) / (1024 * 1024)).toFixed(2)
        ),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/system/purge-orphans', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    if (!fs.existsSync(uploadsPath)) {
      return res.json({ success: true, message: 'Uploads directory is clean.', purgedCount: 0, recoveredMB: 0 });
    }

    const diskFiles = fs.readdirSync(uploadsPath);
    const apps = await DataStore.getApplications();
    const referencedFiles = new Set();

    apps.forEach((app) => {
      const docs = app.documents || app.attachedDocuments || [];
      docs.forEach((doc) => {
        if (doc.filePath) referencedFiles.add(path.basename(doc.filePath).toLowerCase());
        if (doc.fileName) referencedFiles.add(path.basename(doc.fileName).toLowerCase());
      });
    });

    let purgedCount = 0;
    let recoveredBytes = 0;

    diskFiles.forEach((file) => {
      const baseName = file.toLowerCase();
      if (baseName === 'sample.pdf' || baseName === '.gitkeep') return;
      if (!referencedFiles.has(baseName)) {
        try {
          const filePath = path.join(uploadsPath, file);
          const stat = fs.statSync(filePath);
          recoveredBytes += stat.size;
          fs.unlinkSync(filePath);
          purgedCount += 1;
        } catch (err) {
          console.warn(`Could not purge ${file}:`, err.message);
        }
      }
    });

    const recoveredMB = Number((recoveredBytes / (1024 * 1024)).toFixed(2));

    await DataStore.addAuditLog({
      userEmail: req.body.adminEmail || 'admin@earist.edu.ph',
      userName: req.body.adminName || 'Dr. Mario M. Santos (SFAO Director)',
      role: 'superadmin',
      action: 'Storage Telemetry Orphaned Files Purged',
      details: `Purged ${purgedCount} orphaned files. Recovered ${recoveredMB} MB of server disk space.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: `Storage optimization complete: ${purgedCount} unreferenced files purged (${recoveredMB} MB recovered).`,
      purgedCount,
      recoveredMB,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 11. ACADEMIC TERM SWITCHER & ARCHIVING (FEATURE 6 / PROPOSAL SLIDE 6)
 * GET /api/terms, POST /api/terms/archive
 */
app.get('/api/terms', async (req, res) => {
  try {
    const terms = await DataStore.getAcademicTerms();
    res.json({
      success: true,
      count: terms.length,
      data: terms,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/terms/archive', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { currentTermName, nextTermName, adminName, adminEmail } = req.body;
    if (!currentTermName || !nextTermName) {
      return res.status(400).json({
        success: false,
        error: 'Both currentTermName and nextTermName are required to execute term archival.',
      });
    }

    const result = await DataStore.archiveTerm({
      currentTermName,
      nextTermName,
      adminName,
      adminEmail,
    });

    res.json({
      success: true,
      message: `Academic term "${currentTermName}" archived successfully. Intake quotas reset for "${nextTermName}".`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 12. GET /api/archive/snapshot
 * Disaster Recovery Snapshot Export (Slide 6)
 */
app.get('/api/archive/snapshot', async (req, res) => {
  try {
    const snapshot = DataStore.getSnapshot();
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `EARIST_SFAO_DisasterRecovery_Snapshot_${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(snapshot, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 13. POST /api/auth/register
 * Student self-registration endpoint. Strictly hardcodes role to 'student'.
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, studentNumber, college, password } = req.body;

    if (!name || !email || !studentNumber || !college || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields (Name, Email, Student Number, College, and Password) are required.',
      });
    }

    // EARIST Student ID Regex Validation (YYYY-NNNNN-MN-0)
    const studentNoRegex = /^\d{4}-\d{5}-MN-\d$/;
    const normalizedStudentNo = studentNumber.trim();
    if (!studentNoRegex.test(normalizedStudentNo)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid EARIST Student ID format. Must follow standard pattern: YYYY-NNNNN-MN-0 (e.g., 2024-01849-MN-0).',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters in length.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existingUser = await DataStore.findUser(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An institutional account with this email address already exists. Please sign in or use password recovery.',
      });
    }

    // Check duplicate student number
    const existingStudentNo = await DataStore.findUser(normalizedStudentNo);
    if (existingStudentNo) {
      return res.status(409).json({
        success: false,
        error: 'An account with this student number already exists. Please verify your student number.',
      });
    }

    // Create student account
    const newStudent = await DataStore.createUser({
      name: name.trim(),
      email: normalizedEmail,
      studentNumber: normalizedStudentNo,
      college: college.trim().toUpperCase(),
      role: 'student',
      password: password,
      isActive: true,
      employeeId: null,
    });

    // Immutable Audit Log entry
    await DataStore.addAuditLog({
      userEmail: normalizedEmail,
      userName: name.trim(),
      role: 'student',
      action: 'Student Self-Registration',
      details: `Student account self-registered (ID: ${normalizedStudentNo}, College: ${college.trim().toUpperCase()}) from IP: ${req.ip || '127.0.0.1'}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: 'Student account registered successfully. You may now sign in with your institutional credentials.',
      user: {
        id: newStudent._id || newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        studentNumber: newStudent.studentNumber,
        college: newStudent.college,
        role: 'student',
        isActive: true,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 14. POST /api/auth/login
 * Institutional authentication for students, evaluators, and super admin.
 * Verifies credentials, blocks deactivated/suspended accounts, and returns JWT.
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const inputIdentifier = (email || username || '').trim();

    if (!inputIdentifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email/username and password.',
      });
    }

    const user = await DataStore.findUser(inputIdentifier);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid institutional credentials. Please check your username/email.',
      });
    }

    // Check account status: block suspended / deactivated accounts
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated/suspended. Please contact the EARIST SFAO administrator.',
      });
    }

    // Verify password strictly against bcrypt hash or comparePassword method
    let isMatch = false;
    if (typeof user.comparePassword === 'function') {
      try {
        isMatch = await user.comparePassword(password);
      } catch {
        isMatch = false;
      }
    }

    if (!isMatch && user.password) {
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch {
        isMatch = false;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password. Please verify your institutional password.',
      });
    }

    const token = jwt.sign(
      {
        id: user._id || user.id || 'usr-1',
        email: user.email,
        role: user.role,
        college: user.college,
        name: user.name,
        studentNumber: user.studentNumber || null,
        employeeId: user.employeeId || null,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await DataStore.addAuditLog({
      userEmail: user.email,
      userName: user.name,
      role: user.role,
      action: `User Authenticated (${user.role.toUpperCase()})`,
      details: `Successful institutional sign in from IP: ${req.ip || '127.0.0.1'}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: 'Institutional sign in successful.',
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        role: user.role,
        college: user.college,
        name: user.name,
        studentNumber: user.studentNumber || null,
        employeeId: user.employeeId || null,
        isActive: user.isActive !== false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 15. POST /api/auth/forgot-password
 * Generates secure 6-digit OTP, stores SHA-256 hash + 10-minute expiry, and dispatches via Gmail Nodemailer.
 * Protected by 3 req/15min rate limiter.
 */
app.post('/api/auth/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your registered email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await DataStore.findUser(normalizedEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No institutional account registered with this email address.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'This account has been deactivated/suspended. Please contact the SFAO administrator.',
      });
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const resetOtpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save hash, expiration, and reset attempt counter
    await DataStore.updateUser(user._id || user.id || user.email, {
      resetOtpHash,
      resetOtpExpires,
      resetOtpAttempts: 0,
    });

    // Dispatch email via Nodemailer
    const mailResult = await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    // Log to audit log
    await DataStore.addAuditLog({
      userEmail: user.email,
      userName: user.name,
      role: user.role,
      action: 'Password Reset OTP Requested',
      details: `6-digit verification code dispatched via mailer (${mailResult.simulated ? 'simulated' : 'live Gmail'}) from IP: ${req.ip || '127.0.0.1'}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: 'A 6-digit verification code has been dispatched to your email address.',
      simulated: mailResult.simulated || false,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 16. POST /api/auth/verify-otp-reset
 * Verifies { email, otp, newPassword } against stored SHA-256 hash and expiry, with max 5 failed attempts.
 */
app.post('/api/auth/verify-otp-reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email, 6-digit verification code, and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters in length.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await DataStore.findUser(normalizedEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No institutional account registered with this email address.',
      });
    }

    if (!user.resetOtpHash || !user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        error: 'No active password recovery request found. Please request a new verification code.',
      });
    }

    // Check expiry
    const expiryTime = new Date(user.resetOtpExpires).getTime();
    if (Date.now() > expiryTime) {
      return res.status(400).json({
        success: false,
        error: 'The 6-digit verification code has expired (10-minute limit). Please request a new code.',
      });
    }

    // Verify OTP hash & track attempts
    const inputOtpHash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    if (inputOtpHash !== user.resetOtpHash) {
      const attempts = (user.resetOtpAttempts || 0) + 1;
      if (attempts >= 5) {
        // Exceeded maximum attempts: wipe OTP for security
        await DataStore.updateUser(user._id || user.id || user.email, {
          resetOtpHash: null,
          resetOtpExpires: null,
          resetOtpAttempts: 0,
        });
        return res.status(400).json({
          success: false,
          error: 'Maximum verification attempts exceeded (5 failed attempts). Verification code invalidated for security. Please request a new code.',
        });
      }

      await DataStore.updateUser(user._id || user.id || user.email, {
        resetOtpAttempts: attempts,
      });

      return res.status(400).json({
        success: false,
        error: `Invalid verification code. ${5 - attempts} attempt(s) remaining. Please check your email and try again.`,
      });
    }

    // Hash new password and clear OTP fields
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (mongoose.connection.readyState === 1) {
      try {
        const dbUser = await User.findOne({ email: normalizedEmail });
        if (dbUser) {
          dbUser.password = newPassword; // Mongoose pre-save hook will hash
          dbUser.resetOtpHash = null;
          dbUser.resetOtpExpires = null;
          dbUser.resetOtpAttempts = 0;
          await dbUser.save();
        }
      } catch (err) {
        console.warn('Atlas password reset sync error:', err.message);
      }
    }

    await DataStore.updateUser(user._id || user.id || user.email, {
      password: hashedPassword,
      resetOtpHash: null,
      resetOtpExpires: null,
      resetOtpAttempts: 0,
    });

    // Log to AuditLog
    await DataStore.addAuditLog({
      userEmail: user.email,
      userName: user.name,
      role: user.role,
      action: 'Password Reset Completed',
      details: `Password successfully updated via OTP verification from IP: ${req.ip || '127.0.0.1'}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: 'Your institutional password has been successfully reset. You may now sign in with your new credentials.',
    });
  } catch (error) {
    console.error('Verify OTP reset error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 17. GET /api/users
 * Super Admin: List all user accounts (excluding sensitive passwords & hashes).
 */
app.get('/api/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await DataStore.getUsers();
    res.json({
      success: true,
      users: users.map((u) => ({
        id: u._id ? u._id.toString() : u.id,
        _id: u._id ? u._id.toString() : u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        college: u.college || null,
        studentNumber: u.studentNumber || null,
        employeeId: u.employeeId || null,
        isActive: u.isActive !== false,
        createdAt: u.createdAt || null,
      })),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 18. POST /api/users
 * Super Admin: Create staff account (Evaluator with assigned college, or Admin).
 */
app.post('/api/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, college, employeeId } = req.body;
    const adminEmail = req.user?.email || req.body.adminEmail || 'admin@earist.edu.ph';
    const adminName = req.user?.name || req.body.adminName || 'Super Administrator';

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, password, and role are required.',
      });
    }

    if (!['evaluator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Only "evaluator" or "admin" staff accounts can be created via this endpoint.',
      });
    }

    if (role === 'evaluator' && !college) {
      return res.status(400).json({
        success: false,
        error: 'Please assign a college (e.g. CIT, CAS, CBA) for the evaluator account.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters in length.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await DataStore.findUser(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const finalEmployeeId = employeeId
      ? employeeId.trim()
      : `EMP-${role.toUpperCase().substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const createdUser = await DataStore.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      college: role === 'evaluator' ? college.trim().toUpperCase() : null,
      employeeId: finalEmployeeId,
      studentNumber: null,
      isActive: true,
    });

    await DataStore.addAuditLog({
      userEmail: adminEmail,
      userName: adminName,
      role: 'admin',
      action: 'Staff Account Created',
      details: `Created [${role.toUpperCase()}] account for ${name.trim()} (${normalizedEmail}, ${role === 'evaluator' ? college : 'Institutional Administration'})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: `Staff account (${role.toUpperCase()}) created successfully.`,
      user: {
        id: createdUser._id || createdUser.id,
        _id: createdUser._id || createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        college: createdUser.college,
        employeeId: createdUser.employeeId,
        isActive: true,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 19. PATCH /api/users/:id/status
 * Super Admin: Toggle user account isActive status (Active vs Suspended).
 */
app.patch('/api/users/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const adminEmail = req.user?.email || req.body.adminEmail || 'admin@earist.edu.ph';
    const adminName = req.user?.name || req.body.adminName || 'Super Administrator';

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please specify the new isActive status (boolean).',
      });
    }

    const updatedUser = await DataStore.updateUserStatus(id, Boolean(isActive));
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User account not found.',
      });
    }

    const statusLabel = isActive ? 'Activated' : 'Suspended';
    await DataStore.addAuditLog({
      userEmail: adminEmail,
      userName: adminName,
      role: 'admin',
      action: 'User Account Status Changed',
      details: `Account ${updatedUser.email} status changed to ${statusLabel} by Super Admin`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: `Account has been successfully ${statusLabel.toLowerCase()}.`,
      user: {
        id: updatedUser._id ? updatedUser._id.toString() : updatedUser.id,
        _id: updatedUser._id ? updatedUser._id.toString() : updatedUser.id,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve built frontend in production (Express v5 Compatible)
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Express 5-safe SPA fallback middleware AFTER all /api/* and /uploads/* routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  next();
});

// Start listening
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` EARIST SFAO Scholarship Management Server`);
  console.log(` Port: ${PORT}`);
  console.log(` API Base: http://localhost:${PORT}/api`);
  console.log(` File Uploads Dir: ${uploadsPath}`);
  console.log(` High-Availability Failover Store: Active`);
  console.log(`====================================================`);
});
