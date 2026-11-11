import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    docType: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    applicationNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    studentNumber: {
      type: String,
      required: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    contactMobile: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    college: {
      type: String,
      required: true,
      enum: ['CAS', 'CBA', 'CED', 'CIT', 'CEN', 'CAFA', 'CHM'],
    },
    degreeProgram: {
      type: String,
      required: true,
      trim: true,
    },
    yearLevel: {
      type: String,
      required: true,
      trim: true,
    },
    gwa: {
      type: String,
      required: true,
      trim: true,
    },
    monthlyIncome: {
      type: String,
      required: true,
      trim: true,
    },
    scholarshipGrant: {
      type: String,
      required: true,
      trim: true,
    },
    stipendAmount: {
      type: Number,
      default: 20000,
    },
    academicTerm: {
      type: String,
      default: '1st Sem A.Y. 2026-2027',
      trim: true,
      index: true,
    },
    documents: [documentSchema],
    status: {
      type: String,
      enum: ['Pending Review', 'Endorsed', 'Approved', 'Flagged'],
      default: 'Pending Review',
    },
    evaluatorRemarks: {
      type: String,
      default: '',
    },
    flagReason: {
      type: String,
      default: '',
    },
    evaluatedBy: {
      type: String,
      default: null,
    },
    auditTrail: [
      {
        evaluatorName: { type: String, default: 'System' },
        role: { type: String, default: 'SFAO' },
        action: { type: String, required: true },
        remarks: { type: String, default: '' },
        timestamp: { type: String, default: () => new Date().toISOString() },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for high-speed tracking and querying
applicationSchema.index({ studentNumber: 1 });
applicationSchema.index({ college: 1, status: 1 });
applicationSchema.index({ studentNumber: 1, scholarshipGrant: 1, academicTerm: 1 }, { unique: true, sparse: true });

export const Application = mongoose.model('Application', applicationSchema);
export default Application;
