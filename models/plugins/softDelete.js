const mongoose = require('mongoose');

/**
 * Soft Delete Plugin for Mongoose
 * Adds comprehensive soft delete functionality with audit trails
 *
 * Features:
 * - Soft delete with retention periods
 * - Audit logging for all delete operations
 * - Automatic query filtering
 * - GDPR/CCPA compliance
 * - Data restoration capabilities
 */
const softDeletePlugin = (schema, options = {}) => {
  // Default options
  const defaultOptions = {
    // Retention periods in days for different data types
    retentionPeriods: {
      'User': 2555,              // 7 years (GDPR)
      'Transaction': 2555,       // 7 years (financial records)
      'RealAllowance': 2555,     // 7 years (financial records)
      'LedgerTransaction': 2555, // 7 years (accounting records)
      'LedgerEntry': 2555,       // 7 years (accounting records)
      'LedgerAccount': 2555,     // 7 years (accounting records)
      'Goal': 365,               // 1 year
      'Chore': 365,              // 1 year
      'Reward': 365,             // 1 year
      'Notification': 90,        // 90 days
      'ApprovalRequest': 365,    // 1 year
      'FamilyDiscussion': 365,   // 1 year
      'FamilyTimeline': 365,     // 1 year
      'DreamBoard': 365,         // 1 year
      'ParentMilestone': 365,    // 1 year
      'Achievement': 365,        // 1 year
      'AIUsage': 365,            // 1 year
      'EducationModule': 365,    // 1 year
      default: 365               // 1 year default
    },
    // Whether to enable audit logging
    enableAuditLog: true,
    // Field names
    deletedField: 'isDeleted',
    deletedAtField: 'deletedAt',
    deletedByField: 'deletedBy',
    deletionReasonField: 'deletionReason',
    retentionExpiryField: 'retentionExpiry'
  };

  const opts = { ...defaultOptions, ...options };

  // Add soft delete fields to schema
  schema.add({
    [opts.deletedField]: { type: Boolean, default: false },
    [opts.deletedAtField]: { type: Date, default: null },
    [opts.deletedByField]: { type: String, default: null },
    [opts.deletionReasonField]: { type: String, default: null },
    [opts.retentionExpiryField]: { type: Date, default: null }
  });

  // Add indexes for performance
  schema.index({ [opts.deletedField]: 1, [opts.deletedAtField]: 1 });
  schema.index({ [opts.retentionExpiryField]: 1 }, { expireAfterSeconds: 0 }); // TTL index

  // Instance method for soft delete
  schema.methods.softDelete = async function(deletedBy, reason = 'User requested deletion', metadata = {}) {
    // Prevent double deletion
    if (this[opts.deletedField]) {
      throw new Error('Document is already deleted');
    }

    // Store original data for audit
    const oldData = this.toObject();

    // Set deletion fields
    this[opts.deletedField] = true;
    this[opts.deletedAtField] = new Date();
    this[opts.deletedByField] = deletedBy;
    this[opts.deletionReasonField] = reason;

    // Set retention period based on model type
    const modelName = this.constructor.modelName;
    const retentionDays = opts.retentionPeriods[modelName] || opts.retentionPeriods.default;
    this[opts.retentionExpiryField] = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);

    // Create audit log entry if enabled
    if (opts.enableAuditLog) {
      const AuditLog = mongoose.model('AuditLog');
      await AuditLog.create({
        action: 'DELETE',
        entityType: modelName,
        entityId: this._id,
        performedBy: deletedBy,
        reason: reason,
        oldData: oldData,
        metadata: {
          retentionDays,
          ...metadata
        },
        familyId: this.familyId || null // For family-scoped entities
      });
    }

    return this.save();
  };

  // Instance method for restore
  schema.methods.restore = async function(restoredBy, reason = 'Data restored from deletion') {
    // Check if actually deleted
    if (!this[opts.deletedField]) {
      throw new Error('Document is not deleted');
    }

    // Store original data for audit
    const oldData = this.toObject();

    // Clear deletion fields
    this[opts.deletedField] = false;
    this[opts.deletedAtField] = null;
    this[opts.deletedByField] = null;
    this[opts.deletionReasonField] = null;
    this[opts.retentionExpiryField] = null;

    // Create audit log entry if enabled
    if (opts.enableAuditLog) {
      const AuditLog = mongoose.model('AuditLog');
      await AuditLog.create({
        action: 'RESTORE',
        entityType: this.constructor.modelName,
        entityId: this._id,
        performedBy: restoredBy,
        reason: reason,
        oldData: oldData,
        newData: this.toObject(),
        familyId: this.familyId || null
      });
    }

    return this.save();
  };

  // Instance method to get retention period
  schema.methods.getRetentionPeriod = function() {
    const modelName = this.constructor.modelName;
    return opts.retentionPeriods[modelName] || opts.retentionPeriods.default;
  };

  // Instance method to check if expired
  schema.methods.isExpired = function() {
    return this[opts.retentionExpiryField] && this[opts.retentionExpiryField] < new Date();
  };

  // Static method to find non-deleted records
  schema.statics.findActive = function(conditions = {}) {
    return this.find({ ...conditions, [opts.deletedField]: false });
  };

  // Static method to find deleted records
  schema.statics.findDeleted = function(conditions = {}) {
    return this.find({ ...conditions, [opts.deletedField]: true });
  };

  // Static method to find all records (including deleted)
  schema.statics.findWithDeleted = function(conditions = {}) {
    return this.find({ ...conditions, [opts.deletedField]: { $exists: true } });
  };

  // Static method to hard delete expired records (admin only)
  schema.statics.hardDeleteExpired = async function() {
    const expiredRecords = await this.find({
      [opts.deletedField]: true,
      [opts.retentionExpiryField]: { $lt: new Date() }
    });

    const deletedCount = await this.deleteMany({
      [opts.deletedField]: true,
      [opts.retentionExpiryField]: { $lt: new Date() }
    });

    return { deletedCount: deletedCount.deletedCount, records: expiredRecords };
  };

  // Pre-find middleware to exclude deleted records by default
  // This affects all queries unless explicitly overridden
  schema.pre('find', function() {
    if (this._conditions[opts.deletedField] === undefined) {
      this.where({ [opts.deletedField]: false });
    }
  });

  schema.pre('findOne', function() {
    if (this._conditions[opts.deletedField] === undefined) {
      this.where({ [opts.deletedField]: false });
    }
  });

  schema.pre('countDocuments', function() {
    if (this._conditions[opts.deletedField] === undefined) {
      this.where({ [opts.deletedField]: false });
    }
  });

  schema.pre('findOneAndUpdate', function() {
    if (this._conditions[opts.deletedField] === undefined) {
      this.where({ [opts.deletedField]: false });
    }
  });

  schema.pre('findOneAndDelete', function() {
    if (this._conditions[opts.deletedField] === undefined) {
      this.where({ [opts.deletedField]: false });
    }
  });

  // Pre-save middleware to create audit log for updates
  schema.pre('save', async function(next) {
    if (opts.enableAuditLog && !this.isNew && this.isModified()) {
      try {
        const AuditLog = mongoose.model('AuditLog');
        const modelName = this.constructor.modelName;

        // Get the original document
        const original = await this.constructor.findById(this._id);
        if (original) {
          await AuditLog.create({
            action: 'UPDATE',
            entityType: modelName,
            entityId: this._id,
            performedBy: this.updatedBy || this.modifiedBy || 'system',
            oldData: original.toObject(),
            newData: this.toObject(),
            familyId: this.familyId || original.familyId || null
          });
        }
      } catch (error) {
        console.error('Error creating update audit log:', error);
        // Don't fail the save operation due to audit log error
      }
    }
    next();
  });
};

module.exports = softDeletePlugin;
