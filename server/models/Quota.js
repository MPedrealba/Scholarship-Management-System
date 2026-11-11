import mongoose from 'mongoose';

const quotaSchema = new mongoose.Schema(
  {
    grantType: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    totalSlots: {
      type: Number,
      required: true,
      min: 0,
    },
    allocatedSlots: {
      type: Number,
      default: 0,
      min: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for remaining slots
quotaSchema.virtual('remainingSlots').get(function () {
  return Math.max(0, this.totalSlots - this.allocatedSlots);
});

quotaSchema.set('toJSON', { virtuals: true });
quotaSchema.set('toObject', { virtuals: true });

export const Quota = mongoose.model('Quota', quotaSchema);
export default Quota;
