// =============================================================
//  Mongoose Model: Vital Reading
//  Preserves exact fields and data types from SQLite schema:
//  (id, timestamp, heart_rate, spo2, status, created_at)
// =============================================================

const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },
    timestamp: {
      type: String,
      required: true,
      trim: true,
    },
    heart_rate: {
      type: Number,
      required: true,
    },
    spo2: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['NORMAL', 'CRITICAL'],
    },
    created_at: {
      type: String,
      default: () => {
        const now = new Date();
        return now.toISOString().replace('T', ' ').slice(0, 19);
      },
      index: true,
    },
  },
  {
    // Do not include version key in output
    versionKey: false,
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

// Pre-save hook: auto-assign sequential id if not already specified
vitalSchema.pre('save', async function (next) {
  if (this.id === undefined || this.id === null) {
    try {
      const highestRecord = await this.constructor.findOne().sort({ id: -1 }).select('id');
      this.id = highestRecord && typeof highestRecord.id === 'number' ? highestRecord.id + 1 : 1;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Vital = mongoose.model('Vital', vitalSchema);

module.exports = Vital;

