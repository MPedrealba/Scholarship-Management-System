import mongoose from 'mongoose';

const academicTermSchema = new mongoose.Schema(
  {
    termName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: String,
      default: null,
    },
    totalApplications: {
      type: Number,
      default: 0,
    },
    approvedScholars: {
      type: Number,
      default: 0,
    },
    disbursedAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const AcademicTerm = mongoose.model('AcademicTerm', academicTermSchema);
export default AcademicTerm;
