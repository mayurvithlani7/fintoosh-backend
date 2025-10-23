const mongoose = require('mongoose');

const choreTemplateSchema = new mongoose.Schema({
  familyId: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Child this template is for
  name: { type: String, required: true },
  description: { type: String },
  points: { type: Number, required: true },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  category: { type: String, enum: ['cleaning', 'learning', 'helping', 'other'], default: 'other' },

  // Recurring settings
  gracePeriodDays: { type: Number, default: 1 }, // Days before marking overdue
  allowCarryOver: { type: Boolean, default: false }, // Carry uncompleted tasks to next period
  maxOverdueInstances: { type: Number, default: 3 }, // How many overdue instances to keep
  nextInstanceDue: { type: Date, required: true }, // When to create next instance

  // Point automation - split settings
  useDefaultSplit: { type: Boolean, default: true },
  customSplit: {
    current: { type: Number, default: 0, min: 0, max: 100 },
    save: { type: Number, default: 0, min: 0, max: 100 },
    spend: { type: Number, default: 0, min: 0, max: 100 },
    donate: { type: Number, default: 0, min: 0, max: 100 },
    invest: { type: Number, default: 0, min: 0, max: 100 }
  },

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient job scheduler queries
choreTemplateSchema.index({ nextInstanceDue: 1, isActive: 1 });
choreTemplateSchema.index({ familyId: 1, user: 1 });

module.exports = mongoose.model('ChoreTemplate', choreTemplateSchema);
