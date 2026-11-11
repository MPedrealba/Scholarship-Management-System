import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    userName: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
      default: '',
    },
    applicationNo: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    sessionHash: {
      type: String,
      default: () => `SHA256-${Math.random().toString(36).substring(2, 10)}`,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
