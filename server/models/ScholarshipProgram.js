import mongoose from 'mongoose';

const scholarshipProgramSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['National Government', 'Institutional', 'LGU / Private'],
    },
    agency: {
      type: String,
      required: true,
      trim: true,
    },
    stipendAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    maxGwa: {
      type: Number,
      default: 3.0,
      min: 1.0,
      max: 5.0,
    },
    maxMonthlyIncome: {
      type: Number,
      default: null,
      min: 0,
    },
    requiredDocuments: {
      type: [String],
      default: [
        'COR',
        'Grade Slip',
        'Certificate of Indigency',
        'Valid Student ID',
      ],
    },
    totalSlots: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtuals
scholarshipProgramSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

scholarshipProgramSchema.set('toJSON', { virtuals: true });
scholarshipProgramSchema.set('toObject', { virtuals: true });

export const ScholarshipProgram = mongoose.model(
  'ScholarshipProgram',
  scholarshipProgramSchema
);

export default ScholarshipProgram;
