import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { DEFAULT_APPLICATIONS, DEFAULT_QUOTAS, DEFAULT_USERS, DEFAULT_SCHOLARSHIP_PROGRAMS } from './seedData.js';
import { Application } from '../models/Application.js';
import { Quota } from '../models/Quota.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { AcademicTerm } from '../models/AcademicTerm.js';
import { ScholarshipProgram } from '../models/ScholarshipProgram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.resolve(__dirname, 'db_store.json');

const INITIAL_TERMS = [
  {
    id: 'term-active',
    termName: '1st Sem A.Y. 2026-2027',
    isActive: true,
    isArchived: false,
    archivedAt: null,
    archivedBy: null,
    totalApplications: DEFAULT_APPLICATIONS.length,
    approvedScholars: 8,
    disbursedAmount: 180000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'term-past-1',
    termName: '2nd Sem A.Y. 2025-2026',
    isActive: false,
    isArchived: true,
    archivedAt: '2026-06-30T10:00:00.000Z',
    archivedBy: 'Dr. Mario M. Santos (SFAO Director)',
    totalApplications: 45,
    approvedScholars: 42,
    disbursedAmount: 840000,
    createdAt: '2026-01-15T08:00:00.000Z',
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    recipientRole: 'evaluator',
    recipientCollege: 'CIT',
    recipientStudentNumber: null,
    targetRefNo: 'APP-2026-1041',
    title: 'New Application Submitted',
    message: 'Juan Gabriel M. Dela Cruz submitted application for CHED TDP.',
    type: 'submission',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-2',
    recipientRole: 'superadmin',
    recipientCollege: null,
    recipientStudentNumber: null,
    targetRefNo: 'Tertiary Education Subsidy (TES)',
    title: 'Grant Quota Alert (94% Capacity)',
    message: 'UniFAST TES quota has reached 47 of 50 allocated slots (94% capacity).',
    type: 'quota',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'notif-3',
    recipientRole: 'student',
    recipientCollege: 'CIT',
    recipientStudentNumber: '2023-01849-MN-0',
    targetRefNo: 'APP-2026-1041',
    title: 'Application Received by SFAO',
    message: 'Your application APP-2026-1041 has been officially received and queued for evaluation.',
    type: 'submission',
    isRead: false,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

// In-Memory & File Store
let memoryStore = {
  applications: [...DEFAULT_APPLICATIONS].map((app) => ({
    ...app,
    academicTerm: app.academicTerm || '1st Sem A.Y. 2026-2027',
  })),
  quotas: [...DEFAULT_QUOTAS],
  scholarships: [...DEFAULT_SCHOLARSHIP_PROGRAMS],
  users: [...DEFAULT_USERS],
  terms: [...INITIAL_TERMS],
  notifications: [...INITIAL_NOTIFICATIONS],
  auditLogs: [
    {
      timestamp: new Date().toISOString(),
      userEmail: 'admin@earist.edu.ph',
      userName: 'Dr. Rogelio T. Mamaradlo',
      role: 'admin',
      action: 'System Initialized',
      details: 'SFAO Central Scholarship Database operational with Active Term 1st Sem A.Y. 2026-2027.',
      ipAddress: '127.0.0.1',
      sessionHash: 'SHA256-INIT-SYSTEM',
    },
  ],
};

// Load existing store if on disk
try {
  if (fs.existsSync(STORE_PATH)) {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.applications)) {
      memoryStore.applications = parsed.applications.map((app) => ({
        ...app,
        academicTerm: app.academicTerm || '1st Sem A.Y. 2026-2027',
      }));
      memoryStore.quotas = parsed.quotas || [...DEFAULT_QUOTAS];
      memoryStore.scholarships =
        parsed.scholarships && parsed.scholarships.length > 0
          ? parsed.scholarships
          : [...DEFAULT_SCHOLARSHIP_PROGRAMS];
      memoryStore.users = parsed.users || [...DEFAULT_USERS];
      memoryStore.auditLogs = parsed.auditLogs || [];
      memoryStore.terms = parsed.terms && parsed.terms.length > 0 ? parsed.terms : [...INITIAL_TERMS];
      memoryStore.notifications =
        parsed.notifications && parsed.notifications.length > 0
          ? parsed.notifications
          : [...INITIAL_NOTIFICATIONS];
    }
  } else {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2));
  }

  // Ensure default accounts in memoryStore have valid bcrypt hashes
  for (const defUser of DEFAULT_USERS) {
    const existingIdx = memoryStore.users.findIndex(
      (u) => u.email && u.email.toLowerCase() === defUser.email.toLowerCase()
    );
    if (existingIdx === -1) {
      memoryStore.users.push({ ...defUser });
    } else {
      const u = memoryStore.users[existingIdx];
      const isBcrypt = u.password && /^\$2[aby]\$\d{2}\$/.test(u.password);
      let isValidPassword123 = false;
      if (isBcrypt) {
        try {
          isValidPassword123 = bcrypt.compareSync('password123', u.password);
        } catch {
          isValidPassword123 = false;
        }
      }
      if (!isValidPassword123) {
        memoryStore.users[existingIdx] = {
          ...u,
          password: defUser.password,
          role: u.role || defUser.role,
          name: u.name || defUser.name,
          isActive: true,
        };
      }
    }
  }
} catch (e) {
  console.warn('Notice loading local file store:', e.message);
}

function persistFileStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2));
  } catch (err) {
    console.error('Failed to persist local store:', err.message);
  }
}

export const DataStore = {
  // Sync to MongoDB Atlas when connection establishes
  async syncToMongoAtlas() {
    if (mongoose.connection.readyState !== 1) return;
    try {
      const appCount = await Application.countDocuments();
      if (appCount === 0) {
        for (const app of memoryStore.applications) {
          await Application.create(app);
        }
        console.log(' Synced local applications to MongoDB Atlas.');
      }

      const quotaCount = await Quota.countDocuments();
      if (quotaCount === 0) {
        await Quota.insertMany(memoryStore.quotas);
        console.log(' Synced local quotas to MongoDB Atlas.');
      }

      const userCount = await User.countDocuments();
      if (userCount === 0) {
        for (const u of memoryStore.users) {
          await User.create(u);
        }
        console.log(' Synced local users to MongoDB Atlas.');
      }

      // Ensure the 3 default accounts exist and have valid bcrypt hashes in MongoDB Atlas
      for (const defUser of DEFAULT_USERS) {
        const existing = await User.findOne({ email: defUser.email.toLowerCase() });
        if (!existing) {
          await User.create(defUser);
          console.log(` Created missing default user in MongoDB Atlas: ${defUser.email}`);
        } else {
          const isBcrypt = existing.password && /^\$2[aby]\$\d{2}\$/.test(existing.password);
          let isValidPassword123 = false;
          if (isBcrypt) {
            try {
              isValidPassword123 = bcrypt.compareSync('password123', existing.password);
            } catch {
              isValidPassword123 = false;
            }
          }
          if (!isValidPassword123) {
            existing.password = defUser.password;
            if (defUser.role) existing.role = defUser.role;
            if (defUser.name) existing.name = defUser.name;
            if (defUser.college !== undefined) existing.college = defUser.college;
            if (defUser.employeeId !== undefined) existing.employeeId = defUser.employeeId;
            if (defUser.studentNumber !== undefined) existing.studentNumber = defUser.studentNumber;
            existing.isActive = true;
            await existing.save();
            console.log(` Restored corrupted default user in MongoDB Atlas: ${defUser.email}`);
          }
        }
      }

      const termCount = await AcademicTerm.countDocuments();
      if (termCount === 0) {
        for (const t of memoryStore.terms) {
          await AcademicTerm.create({
            termName: t.termName,
            isActive: t.isActive,
            isArchived: t.isArchived,
            archivedAt: t.archivedAt ? new Date(t.archivedAt) : null,
            archivedBy: t.archivedBy,
            totalApplications: t.totalApplications || 0,
            approvedScholars: t.approvedScholars || 0,
            disbursedAmount: t.disbursedAmount || 0,
          });
        }
        console.log(' Synced academic terms to MongoDB Atlas.');
      }

      const notifCount = await Notification.countDocuments();
      if (notifCount === 0) {
        for (const n of memoryStore.notifications) {
          await Notification.create({
            recipientRole: n.recipientRole,
            recipientCollege: n.recipientCollege,
            recipientStudentNumber: n.recipientStudentNumber,
            targetRefNo: n.targetRefNo,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: n.isRead,
          });
        }
        console.log(' Synced notifications to MongoDB Atlas.');
      }

      const progCount = await ScholarshipProgram.countDocuments();
      if (progCount === 0) {
        for (const p of memoryStore.scholarships) {
          const { id: _clientId, _id: _mongoId, ...cleanProg } = p;
          await ScholarshipProgram.create(cleanProg);
        }
        console.log(' Synced local scholarship programs to MongoDB Atlas.');
      }
    } catch (e) {
      console.warn('MongoDB Atlas sync check:', e.message);
    }
  },

  // Applications
  async getApplications(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      try {
        const query = {};
        if (filter.college && filter.college !== 'All' && filter.college !== 'All Colleges') {
          query.college = filter.college;
        }
        if (filter.grant && filter.grant !== 'All' && filter.grant !== 'All Programs') {
          query.scholarshipGrant = filter.grant;
        }
        if (filter.status && filter.status !== 'All') {
          query.status = filter.status;
        }
        if (filter.term && filter.term !== 'All') {
          query.academicTerm = filter.term;
        }
        if (filter.search && String(filter.search).trim()) {
          const q = String(filter.search).trim();
          query.$or = [
            { studentName: { $regex: q, $options: 'i' } },
            { studentNumber: { $regex: q, $options: 'i' } },
            { applicationNo: { $regex: q, $options: 'i' } },
            { degreeProgram: { $regex: q, $options: 'i' } },
          ];
        }
        const docs = await Application.find(query).sort({ createdAt: -1 });
        if (docs && docs.length > 0) return docs;
      } catch (err) {
        console.warn('Atlas read fallback to local store:', err.message);
      }
    }

    // Fallback filter
    return memoryStore.applications.filter((app) => {
      if (filter.college && filter.college !== 'All' && filter.college !== 'All Colleges' && app.college !== filter.college) return false;
      if (filter.grant && filter.grant !== 'All' && filter.grant !== 'All Programs' && app.scholarshipGrant !== filter.grant) return false;
      if (filter.status && filter.status !== 'All' && app.status !== filter.status) return false;
      if (filter.term && filter.term !== 'All' && (app.academicTerm || '1st Sem A.Y. 2026-2027') !== filter.term) return false;
      if (filter.search && String(filter.search).trim()) {
        const q = String(filter.search).toLowerCase();
        const m1 = (app.studentName || '').toLowerCase().includes(q);
        const m2 = (app.studentNumber || '').toLowerCase().includes(q);
        const m3 = (app.applicationNo || app.id || '').toLowerCase().includes(q);
        const m4 = (app.degreeProgram || app.course || '').toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4) return false;
      }
      return true;
    });
  },

  async findApplication(queryStr) {
    if (mongoose.connection.readyState === 1) {
      try {
        const found = await Application.findOne({
          $or: [
            { applicationNo: { $regex: `^${queryStr}$`, $options: 'i' } },
            { studentNumber: { $regex: `^${queryStr}$`, $options: 'i' } },
          ],
        });
        if (found) return found;
      } catch (err) {
        console.warn('Atlas lookup fallback to local store:', err.message);
      }
    }

    return (
      memoryStore.applications.find(
        (a) =>
          (a.applicationNo && a.applicationNo.toLowerCase() === queryStr.toLowerCase()) ||
          (a.studentNumber && a.studentNumber.toLowerCase() === queryStr.toLowerCase()) ||
          (a.id && a.id.toLowerCase() === queryStr.toLowerCase()) ||
          (a.studentId && a.studentId.toLowerCase() === queryStr.toLowerCase())
      ) || null
    );
  },

  // Duplicate Check: Student Number + Grant + Academic Term
  async findDuplicateApplication(studentNumber, scholarshipGrant, academicTerm) {
    const sNorm = (studentNumber || '').trim().toLowerCase();
    const gNorm = (scholarshipGrant || '').trim().toLowerCase();
    const tNorm = (academicTerm || '1st Sem A.Y. 2026-2027').trim().toLowerCase();

    if (mongoose.connection.readyState === 1) {
      try {
        const found = await Application.findOne({
          studentNumber: { $regex: `^${sNorm}$`, $options: 'i' },
          scholarshipGrant: { $regex: `^${gNorm}$`, $options: 'i' },
          academicTerm: { $regex: `^${tNorm}$`, $options: 'i' },
        });
        if (found) return found;
      } catch (err) {
        console.warn('Atlas duplicate check fallback:', err.message);
      }
    }

    return (
      memoryStore.applications.find(
        (a) =>
          (a.studentNumber || a.studentId || '').trim().toLowerCase() === sNorm &&
          (a.scholarshipGrant || a.program || '').trim().toLowerCase() === gNorm &&
          (a.academicTerm || '1st Sem A.Y. 2026-2027').trim().toLowerCase() === tNorm
      ) || null
    );
  },

  async saveApplication(appData) {
    const normalizedApp = {
      ...appData,
      academicTerm: appData.academicTerm || '1st Sem A.Y. 2026-2027',
    };

    // Save to memoryStore
    const idx = memoryStore.applications.findIndex(
      (a) =>
        (a.applicationNo && a.applicationNo === normalizedApp.applicationNo) ||
        (a.id && a.id === normalizedApp.applicationNo)
    );
    if (idx !== -1) {
      memoryStore.applications[idx] = { ...memoryStore.applications[idx], ...normalizedApp };
    } else {
      memoryStore.applications.unshift(normalizedApp);
    }
    persistFileStore();

    // Save to Atlas if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const existing = await Application.findOne({ applicationNo: normalizedApp.applicationNo });
        if (existing) {
          Object.assign(existing, normalizedApp);
          await existing.save();
          return existing;
        } else {
          const created = new Application(normalizedApp);
          await created.save();
          return created;
        }
      } catch (e) {
        console.warn('Atlas save warning:', e.message);
      }
    }

    return normalizedApp;
  },

  // Quotas
  async getQuotas() {
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await Quota.find().sort({ totalSlots: -1 });
        if (docs && docs.length > 0) return docs;
      } catch (e) {
        console.warn('Atlas quota read fallback:', e.message);
      }
    }
    return memoryStore.quotas;
  },

  async updateQuota(grantTypeOrId, updateData) {
    // Update local
    const q = memoryStore.quotas.find(
      (item) =>
        item.grantType === grantTypeOrId ||
        item._id === grantTypeOrId ||
        item.id === grantTypeOrId
    );
    if (q) {
      Object.assign(q, updateData);
      persistFileStore();
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const found = await Quota.findOne({
          $or: [
            { _id: mongoose.Types.ObjectId.isValid(grantTypeOrId) ? grantTypeOrId : null },
            { grantType: grantTypeOrId },
          ],
        });
        if (found) {
          Object.assign(found, updateData);
          await found.save();
          return found;
        }
      } catch (e) {
        console.warn('Atlas quota update warning:', e.message);
      }
    }

    return q;
  },

  // Reset Quotas for New Term
  async resetQuotasForNewTerm() {
    memoryStore.quotas.forEach((q) => {
      q.allocatedSlots = 0;
      q.isLocked = false;
    });
    persistFileStore();

    if (mongoose.connection.readyState === 1) {
      try {
        await Quota.updateMany({}, { $set: { allocatedSlots: 0, isLocked: false } });
      } catch (e) {
        console.warn('Atlas quota reset warning:', e.message);
      }
    }
    return memoryStore.quotas;
  },

  // =========================================================================
  // SCHOLARSHIP PROGRAMS (CRUD + LIVE QUOTA SYNCHRONIZATION)
  // =========================================================================
  async getScholarships(includeInactive = false) {
    let progs = [];
    if (mongoose.connection.readyState === 1) {
      try {
        const query = includeInactive ? {} : { isActive: true };
        const docs = await ScholarshipProgram.find(query).sort({ createdAt: -1 });
        if (docs && docs.length > 0) {
          progs = docs.map((d) => d.toObject());
        }
      } catch (e) {
        console.warn('Atlas scholarship read fallback:', e.message);
      }
    }

    if (!progs || progs.length === 0) {
      progs = (memoryStore.scholarships || []).filter(
        (s) => includeInactive || s.isActive !== false
      );
    }

    // Attach live Quota data & slot availability
    const quotas = await this.getQuotas();
    const apps = memoryStore.applications || [];

    return progs.map((prog) => {
      const q = quotas.find(
        (item) => item.grantType && item.grantType.toLowerCase() === (prog.name || '').toLowerCase()
      );
      const liveAllocated = q?.allocatedSlots ?? apps.filter(
        (a) =>
          (a.scholarshipGrant === prog.name || a.program === prog.name) &&
          ['Approved', 'Endorsed', 'Pending Review'].includes(a.status)
      ).length;
      const totalSlots = prog.totalSlots || q?.totalSlots || 50;
      const remainingSlots = Math.max(0, totalSlots - liveAllocated);
      const isLocked = q?.isLocked || false;

      return {
        ...prog,
        id: prog._id ? prog._id.toString() : prog.id,
        _id: prog._id ? prog._id.toString() : prog.id,
        totalSlots,
        allocatedSlots: liveAllocated,
        remainingSlots,
        isLocked,
      };
    });
  },

  async getScholarshipById(id) {
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await ScholarshipProgram.findOne({
          $or: [
            { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
            { id },
          ],
        });
        if (doc) return doc.toObject();
      } catch (e) {
        console.warn('Atlas getScholarshipById fallback:', e.message);
      }
    }
    return (memoryStore.scholarships || []).find((s) => s.id === id || s._id === id) || null;
  },

  async getScholarshipByName(name) {
    if (!name) return null;
    const cleanName = String(name).trim().toLowerCase();
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await ScholarshipProgram.findOne({
          name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
        if (doc) return doc.toObject();
      } catch (e) {
        console.warn('Atlas getScholarshipByName fallback:', e.message);
      }
    }
    return (
      (memoryStore.scholarships || []).find(
        (s) => s.name && s.name.toLowerCase() === cleanName
      ) || null
    );
  },

  async createScholarship(data) {
    const existing = await this.getScholarshipByName(data.name);
    if (existing) {
      const err = new Error(`Scholarship program "${data.name}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    const newId = `prog-${Date.now()}`;
    const newProg = {
      id: newId,
      name: data.name.trim(),
      category: data.category,
      agency: data.agency.trim(),
      stipendAmount: Number(data.stipendAmount) || 0,
      description: data.description.trim(),
      maxGwa: data.maxGwa !== undefined && data.maxGwa !== null && data.maxGwa !== '' ? Number(data.maxGwa) : 3.0,
      maxMonthlyIncome: data.maxMonthlyIncome !== undefined && data.maxMonthlyIncome !== null && data.maxMonthlyIncome !== '' ? Number(data.maxMonthlyIncome) : null,
      requiredDocuments: Array.isArray(data.requiredDocuments) && data.requiredDocuments.length > 0
        ? data.requiredDocuments
        : ['COR', 'Grade Slip', 'Certificate of Indigency', 'Valid Student ID'],
      totalSlots: Number(data.totalSlots) || 50,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!memoryStore.scholarships) memoryStore.scholarships = [];
    memoryStore.scholarships.unshift(newProg);

    // Sync corresponding Quota
    let matchingQuota = memoryStore.quotas.find(
      (q) => q.grantType.toLowerCase() === newProg.name.toLowerCase()
    );
    if (!matchingQuota) {
      matchingQuota = {
        id: `quota-${Date.now()}`,
        grantType: newProg.name,
        totalSlots: newProg.totalSlots,
        allocatedSlots: 0,
        isLocked: false,
      };
      memoryStore.quotas.push(matchingQuota);
    } else {
      matchingQuota.totalSlots = newProg.totalSlots;
    }

    persistFileStore();

    if (mongoose.connection.readyState === 1) {
      try {
        const { id: _clientId, _id: _mongoId, ...cleanData } = newProg;
        const created = await ScholarshipProgram.create(cleanData);
        newProg._id = created._id.toString();
        newProg.id = created._id.toString();

        await Quota.findOneAndUpdate(
          { grantType: newProg.name },
          {
            $set: { totalSlots: newProg.totalSlots },
            $setOnInsert: { allocatedSlots: 0, isLocked: false },
          },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.warn('Atlas createScholarship warning:', e.message);
      }
    }

    return newProg;
  },

  async updateScholarship(id, updateData) {
    let existing = (memoryStore.scholarships || []).find((s) => s.id === id || s._id === id);
    let oldName = existing?.name;

    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await ScholarshipProgram.findOne({
          $or: [
            { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
            { id },
          ],
        });
        if (doc) {
          oldName = oldName || doc.name;
          Object.assign(doc, {
            ...(updateData.name && { name: updateData.name.trim() }),
            ...(updateData.category && { category: updateData.category }),
            ...(updateData.agency && { agency: updateData.agency.trim() }),
            ...(updateData.stipendAmount !== undefined && { stipendAmount: Number(updateData.stipendAmount) }),
            ...(updateData.description && { description: updateData.description.trim() }),
            ...(updateData.maxGwa !== undefined && { maxGwa: Number(updateData.maxGwa) }),
            ...(updateData.maxMonthlyIncome !== undefined && { maxMonthlyIncome: updateData.maxMonthlyIncome === null || updateData.maxMonthlyIncome === '' ? null : Number(updateData.maxMonthlyIncome) }),
            ...(updateData.requiredDocuments && { requiredDocuments: updateData.requiredDocuments }),
            ...(updateData.totalSlots !== undefined && { totalSlots: Number(updateData.totalSlots) }),
            ...(updateData.isActive !== undefined && { isActive: Boolean(updateData.isActive) }),
          });
          await doc.save();
          existing = doc.toObject();
        }
      } catch (e) {
        console.warn('Atlas updateScholarship warning:', e.message);
      }
    }

    // Update in memoryStore
    const idx = (memoryStore.scholarships || []).findIndex((s) => s.id === id || s._id === id);
    if (idx !== -1) {
      memoryStore.scholarships[idx] = {
        ...memoryStore.scholarships[idx],
        ...updateData,
        ...(updateData.name && { name: updateData.name.trim() }),
        ...(updateData.stipendAmount !== undefined && { stipendAmount: Number(updateData.stipendAmount) }),
        ...(updateData.totalSlots !== undefined && { totalSlots: Number(updateData.totalSlots) }),
        updatedAt: new Date().toISOString(),
      };
      existing = memoryStore.scholarships[idx];
    }

    // Sync corresponding Quota (rename or update totalSlots)
    const newName = updateData.name ? updateData.name.trim() : oldName;
    const newTotal = updateData.totalSlots !== undefined ? Number(updateData.totalSlots) : undefined;

    const quota = memoryStore.quotas.find(
      (q) => q.grantType.toLowerCase() === (oldName || '').toLowerCase()
    );
    if (quota) {
      if (newName) quota.grantType = newName;
      if (newTotal !== undefined) quota.totalSlots = newTotal;
    }

    persistFileStore();

    if (mongoose.connection.readyState === 1 && (newName !== oldName || newTotal !== undefined)) {
      try {
        await Quota.findOneAndUpdate(
          { grantType: oldName },
          {
            $set: {
              ...(newName && { grantType: newName }),
              ...(newTotal !== undefined && { totalSlots: newTotal }),
            },
          }
        );
      } catch (e) {
        console.warn('Atlas quota sync on program update warning:', e.message);
      }
    }

    return existing;
  },

  async deleteScholarship(id) {
    let prog = (memoryStore.scholarships || []).find((s) => s.id === id || s._id === id);
    let progName = prog?.name;

    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await ScholarshipProgram.findOne({
          $or: [
            { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
            { id },
          ],
        });
        if (doc) {
          progName = progName || doc.name;
          await ScholarshipProgram.deleteOne({ _id: doc._id });
        }
      } catch (e) {
        console.warn('Atlas deleteScholarship warning:', e.message);
      }
    }

    memoryStore.scholarships = (memoryStore.scholarships || []).filter(
      (s) => s.id !== id && s._id !== id
    );

    if (progName) {
      memoryStore.quotas = memoryStore.quotas.filter(
        (q) => q.grantType.toLowerCase() !== progName.toLowerCase()
      );
      if (mongoose.connection.readyState === 1) {
        try {
          await Quota.deleteOne({ grantType: progName });
        } catch (e) {
          console.warn('Atlas deleteQuota warning:', e.message);
        }
      }
    }

    persistFileStore();
    return true;
  },

  async countApplicationsForGrant(grantName) {
    if (!grantName) return 0;
    const cleanName = String(grantName).trim().toLowerCase();
    if (mongoose.connection.readyState === 1) {
      try {
        return await Application.countDocuments({
          $or: [
            { scholarshipGrant: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            { program: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          ],
        });
      } catch (e) {
        console.warn('Atlas countApplicationsForGrant fallback:', e.message);
      }
    }

    return (memoryStore.applications || []).filter(
      (a) =>
        (a.scholarshipGrant && a.scholarshipGrant.toLowerCase() === cleanName) ||
        (a.program && a.program.toLowerCase() === cleanName)
    ).length;
  },

  // Audit Logs
  async getAuditLogs() {
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await AuditLog.find().sort({ timestamp: -1 }).limit(150);
        if (docs && docs.length > 0) return docs;
      } catch (e) {
        console.warn('Atlas audit log read fallback:', e.message);
      }
    }
    return memoryStore.auditLogs;
  },

  async addAuditLog(entry) {
    const record = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
      sessionHash: entry.sessionHash || `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      ipAddress: entry.ipAddress || '127.0.0.1',
    };
    memoryStore.auditLogs.unshift(record);
    persistFileStore();

    if (mongoose.connection.readyState === 1) {
      try {
        await AuditLog.create(record);
      } catch (e) {
        console.warn('Atlas audit log save warning:', e.message);
      }
    }
    return record;
  },

  // Notifications
  async getNotifications(filters = {}) {
    const { role, college, studentNumber } = filters;

    if (mongoose.connection.readyState === 1) {
      try {
        const query = {};
        if (role) {
          query.$or = [{ recipientRole: role }, { recipientRole: 'all' }];
        }
        if (college && college !== 'All') {
          query.recipientCollege = { $in: [college, null] };
        }
        if (studentNumber) {
          query.recipientStudentNumber = { $in: [studentNumber, null] };
        }
        const docs = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
        if (docs && docs.length > 0) return docs;
      } catch (err) {
        console.warn('Atlas notifications read fallback:', err.message);
      }
    }

    return memoryStore.notifications.filter((n) => {
      if (role && n.recipientRole !== role && n.recipientRole !== 'all') return false;
      if (college && college !== 'All' && n.recipientCollege && n.recipientCollege !== college) return false;
      if (studentNumber && n.recipientStudentNumber && n.recipientStudentNumber !== studentNumber) return false;
      return true;
    });
  },

  async addNotification(data) {
    const notif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientRole: data.recipientRole || 'all',
      recipientCollege: data.recipientCollege || null,
      recipientStudentNumber: data.recipientStudentNumber || null,
      targetRefNo: data.targetRefNo || null,
      title: data.title,
      message: data.message,
      type: data.type || 'submission',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    memoryStore.notifications.unshift(notif);
    persistFileStore();

    if (mongoose.connection.readyState === 1) {
      try {
        await Notification.create(notif);
      } catch (e) {
        console.warn('Atlas notification save warning:', e.message);
      }
    }

    return notif;
  },

  async markNotificationRead(id) {
    const notif = memoryStore.notifications.find(
      (n) => n.id === id || (n._id && n._id.toString() === id)
    );
    if (notif) {
      notif.isRead = true;
      persistFileStore();
    }

    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          await Notification.findByIdAndUpdate(id, { isRead: true });
        } else {
          await Notification.findOneAndUpdate({ id }, { isRead: true });
        }
      } catch (e) {
        console.warn('Atlas notification update warning:', e.message);
      }
    }

    return notif;
  },

  async markAllNotificationsRead(role, college, studentNumber) {
    memoryStore.notifications.forEach((n) => {
      if (!role || n.recipientRole === role || n.recipientRole === 'all') {
        if (!college || !n.recipientCollege || n.recipientCollege === college) {
          if (!studentNumber || !n.recipientStudentNumber || n.recipientStudentNumber === studentNumber) {
            n.isRead = true;
          }
        }
      }
    });
    persistFileStore();

    if (mongoose.connection.readyState === 1) {
      try {
        const query = {};
        if (role) query.recipientRole = { $in: [role, 'all'] };
        if (college) query.recipientCollege = { $in: [college, null] };
        if (studentNumber) query.recipientStudentNumber = { $in: [studentNumber, null] };
        await Notification.updateMany(query, { isRead: true });
      } catch (e) {
        console.warn('Atlas notification bulk read warning:', e.message);
      }
    }

    return true;
  },

  // Academic Terms
  async getAcademicTerms() {
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await AcademicTerm.find().sort({ createdAt: -1 });
        if (docs && docs.length > 0) return docs;
      } catch (e) {
        console.warn('Atlas academic terms fallback:', e.message);
      }
    }
    return memoryStore.terms;
  },

  async archiveTerm({ currentTermName, nextTermName, adminName, adminEmail }) {
    const now = new Date().toISOString();

    // Mark current term as archived
    const currentTerm = memoryStore.terms.find((t) => t.termName === currentTermName || t.isActive);
    if (currentTerm) {
      currentTerm.isActive = false;
      currentTerm.isArchived = true;
      currentTerm.archivedAt = now;
      currentTerm.archivedBy = adminName || 'SFAO Super Admin';
    }

    // Check if next term already exists or create new
    let nextTerm = memoryStore.terms.find((t) => t.termName === nextTermName);
    if (!nextTerm) {
      nextTerm = {
        id: `term-${Date.now()}`,
        termName: nextTermName,
        isActive: true,
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
        totalApplications: 0,
        approvedScholars: 0,
        disbursedAmount: 0,
        createdAt: now,
      };
      memoryStore.terms.unshift(nextTerm);
    } else {
      nextTerm.isActive = true;
      nextTerm.isArchived = false;
    }

    // Reset Quotas
    await this.resetQuotasForNewTerm();

    persistFileStore();

    if (mongoose.connection.readyState === 1) {
      try {
        await AcademicTerm.updateMany({ termName: currentTermName }, {
          isActive: false,
          isArchived: true,
          archivedAt: new Date(now),
          archivedBy: adminName,
        });

        await AcademicTerm.findOneAndUpdate(
          { termName: nextTermName },
          {
            termName: nextTermName,
            isActive: true,
            isArchived: false,
            archivedAt: null,
            archivedBy: null,
          },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.warn('Atlas term archive warning:', e.message);
      }
    }

    // Log Archival to Audit Trail
    await this.addAuditLog({
      userEmail: adminEmail || 'admin@earist.edu.ph',
      userName: adminName || 'Dr. Mario M. Santos',
      role: 'superadmin',
      action: `Archived Academic Term ${currentTermName}`,
      details: `Term closed and sealed. Transitioned active enrollment to ${nextTermName}. Quota allocations reset to 0.`,
      ipAddress: '127.0.0.1',
    });

    return {
      currentTerm,
      nextTerm,
      terms: memoryStore.terms,
    };
  },

  // Users
  async findUser(identifier) {
    const input = (identifier || '').trim();
    const inputLower = input.toLowerCase();

    if (mongoose.connection.readyState === 1) {
      try {
        const query = [
          { email: inputLower },
          { studentNumber: input },
          { employeeId: input },
        ];
        if (mongoose.isValidObjectId(input)) {
          query.push({ _id: input });
        }
        const found = await User.findOne({ $or: query });
        if (found) return found;
      } catch (e) {
        console.warn('Atlas user lookup fallback:', e.message);
      }
    }

    return (
      memoryStore.users.find(
        (u) =>
          u.email.toLowerCase() === inputLower ||
          (u.studentNumber && u.studentNumber === input) ||
          (u.employeeId && u.employeeId === input) ||
          (u._id && u._id.toString() === input) ||
          (u.id && u.id.toString() === input)
      ) || null
    );
  },

  async getUsers() {
    if (mongoose.connection.readyState === 1) {
      try {
        const users = await User.find({}, '-password -resetOtpHash -resetOtpExpires -resetOtpAttempts').sort({ createdAt: -1 });
        if (users && users.length > 0) {
          return users;
        }
      } catch (e) {
        console.warn('Atlas getUsers fallback:', e.message);
      }
    }
    return memoryStore.users.map((u) => {
      const copy = { ...u };
      delete copy.password;
      delete copy.resetOtpHash;
      delete copy.resetOtpExpires;
      delete copy.resetOtpAttempts;
      return copy;
    });
  },

  async createUser(userData) {
    let createdDoc = null;
    let hashedPassword = userData.password;
    if (userData.password && !userData.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const newUser = new User(userData);
        createdDoc = await newUser.save();
      } catch (e) {
        console.warn('Atlas createUser fallback:', e.message);
      }
    }

    const localUser = {
      _id: createdDoc ? createdDoc._id.toString() : `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...userData,
      password: hashedPassword,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryStore.users.unshift(localUser);
    persistFileStore();

    return createdDoc || localUser;
  },

  async updateUser(idOrEmail, updates) {
    let updatedDoc = null;
    const input = (idOrEmail || '').toString().trim();

    if (mongoose.connection.readyState === 1) {
      try {
        const query = mongoose.isValidObjectId(input)
          ? { _id: input }
          : { email: input.toLowerCase() };
        
        const user = await User.findOne(query);
        if (user) {
          Object.assign(user, updates);
          updatedDoc = await user.save();
        }
      } catch (e) {
        console.warn('Atlas updateUser fallback:', e.message);
      }
    }

    const index = memoryStore.users.findIndex(
      (u) =>
        (u._id && u._id.toString() === input) ||
        (u.id && u.id.toString() === input) ||
        u.email.toLowerCase() === input.toLowerCase()
    );

    if (index !== -1) {
      memoryStore.users[index] = {
        ...memoryStore.users[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      persistFileStore();
      return updatedDoc || memoryStore.users[index];
    }

    return updatedDoc;
  },

  async updateUserStatus(id, isActive) {
    return this.updateUser(id, { isActive });
  },

  getSnapshot() {
    return {
      institution: 'Eulogio "Amang" Rodriguez Institute of Science and Technology (EARIST)',
      office: 'Office of Student Financial Assistance (SFAO)',
      academicTerm: '1st Semester, Academic Year 2026-2027',
      systemVersion: '2.5.0-Enterprise-Production',
      exportedAt: new Date().toISOString(),
      summary: {
        totalApplications: memoryStore.applications.length,
        totalQuotas: memoryStore.quotas.length,
        totalAuditLogs: memoryStore.auditLogs.length,
        totalUsers: memoryStore.users.length,
        totalTerms: memoryStore.terms.length,
        totalNotifications: memoryStore.notifications.length,
      },
      data: {
        applications: memoryStore.applications,
        quotas: memoryStore.quotas,
        users: memoryStore.users.map((u) => ({ ...u, password: '[PROTECTED_HASH]' })),
        auditLogs: memoryStore.auditLogs,
        terms: memoryStore.terms,
        notifications: memoryStore.notifications,
      },
    };
  },
};
