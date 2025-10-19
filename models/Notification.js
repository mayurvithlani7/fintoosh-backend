const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  familyId: { type: String, required: true },       // To scope notifications to the family
  userId: { type: String, required: true },         // Recipient's user ID (parent or kid)
  type: { type: String, required: true },           // e.g. 'request_submitted', 'request_approved', 'request_denied'
  message: { type: String, required: true },        // Display message for notification
  referenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalRequest' }, // Link to relevant request (optional)
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'notifications'
});

module.exports = mongoose.model('Notification', notificationSchema);
