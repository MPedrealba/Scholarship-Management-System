import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: {
      type: String,
      enum: ['superadmin', 'evaluator', 'student', 'all'],
      required: true,
      index: true,
    },
    recipientCollege: {
      type: String,
      default: null,
      index: true,
    },
    recipientStudentNumber: {
      type: String,
      default: null,
      index: true,
    },
    targetRefNo: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['submission', 'endorsement', 'flagged', 'approval', 'quota', 'system'],
      default: 'submission',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientRole: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
