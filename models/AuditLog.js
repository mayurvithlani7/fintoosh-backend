const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Action performed
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'EXPORT', 'ACCESS', 'LOGIN', 'LOGOUT'],
    required: true
  },

  // Entity information
  entityType: { type: String, required: true }, // Model name (e.g., 'User', 'Transaction')
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Document ID

  // User who performed the action
  performedBy: { type: String, required: true }, // User ID
  performedByRole: { type: String, enum: ['parent', 'child', 'elder', 'system'] },

  // Timing
  performedAt: { type: Date, default: Date.now },

  // Context and reasoning
  reason: { type: String, default: null },
  ipAddress: { type: String },
  userAgent: { type: String },

  // Data changes (for GDPR compliance)
  oldData: { type: mongoose.Schema.Types.Mixed }, // Before change
  newData: { type: mongoose.Schema.Types.Mixed }, // After change

  // Additional metadata
  metadata: { type: mongoose.Schema.Types.Mixed }, // Context-specific data

  // Family scoping for data isolation
  familyId: { type: String }, // For family-scoped audit logs

  // Compliance tracking
  retentionExpiry: { type: Date, default: null }, // When this log can be deleted
  complianceFlags: [{ type: String }] // GDPR, SOX, etc.
}, {
  collection: 'audit_logs'
});

// Indexes for efficient querying and compliance
auditLogSchema.index({ entityType: 1, entityId: 1, performedAt: -1 });
auditLogSchema.index({ performedBy: 1, performedAt: -1 });
auditLogSchema.index({ action: 1, performedAt: -1 });
auditLogSchema.index({ familyId: 1, performedAt: -1 });
auditLogSchema.index({ retentionExpiry: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Pre-save middleware to set retention expiry
auditLogSchema.pre('save', function(next) {
  if (!this.retentionExpiry) {
    // Audit logs retained for 7 years (2555 days) for compliance
    this.retentionExpiry = new Date(Date.now() + 2555 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Static methods for compliance queries
auditLogSchema.statics.getEntityHistory = function(entityType, entityId, limit = 100) {
  return this.find({ entityType, entityId })
    .sort({ performedAt: -1 })
    .limit(limit)
    .select('-oldData -newData'); // Exclude sensitive data from general queries
};

auditLogSchema.statics.getUserActivity = function(userId, days = 90) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({
    performedBy: userId,
    performedAt: { $gte: cutoffDate }
  })
  .sort({ performedAt: -1 })
  .select('action entityType performedAt reason');
};

auditLogSchema.statics.getComplianceReport = function(familyId, startDate, endDate) {
  return this.find({
    familyId,
    performedAt: { $gte: startDate, $lte: endDate }
  })
  .sort({ performedAt: -1 })
  .select('action entityType performedAt performedBy reason');
};

// Instance method to check if log is expired
auditLogSchema.methods.isExpired = function() {
  return this.retentionExpiry && this.retentionExpiry < new Date();
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
