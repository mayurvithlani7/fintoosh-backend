# Society SuperApp — Technical Addendum

## Full MongoDB Schema

```javascript
COMPLETE MONGODB SCHEMA

Collection: societies
{
  _id: ObjectId,
  name: String,
  address: {
    street: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  locale: { type: String, default: 'en-IN' },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  // Embedded towers for fast access
  towers: [{
    _id: ObjectId,
    name: String,
    floors: Number,
    // Embedded units within towers
    units: [{
      _id: ObjectId,
      number: String,
      type: { type: String, enum: ['apartment','villa','shop'] },
      sqft: Number,
      floor: Number,
      status: { type: String, enum: ['vacant','occupied','maintenance'], default: 'occupied' },
      // Embedded resident info for fast access
      resident: {
        userId: ObjectId,
        name: String,
        phone: String,
        relationship: { type: String, enum: ['owner','tenant','family_member'] }
      }
    }]
  }],
  // Embedded facilities
  facilities: [{
    _id: ObjectId,
    name: String,
    type: String,
    capacity: Number,
    operatingHours: Object,
    pricing: Object
  }],
  // Security configuration
  security: {
    gates: Number,
    guards: Number,
    cctvCameras: Number
  },
  subscription: {
    plan: String,
    status: { type: String, enum: ['active','inactive','suspended'] },
    expiresAt: Date
  },
  stats: {
    totalUnits: Number,
    occupiedUnits: Number,
    totalResidents: Number
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

Collection: users
{
  _id: ObjectId,
  phone: String, // E.164 format
  name: String,
  kycStatus: { type: String, enum: ['none','pending','verified'], default: 'none' },
  profile: {
    avatar: String,
    dateOfBirth: Date,
    gender: String,
    language: { type: String, default: 'en' }
  },
  // Embedded society memberships
  societies: [{
    societyId: ObjectId,
    societyName: String,
    roles: [{
      role: { type: String, enum: ['admin','committee','facility','guard','resident','auditor'] },
      unitId: ObjectId,
      unitNumber: String,
      towerName: String
    }],
    joinedAt: Date
  }],
  // Authentication
  auth: {
    otp: {
      code: String,
      expires: Date,
      attempts: { type: Number, default: 0 }
    },
    lastLogin: Date,
    devices: [{
      deviceId: String,
      deviceType: String,
      pushToken: String,
      lastActive: Date
    }]
  },
  preferences: {
    notifications: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    },
    language: String,
    timezone: String
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

Collection: visitors
{
  _id: ObjectId,
  name: String,
  phone: String,
  type: { type: String, enum: ['guest','delivery','vendor','driver'], required: true },
  vehiclePlate: String,
  company: String, // For vendors/drivers
  idProof: {
    type: String,
    number: String,
    url: String // Photo of ID
  },
  // Visit history for frequent visitors
  visitHistory: [{
    societyId: ObjectId,
    date: Date,
    purpose: String,
    unitNumber: String
  }],
  isFrequentVisitor: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

Collection: passes (semi-denormalized)
{
  _id: ObjectId,
  societyId: ObjectId,
  societyName: String,
  // Embedded visitor snapshot
  visitor: {
    visitorId: ObjectId,
    name: String,
    phone: String,
    type: String,
    vehiclePlate: String,
    photo: String
  },
  // Embedded unit snapshot
  unit: {
    unitId: ObjectId,
    number: String,
    towerName: String,
    residentName: String,
    residentPhone: String
  },
  // Pass details
  purpose: String,
  validFrom: Date,
  validTo: Date,
  qrToken: { type: String, unique: true },
  status: { type: String, enum: ['active','used','expired','cancelled'], default: 'active' },
  // Approval workflow
  approval: {
    requestedBy: ObjectId,
    requestedAt: { type: Date, default: Date.now },
    approvedBy: ObjectId,
    approvedAt: Date,
    rejectedReason: String
  },
  // Usage tracking
  usage: {
    checkinAt: Date,
    checkoutAt: Date,
    guardId: ObjectId,
    guardName: String,
    gateId: ObjectId,
    gateName: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

Collection: checkins
{
  _id: ObjectId,
  passId: ObjectId,
  societyId: ObjectId,
  // Embedded snapshots for performance
  visitorSnapshot: {
    visitorId: ObjectId,
    name: String,
    phone: String,
    type: String,
    vehiclePlate: String,
    photo: String
  },
  unitSnapshot: {
    unitId: ObjectId,
    number: String,
    towerName: String,
    residentName: String
  },
  guardSnapshot: {
    guardId: ObjectId,
    name: String,
    badge: String
  },
  gateSnapshot: {
    gateId: ObjectId,
    name: String,
    type: String
  },
  // Check-in details
  inAt: { type: Date, required: true },
  outAt: Date,
  purpose: String,
  notes: String,
  // Vehicle details if applicable
  vehicle: {
    plate: String,
    type: String,
    color: String,
    parkingSlot: String
  },
  // Photos/evidence
  photos: [String], // URLs to photos
  status: { type: String, enum: ['checked_in','checked_out'], default: 'checked_in' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

Collection: complaints
{
  _id: ObjectId,
  societyId: ObjectId,
  unitId: ObjectId,
  // Embedded snapshots
  unitSnapshot: {
    number: String,
    towerName: String,
    residentName: String
  },
  creatorSnapshot: {
    userId: ObjectId,
    name: String,
    phone: String
  },
  // Complaint details
  category: String,
  subcategory: String,
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  subject: String,
  description: String,
  // Media attachments
  photos: [String],
  videos: [String],
  // Status and workflow
  status: { type: String, enum: ['open','in_progress','hold','resolved','closed'], default: 'open' },
  statusHistory: [{
    status: String,
    changedBy: ObjectId,
    changedAt: Date,
    notes: String
  }],
  // Assignment
  assignedTo: ObjectId,
  assignedAt: Date,
  estimatedResolution: Date,
  actualResolution: Date,
  // Resolution details
  resolution: {
    description: String,
    photos: [String],
    resolvedBy: ObjectId,
    resolvedAt: Date
  },
  // Feedback
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    providedAt: Date
  },
  // SLA tracking
  sla: {
    priority: String,
    targetHours: Number,
    actualHours: Number,
    breached: Boolean
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

Collection: bookings
{
  _id: ObjectId,
  societyId: ObjectId,
  facilityId: ObjectId,
  // Embedded snapshots
  facilitySnapshot: {
    name: String,
    type: String,
    capacity: Number
  },
  unitSnapshot: {
    unitId: ObjectId,
    number: String,
    towerName: String,
    residentName: String
  },
  bookerSnapshot: {
    userId: ObjectId,
    name: String,
    phone: String
  },
  // Booking details
  date: Date,
  startTime: String, // HH:MM format
  endTime: String,
  duration: Number, // minutes
  purpose: String,
  guests: { type: Number, default: 1 },
  specialRequests: String,
  // Status and workflow
  status: { type: String, enum: ['pending','confirmed','cancelled','completed','no_show'], default: 'pending' },
  statusHistory: [{
    status: String,
    changedBy: ObjectId,
    changedAt: Date,
    notes: String
  }],
  // Payment
  payment: {
    amount: Number,
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending','paid','refunded'] },
    method: { type: String, enum: ['upi','card','netbanking','cheque','cash'] },
    paidAt: Date,
    transactionId: String
  },
  // Cancellation
  cancellation: {
    reason: String,
    fee: Number,
    cancelledAt: Date,
    cancelledBy: ObjectId
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

Collection: invoices
{
  _id: ObjectId,
  societyId: ObjectId,
  unitId: ObjectId,
  // Embedded snapshots
  unitSnapshot: {
    number: String,
    towerName: String,
    residentName: String
  },
  // Invoice details
  invoiceNumber: String,
  billingPeriod: {
    start: Date,
    end: Date
  },
  dueDate: Date,
  amount: Number,
  currency: { type: String, default: 'INR' },
  // Line items breakdown
  lineItems: [{
    category: String,
    description: String,
    amount: Number,
    quantity: Number,
    unitPrice: Number
  }],
  // Status and workflow
  status: { type: String, enum: ['draft','sent','paid','overdue','cancelled'], default: 'draft' },
  statusHistory: [{
    status: String,
    changedBy: ObjectId,
    changedAt: Date,
    notes: String
  }],
  // Payment details
  payments: [{
    amount: Number,
    method: { type: String, enum: ['upi','card','netbanking','cheque','cash'] },
    status: { type: String, enum: ['pending','succeeded','failed','refunded'] },
    transactionId: String,
    paidAt: Date,
    reference: String
  }],
  // Financial summary
  summary: {
    subtotal: Number,
    tax: Number,
    discount: Number,
    total: Number,
    paid: Number,
    outstanding: Number
  },
  // Late fees
  lateFees: [{
    amount: Number,
    appliedAt: Date,
    reason: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

Collection: payments
{
  _id: ObjectId,
  societyId: ObjectId,
  invoiceId: ObjectId,
  unitId: ObjectId,
  // Embedded snapshots
  invoiceSnapshot: {
    invoiceNumber: String,
    amount: Number,
    dueDate: Date
  },
  unitSnapshot: {
    number: String,
    towerName: String,
    residentName: String
  },
  payerSnapshot: {
    userId: ObjectId,
    name: String,
    phone: String
  },
  // Payment details
  amount: Number,
  currency: { type: String, default: 'INR' },
  method: { type: String, enum: ['upi','card','netbanking','cheque','cash'], required: true },
  status: { type: String, enum: ['created','processing','succeeded','failed','refunded'], default: 'created' },
  // Gateway details
  gateway: {
    name: String, // 'razorpay', 'stripe', etc.
    transactionId: String,
    referenceId: String,
    metadata: Object
  },
  // Processing details
  processing: {
    initiatedAt: Date,
    completedAt: Date,
    failureReason: String,
    retryCount: { type: Number, default: 0 }
  },
  // Refund details
  refund: {
    amount: Number,
    reason: String,
    processedAt: Date,
    referenceId: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

Collection: facilities
{
  _id: ObjectId,
  societyId: ObjectId,
  societyName: String,
  // Facility details
  name: String,
  type: String,
  category: String,
  description: String,
  capacity: Number,
  // Location
  location: {
    area: String,
    floor: Number,
    building: String
  },
  // Operating hours
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  // Pricing
  pricing: {
    perHour: Number,
    perBooking: Number,
    deposit: Number,
    currency: { type: String, default: 'INR' }
  },
  // Rules and policies
  rules: [String],
  policies: {
    advanceBookingDays: Number,
    cancellationHours: Number,
    cancellationFee: Number,
    maxGuests: Number
  },
  // Media
  photos: [String],
  amenities: [String],
  // Maintenance schedule
  maintenance: [{
    startDate: Date,
    endDate: Date,
    reason: String,
    status: String
  }],
  // Availability exceptions
  blockedDates: [Date],
  // Status
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['available','maintenance','closed'], default: 'available' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

Collection: announcements
{
  _id: ObjectId,
  societyId: ObjectId,
  societyName: String,
  // Announcement details
  title: String,
  content: String,
  summary: String,
  category: { type: String, enum: ['general','maintenance','security','event','notice','emergency'] },
  priority: { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
  // Targeting
  targetAudience: {
    allResidents: { type: Boolean, default: true },
    specificRoles: [String],
    specificUnits: [ObjectId],
    specificTowers: [String]
  },
  // Publishing
  publishedBy: ObjectId,
  publishedByName: String,
  publishedAt: Date,
  expiresAt: Date,
  isPublished: { type: Boolean, default: false },
  // Engagement tracking
  engagement: {
    views: { type: Number, default: 0 },
    reads: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    responses: { type: Number, default: 0 }
  },
  // Media attachments
  attachments: [{
    type: String,
    url: String,
    name: String,
    size: Number
  }],
  // Status
  status: { type: String, enum: ['draft','published','expired','archived'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

Collection: audit_logs
{
  _id: ObjectId,
  societyId: ObjectId,
  userId: ObjectId,
  userName: String,
  // Event details
  action: String,
  resource: String,
  resourceId: ObjectId,
  resourceType: String,
  // Change tracking
  changes: {
    before: Object,
    after: Object,
    fields: [String]
  },
  // Context
  ipAddress: String,
  userAgent: String,
  deviceInfo: Object,
  location: {
    city: String,
    country: String,
    coordinates: Object
  },
  // Session info
  sessionId: String,
  // Result
  success: { type: Boolean, default: true },
  error: String,
  duration: Number, // milliseconds
  // Metadata
  timestamp: { type: Date, default: Date.now },
  level: { type: String, enum: ['info','warning','error','critical'], default: 'info' },
  category: { type: String, enum: ['auth','data','security','system','user'] }
}
```
}
```
}
```
====================
MONGODB MODEL SET
====================

Collection: societies
{
  _id: ObjectId,
  name: String,
  address: Object,
  locale: String,
  createdAt: Date
}

Collection: users
{
  _id: ObjectId,
  phone: String,
  name: String,
  roles: [String],
  kycStatus: String,
  createdAt: Date
}

Collection: visitors
{
  _id: ObjectId,
  name: String,
  phone: String,
  type: String,
  vehiclePlate: String
}

Collection: passes (semi-denormalized)
{
  _id: ObjectId,
  societyId: ObjectId,
  visitorId: ObjectId,
  visitorSnapshot: { name, phone, type },
  unitSnapshot: { towerName, unitNumber },
  validFrom: Date,
  validTo: Date,
  status: "active"
}

Collection: checkins
{
  _id: ObjectId,
  passId: ObjectId,
  visitorSnapshot: {...},
  guardSnapshot: { guardId, name },
  gateSnapshot: { gateId, name },
  inAt: Date,
  outAt: Date
}
```

## Detailed API Endpoints

```javascript
====================
FULL API ENDPOINTS
====================

AUTH
POST /auth/otp/request
POST /auth/otp/verify

VISITOR PASSES
POST /passes
GET /passes/:id
GET /passes/qr/:token

CHECKINS
POST /checkins
PATCH /checkins/:id/out

COMPLAINTS
POST /complaints
GET /complaints
PATCH /complaints/:id/status

FACILITIES
GET /facilities
GET /facilities/:id/slots
POST /bookings

PAYMENTS
GET /dues
POST /payments/intent
POST /payments/webhook

ADMIN
POST /announcements
POST /polls
POST /polls/:id/vote
```

## UI/UX Screen Descriptions

```javascript
====================
UI/UX SCREEN DESCRIPTIONS
====================

Resident App:
1. Home Dashboard
2. Create Visitor Pass
3. Pass Details (QR + metadata)
4. Complaints List
5. Complaint Detail & Chat
6. Facility Booking
7. Payment Screen
8. Domestic Staff Profiles

Guard App:
1. Login (OTP)
2. QR Scanner
3. Manual Entry Screen
4. Verify Visitor Details
5. Check-in Confirmation
6. Check-out List

Admin Portal:
1. Dashboard (Visitors, Complaints, Collections)
2. Tower & Unit Management
3. Resident Master List
4. Billing & Accounting
5. Facility Setup
6. Complaint Manager
7. Visitor Reports
```

## Implementation Notes

### Database Design Considerations

**PostgreSQL Schema:**
- Uses UUIDs for all primary keys for scalability
- JSONB columns for flexible address and metadata storage
- Proper foreign key relationships with cascade deletes
- ENUM types for data integrity and performance
- Timestamps with timezone support

**MongoDB Schema:**
- Semi-denormalized design for read performance
- Embedded snapshots to reduce lookups
- ObjectIds for cross-collection references
- Flexible schema for future extensions

### API Design Patterns

**Authentication Flow:**
- OTP-based login for security
- Stateless JWT tokens
- Role-based access control

**Visitor Management:**
- QR code generation and validation
- Time-bound access control
- Audit trail for all check-ins/check-outs

**Real-time Features:**
- WebSocket support for live updates
- Push notifications for important events
- Background sync for offline capabilities

### Security Considerations

**Data Protection:**
- PII minimization in logs and caches
- Encrypted sensitive data at rest
- Secure API communication with TLS 1.3
- Input validation and sanitization

**Access Control:**
- Multi-level role hierarchy
- Society-level data isolation
- Time-based access restrictions
- Audit logging for compliance

### Performance Optimizations

**Database:**
- Strategic indexing on frequently queried columns
- Connection pooling and prepared statements
- Query result caching
- Database read replicas for analytics

**Application:**
- API response compression
- Image optimization and CDN delivery
- Background job processing
- Horizontal scaling support

### Mobile App Architecture

**Resident App:**
- React Native with Expo
- Offline-first design
- Biometric authentication
- Push notifications

**Guard App:**
- Optimized for low-end devices
- Offline queue for check-ins
- QR scanning with <200ms response
- Emergency SOS functionality

**Admin Portal:**
- Next.js web application
- Real-time dashboards
- Bulk operations support
- Advanced reporting tools
