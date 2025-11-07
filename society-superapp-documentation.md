# Society SuperApp — Product + Tech Blueprint

*(Target benchmark apps: MyGate, Lodha Belle Vie)*

## 1. Vision & Value

A modern, privacy-first community platform for Indian residential societies, townships, and gated communities. Unifies resident engagement, gate security, facility management, and payments into one app with guard console + web back office.

**Primary user groups:**
- Residents
- Family Members
- Tenants
- Domestic Staff
- Visitors
- Security Guards
- Facility Managers
- Society Admins
- Builders/Developers
- Vendors

**North-star metrics:**
- Monthly active residents (MAR)
- Visitor pass usage %
- Complaint SLA adherence
- Maintenance fee collection rate
- Daily guard app adoption

## 2. Core Modules

### A. Visitor & Gate Management
- Pre-approved visitor passes (QR + OTP, time-bound)
- Walk-in flow
- Delivery partners
- Frequent visitors
- Vehicle entry
- Security guard console
- SOS / Panic

### B. Resident Superapp
- Home feed
- Maintenance bills + payments
- Complaints
- Facility bookings
- Domestic staff
- Parking
- Intercom/VoIP
- CCTV preview

### C. Back Office
- Society setup
- Accounting light
- Asset management
- Reports
- RBAC

### D. Builder/Developer
- Handover workflows
- CRM hooks

## 3. Differentiators

- Privacy-first
- Ultrafast guard app
- Multi-lingual
- Integrations
- Township-scale handling

## 4. User Journeys

- Visitor invite
- Delivery verification
- Complaint lifecycle
- Maintenance payment
- Facility booking

## 5. App Surfaces

- Resident app
- Guard app
- Admin portal
- Vendor portal

## 6. Architecture Overview

- React Native, Next.js, NestJS/Go, PostgreSQL, Redis, S3, RabbitMQ, K8s, JWT, Observability

## 7. High-level Data Model

*(Summarized collection list)*

## 8. API Sketch

- Auth, payments, passes, checkins, complaints, facilities, announcements

## 9. Security & Privacy

- PII minimization, encryption, RBAC, retention policies

## 10. Integrations

- Payments, SMS/WhatsApp, ANPR, CCTV, Maps, Push

## 11. Offline & Performance

- Guard app offline queue, QR scan <200ms

## 12. Analytics

- Visitors, collections, SLA, staff productivity

## 13. Admin Controls

- Import, notices, emergency broadcast, rule engine

## 14. QA & Security Testing Plan

## 15. Roadmap

## 16. Team & Cost

## 17. Monetization

## 18. Risks

## 19. Deliverables

## 20. Next Steps

## 21. Database Schema (Chunk 1)

```sql
-- Core User Management Tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('resident', 'guard', 'admin', 'vendor')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Society/Wing/Flat hierarchy
CREATE TABLE societies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    total_flats INTEGER,
    total_wings INTEGER,
    amenities TEXT[],
    gate_count INTEGER DEFAULT 1,
    subscription_plan VARCHAR(50),
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_expires_at TIMESTAMP,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wings within societies
CREATE TABLE wings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    name VARCHAR(100) NOT NULL, -- e.g., "A", "B", "Tower 1"
    total_flats INTEGER NOT NULL,
    floor_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual flats
CREATE TABLE flats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    wing_id UUID REFERENCES wings(id),
    flat_number VARCHAR(50) NOT NULL, -- e.g., "A-101", "101"
    floor_number INTEGER,
    area_sqm DECIMAL(8,2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    parking_slots INTEGER DEFAULT 0,
    owner_id UUID REFERENCES users(id),
    tenant_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'occupied' CHECK (status IN ('vacant', 'occupied', 'under_maintenance')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(society_id, wing_id, flat_number)
);

-- Resident profiles linked to flats
CREATE TABLE residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    flat_id UUID NOT NULL REFERENCES flats(id),
    relationship VARCHAR(50) NOT NULL CHECK (relationship IN ('owner', 'tenant', 'family_member', 'domestic_staff')),
    is_primary BOOLEAN DEFAULT FALSE,
    move_in_date DATE,
    move_out_date DATE,
    emergency_contact JSONB,
    vehicle_details JSONB[], -- Array of vehicles
    domestic_staff JSONB[], -- Array of staff members
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, flat_id)
);

-- Security guards
CREATE TABLE guards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    society_id UUID NOT NULL REFERENCES societies(id),
    employee_id VARCHAR(50),
    shift_start TIME,
    shift_end TIME,
    shift_days INTEGER[], -- Array of day numbers (0-6)
    gate_assigned INTEGER DEFAULT 1,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_societies_city ON societies(city);
CREATE INDEX idx_flats_society ON flats(society_id);
CREATE INDEX idx_flats_owner ON flats(owner_id);
CREATE INDEX idx_flats_tenant ON flats(tenant_id);
CREATE INDEX idx_residents_user ON residents(user_id);
CREATE INDEX idx_residents_flat ON residents(flat_id);
CREATE INDEX idx_guards_society ON guards(society_id);
CREATE INDEX idx_guards_user ON guards(user_id);
```

## 22. Database Schema (Chunk 2)

```sql
-- Visitor Management Tables
CREATE TABLE visitor_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    flat_id UUID NOT NULL REFERENCES flats(id),
    requested_by UUID NOT NULL REFERENCES users(id),
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20),
    visitor_email VARCHAR(255),
    visitor_type VARCHAR(50) NOT NULL CHECK (visitor_type IN ('guest', 'delivery', 'service', 'maintenance', 'frequent')),
    visit_purpose TEXT,
    expected_arrival TIMESTAMP NOT NULL,
    expected_departure TIMESTAMP,
    vehicle_details JSONB,
    qr_code VARCHAR(255) UNIQUE,
    otp_code VARCHAR(10),
    otp_expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'arrived', 'departed', 'expired')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejected_reason TEXT,
    checkin_time TIMESTAMP,
    checkout_time TIMESTAMP,
    checked_in_by UUID REFERENCES users(id),
    checked_out_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery tracking
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    flat_id UUID NOT NULL REFERENCES flats(id),
    tracking_number VARCHAR(100),
    delivery_partner VARCHAR(100), -- e.g., 'Amazon', 'Flipkart', 'Swiggy'
    item_description TEXT,
    sender_name VARCHAR(255),
    sender_phone VARCHAR(20),
    recipient_name VARCHAR(255),
    recipient_signature TEXT, -- Base64 encoded
    status VARCHAR(20) DEFAULT 'expected' CHECK (status IN ('expected', 'arrived', 'delivered', 'returned', 'damaged')),
    arrived_at TIMESTAMP,
    delivered_at TIMESTAMP,
    delivered_to UUID REFERENCES users(id),
    delivered_by UUID REFERENCES users(id),
    photos JSONB[], -- Array of photo URLs/metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle entries
CREATE TABLE vehicle_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    flat_id UUID REFERENCES flats(id),
    license_plate VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(50) CHECK (vehicle_type IN ('car', 'bike', 'scooter', 'truck', 'auto')),
    vehicle_color VARCHAR(50),
    vehicle_model VARCHAR(100),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20),
    purpose VARCHAR(100),
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP,
    entered_by UUID NOT NULL REFERENCES users(id),
    exited_by UUID REFERENCES users(id),
    qr_code VARCHAR(255),
    status VARCHAR(20) DEFAULT 'entered' CHECK (status IN ('entered', 'exited', 'overstayed')),
    parking_slot VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints and maintenance
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    flat_id UUID REFERENCES flats(id),
    raised_by UUID NOT NULL REFERENCES users(id),
    category VARCHAR(100) NOT NULL, -- e.g., 'Plumbing', 'Electrical', 'Security'
    subcategory VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    photos JSONB[], -- Array of photo URLs
    location VARCHAR(255), -- Specific location within society
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected')),
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    estimated_resolution_time INTERVAL,
    actual_resolution_time INTERVAL,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance bills and payments
CREATE TABLE maintenance_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    flat_id UUID NOT NULL REFERENCES flats(id),
    bill_number VARCHAR(100) UNIQUE NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    breakdown JSONB, -- Detailed breakdown of charges
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_date TIMESTAMP,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    late_fee DECIMAL(8,2) DEFAULT 0,
    discount DECIMAL(8,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Facility bookings
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- e.g., 'Gym', 'Swimming Pool', 'Clubhouse'
    description TEXT,
    capacity INTEGER,
    booking_duration_minutes INTEGER DEFAULT 60,
    advance_booking_days INTEGER DEFAULT 7,
    operating_hours JSONB, -- Hours of operation by day
    maintenance_schedule JSONB, -- Regular maintenance windows
    pricing DECIMAL(8,2) DEFAULT 0, -- Per hour or per booking
    photos JSONB[],
    amenities JSONB[],
    rules TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT_CURRENT_TIMESTAMP
);

CREATE TABLE facility_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id),
    booked_by UUID NOT NULL REFERENCES users(id),
    flat_id UUID NOT NULL REFERENCES flats(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(255),
    guest_count INTEGER DEFAULT 1,
    special_requests TEXT,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
    total_amount DECIMAL(8,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    cancellation_reason TEXT,
    cancellation_fee DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parking management
CREATE TABLE parking_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    slot_number VARCHAR(50) NOT NULL,
    slot_type VARCHAR(50) CHECK (slot_type IN ('covered', 'open', 'visitor', 'disabled')),
    flat_id UUID REFERENCES flats(id), -- NULL for visitor/unassigned slots
    is_occupied BOOLEAN DEFAULT FALSE,
    vehicle_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(society_id, slot_number)
);

-- Domestic staff management
CREATE TABLE domestic_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    flat_id UUID REFERENCES flats(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(100), -- e.g., 'Maid', 'Cook', 'Driver'
    photo_url VARCHAR(500),
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(100),
    background_verified BOOLEAN DEFAULT FALSE,
    contract_start DATE,
    contract_end DATE,
    working_hours JSONB,
    salary DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    emergency_contact JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency and security incidents
CREATE TABLE security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    incident_type VARCHAR(100) NOT NULL, -- e.g., 'Theft', 'Medical Emergency', 'Fire'
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    reported_by UUID NOT NULL REFERENCES users(id),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')),
    resolution TEXT,
    resolved_at TIMESTAMP,
    witnesses JSONB[],
    evidence JSONB[], -- Photos, videos, documents
    police_involved BOOLEAN DEFAULT FALSE,
    police_report_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements and notices
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100), -- e.g., 'Maintenance', 'Event', 'Security'
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'residents', 'guards', 'staff')),
    published_by UUID NOT NULL REFERENCES users(id),
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    read_by UUID[], -- Array of user IDs who have read it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for visitor and gate management
CREATE INDEX idx_visitor_passes_society ON visitor_passes(society_id);
CREATE INDEX idx_visitor_passes_flat ON visitor_passes(flat_id);
CREATE INDEX idx_visitor_passes_status ON visitor_passes(status);
CREATE INDEX idx_visitor_passes_qr ON visitor_passes(qr_code);
CREATE INDEX idx_deliveries_society ON deliveries(society_id);
CREATE INDEX idx_deliveries_flat ON deliveries(flat_id);
CREATE INDEX idx_vehicle_entries_society ON vehicle_entries(society_id);
CREATE INDEX idx_complaints_society ON complaints(society_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_maintenance_bills_flat ON maintenance_bills(flat_id);
CREATE INDEX idx_facility_bookings_facility ON facility_bookings(facility_id);
CREATE INDEX idx_facility_bookings_date ON facility_bookings(booking_date);
CREATE INDEX idx_parking_slots_society ON parking_slots(society_id);
CREATE INDEX idx_domestic_staff_society ON domestic_staff(society_id);
CREATE INDEX idx_security_incidents_society ON security_incidents(society_id);
CREATE INDEX idx_announcements_society ON announcements(society_id);
```

## Developer Instruction Pack

### Development Environment Setup

1. **Prerequisites**
   - Node.js 18.0.0 or higher
   - npm or yarn package manager
   - Git for version control
   - VS Code with recommended extensions
   - PostgreSQL 14+ for local development
   - Redis for caching and queues

2. **Project Setup**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd society-superapp

   # Install dependencies
   npm install

   # Setup environment variables
   cp .env.example .env
   # Edit .env with your configuration

   # Start development server
   npm run dev
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb society_superapp

   # Run migrations
   npm run migrate

   # Seed initial data
   npm run seed
   ```

### Architecture Overview

#### Tech Stack
- **Frontend**: React Native (Mobile Apps), Next.js (Web Portal)
- **Backend**: NestJS (API), Go (High-performance services)
- **Database**: PostgreSQL (Primary), Redis (Cache/Queues)
- **Infrastructure**: Kubernetes, Docker
- **Monitoring**: Prometheus, Grafana, ELK Stack

#### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │     NestJS API  │    │   PostgreSQL    │
│   Mobile Apps   │◄──►│   (REST/GraphQL)│◄──►│   Database      │
│                 │    │                 │    │                 │
│ • Resident App  │    │ • Auth Service  │    │ • User Data     │
│ • Guard App     │    │ • Gate Service  │    │ • Transactions  │
│ • Admin Portal  │    │ • Billing       │    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js Web   │    │   Redis Cache   │    │   AWS S3        │
│   Admin Portal  │◄──►│   & Queues      │◄──►│   File Storage   │
│                 │    │                 │    │                 │
│ • Dashboards    │    │ • Session Store │    │ • Photos        │
│ • Reports       │    │ • Rate Limiting │    │ • Documents     │
│ • Management    │    │ • Job Queue     │    │ • QR Codes      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### API Architecture

#### REST API Endpoints

**Authentication**
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
```

**Visitor Management**
```
POST   /api/societies/:societyId/visitors       # Create visitor pass
GET    /api/societies/:societyId/visitors       # List visitor passes
GET    /api/visitors/:passId                    # Get visitor pass details
PUT    /api/visitors/:passId/approve            # Approve visitor pass
PUT    /api/visitors/:passId/checkin            # Check-in visitor
PUT    /api/visitors/:passId/checkout           # Check-out visitor
```

**Resident Services**
```
GET    /api/residents/:residentId/dashboard     # Resident dashboard
GET    /api/residents/:residentId/bills         # Maintenance bills
POST   /api/residents/:residentId/bills/:billId/pay  # Pay bill
POST   /api/residents/:residentId/complaints    # Raise complaint
GET    /api/residents/:residentId/complaints    # List complaints
POST   /api/facilities/:facilityId/bookings     # Book facility
GET    /api/residents/:residentId/bookings      # List bookings
```

**Guard Operations**
```
GET    /api/guards/:guardId/visitors/pending    # Pending visitors
POST   /api/visitors/:passId/scan               # Scan QR code
GET    /api/guards/:guardId/deliveries          # Today's deliveries
POST   /api/vehicles                            # Log vehicle entry
PUT    /api/vehicles/:entryId/exit              # Log vehicle exit
POST   /api/incidents                           # Report incident
```

**Admin Operations**
```
GET    /api/admin/societies                      # List societies
POST   /api/admin/societies                      # Create society
GET    /api/admin/societies/:societyId/analytics # Society analytics
POST   /api/admin/announcements                  # Create announcement
GET    /api/admin/reports                        # Generate reports
```

### Security Implementation

#### Authentication & Authorization
- **JWT Tokens**: Access tokens (15min), Refresh tokens (7 days)
- **Role-Based Access Control**: Resident, Guard, Admin, Vendor roles
- **API Rate Limiting**: 100 requests/minute per user
- **Session Management**: Secure session handling with Redis

#### Data Protection
- **Encryption**: AES-256 for sensitive data at rest
- **HTTPS**: TLS 1.3 for all communications
- **Input Validation**: Joi schemas for all API inputs
- **SQL Injection Prevention**: Parameterized queries

#### Privacy Compliance
- **GDPR Compliance**: Data minimization and user consent
- **Data Retention**: Configurable retention policies
- **Audit Logging**: Comprehensive activity logging
- **PII Handling**: Minimized PII storage and processing

### Performance Optimizations

#### Database Optimization
- **Indexing Strategy**: Composite indexes for common queries
- **Query Optimization**: Efficient SQL with proper joins
- **Connection Pooling**: PgBouncer for connection management
- **Read Replicas**: Separate read/write databases

#### Caching Strategy
- **Redis Cache**: API response caching, session storage
- **CDN Integration**: Static asset delivery via CloudFront
- **Database Query Cache**: Frequently accessed data caching
- **Application Cache**: In-memory caching for configuration

#### Mobile Performance
- **Offline Support**: Critical features work offline
- **Image Optimization**: Progressive loading, WebP format
- **Bundle Splitting**: Code splitting for faster app loads
- **Lazy Loading**: Components loaded on demand

### Deployment Architecture

#### Infrastructure Setup
- **Kubernetes Cluster**: Container orchestration
- **Microservices**: Separated services for scalability
- **Load Balancing**: NGINX ingress controllers
- **Database Clustering**: PostgreSQL with replication

#### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: kubectl apply -f k8s/
```

### Monitoring & Observability

#### Application Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Dashboard visualization
- **AlertManager**: Alert management
- **ELK Stack**: Log aggregation and analysis

#### Performance Monitoring
- **Response Times**: API endpoint performance tracking
- **Error Rates**: Application error monitoring
- **User Metrics**: Usage patterns and engagement tracking
- **System Resources**: CPU, memory, disk usage monitoring

### Testing Strategy

#### Unit Testing
```javascript
// Component Testing
import { render, fireEvent } from '@testing-library/react-native';

describe('VisitorPassCard', () => {
  it('displays visitor information', () => {
    const visitor = { name: 'John Doe', purpose: 'Delivery' };
    const { getByText } = render(<VisitorPassCard visitor={visitor} />);

    expect(getByText('John Doe')).toBeInTheDocument();
    expect(getByText('Delivery')).toBeInTheDocument();
  });

  it('handles QR code scan', () => {
    const onScan = jest.fn();
    const { getByTestId } = render(<VisitorPassCard onScan={onScan} />);

    fireEvent.press(getByTestId('scan-button'));
    expect(onScan).toHaveBeenCalled();
  });
});
```

#### Integration Testing
```javascript
// API Integration Testing
describe('Visitor Management API', () => {
  it('creates visitor pass', async () => {
    const visitorData = {
      societyId: 'society-123',
      flatId: 'flat-456',
      visitorName: 'John Doe',
      expectedArrival: new Date()
    };

    const response = await request(app)
      .post('/api/visitors')
      .send(visitorData)
      .expect(201);

    expect(response.body).toHaveProperty('passId');
    expect(response.body.status).toBe('pending');
  });
});
```

#### E2E Testing
- **User Journeys**: Complete visitor flow testing
- **Critical Paths**: Payment and security feature testing
- **Cross-platform**: iOS/Android compatibility testing
- **Performance**: Load testing under various conditions

### Development Guidelines

#### Code Organization
```
src/
├── modules/              # Feature modules
│   ├── auth/            # Authentication module
│   ├── visitors/        # Visitor management
│   ├── residents/       # Resident services
│   ├── guards/          # Guard operations
│   └── admin/           # Admin features
├── shared/              # Shared components/utilities
│   ├── components/      # Reusable components
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types
├── infrastructure/      # Infrastructure code
│   ├── database/       # Database connections/migrations
│   ├── cache/          # Redis/cache setup
│   ├── queue/          # Message queue setup
│   └── storage/        # File storage
└── config/             # Configuration files
```

#### Coding Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks

#### Git Workflow
- **Branch Strategy**: Git Flow with feature branches
- **Commit Messages**: Conventional commit format
- **Code Reviews**: Mandatory peer reviews for all changes
- **Testing**: All changes must include tests

This comprehensive blueprint provides the foundation for building a scalable, secure, and user-friendly Society SuperApp that addresses the complex needs of modern residential communities in India.

## MongoDB Prompt — Semi-Denormalized Model

Based on the comprehensive product documentation, here's the optimized MongoDB schema using a semi-denormalized approach that balances read performance with data consistency for the Society SuperApp:

```javascript
// Society Collection - Central society data with embedded hierarchy
{
  _id: ObjectId,
  name: { type: String, required: true },
  registrationNumber: String,
  address: {
    street: String,
    area: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  stats: {
    totalFlats: Number,
    totalWings: Number,
    totalResidents: Number,
    occupiedFlats: Number,
    vacantFlats: Number
  },
  // Embedded wings for fast access
  wings: [{
    _id: ObjectId,
    name: String,
    totalFlats: Number,
    floors: Number,
    flats: [{
      _id: ObjectId,
      number: String,
      floor: Number,
      area: Number,
      bedrooms: Number,
      bathrooms: Number,
      parkingSlots: Number,
      status: { type: String, enum: ['vacant', 'occupied', 'maintenance'] },
      owner: {
        _id: ObjectId,
        name: String,
        phone: String,
        email: String
      },
      tenant: {
        _id: ObjectId,
        name: String,
        phone: String,
        leaseStart: Date,
        leaseEnd: Date
      }
    }]
  }],
  amenities: [{
    name: String,
    type: String,
    capacity: Number,
    bookingRequired: Boolean,
    operatingHours: Object
  }],
  security: {
    gates: Number,
    guards: Number,
    cctvCameras: Number,
    emergencyContacts: [{
      name: String,
      phone: String,
      type: String
    }]
  },
  subscription: {
    plan: String,
    status: { type: String, enum: ['active', 'inactive', 'suspended'] },
    expiresAt: Date,
    features: [String]
  },
  settings: {
    maintenanceCycle: String,
    lateFeePolicy: Object,
    visitorPolicy: Object,
    parkingPolicy: Object
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// User Collection - Extended user profiles with role-specific data
{
  _id: ObjectId,
  email: { type: String, unique: true, required: true, index: true },
  phone: String,
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    dateOfBirth: Date,
    gender: String,
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' }
  },
  auth: {
    password: String,
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    verificationTokens: {
      email: String,
      phone: String
    },
    passwordReset: {
      token: String,
      expires: Date
    },
    lastLogin: Date,
    loginAttempts: Number,
    lockoutUntil: Date
  },
  roles: [{
    societyId: ObjectId,
    role: { type: String, enum: ['resident', 'owner', 'tenant', 'family_member', 'guard', 'admin', 'vendor'] },
    flatId: ObjectId,
    permissions: [String],
    joinedAt: Date,
    isActive: { type: Boolean, default: true }
  }],
  // Denormalized society and flat info for fast access
  societies: [{
    _id: ObjectId,
    name: String,
    role: String,
    flat: {
      _id: ObjectId,
      number: String,
      wing: String
    }
  }],
  preferences: {
    notifications: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    },
    privacy: {
      profileVisible: Boolean,
      contactVisible: Boolean
    },
    accessibility: {
      fontSize: String,
      language: String
    }
  },
  devices: [{
    deviceId: String,
    deviceType: String,
    os: String,
    appVersion: String,
    pushToken: String,
    lastActive: Date
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Visitor Management Collection - Comprehensive visitor tracking
{
  _id: ObjectId,
  societyId: { type: ObjectId, required: true, index: true },
  flatId: { type: ObjectId, required: true, index: true },
  visitor: {
    name: { type: String, required: true },
    phone: String,
    email: String,
    photo: String,
    idProof: {
      type: String,
      number: String,
      url: String
    }
  },
  visit: {
    type: { type: String, enum: ['guest', 'delivery', 'service', 'maintenance', 'frequent'], required: true },
    purpose: String,
    expectedArrival: { type: Date, required: true },
    expectedDeparture: Date,
    actualArrival: Date,
    actualDeparture: Date,
    duration: Number // in minutes
  },
  approval: {
    requestedBy: ObjectId,
    requestedAt: { type: Date, default: Date.now },
    approvedBy: ObjectId,
    approvedAt: Date,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'expired'], default: 'pending' },
    rejectionReason: String
  },
  access: {
    qrCode: { type: String, unique: true },
    otp: {
      code: String,
      expires: Date,
      verified: Boolean
    },
    vehicle: {
      licensePlate: String,
      type: String,
      color: String,
      model: String
    }
  },
  guardActions: [{
    guardId: ObjectId,
    action: { type: String, enum: ['checked_in', 'checked_out', 'rejected'] },
    timestamp: Date,
    notes: String,
    location: String
  }],
  status: { type: String, enum: ['scheduled', 'arrived', 'departed', 'cancelled', 'no_show'], default: 'scheduled' },
  // Denormalized data for queries
  society: {
    name: String,
    address: String
  },
  flat: {
    number: String,
    wing: String,
    resident: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Maintenance & Bills Collection - Financial and maintenance tracking
{
  _id: ObjectId,
  societyId: { type: ObjectId, required: true, index: true },
  type: { type: String, enum: ['maintenance_bill', 'complaint', 'facility_booking'], required: true },
  reference: {
    flatId: ObjectId,
    residentId: ObjectId,
    facilityId: ObjectId
  },

  // For maintenance bills
  bill: {
    number: String,
    period: {
      start: Date,
      end: Date
    },
    dueDate: Date,
    amount: Number,
    breakdown: [{
      category: String,
      amount: Number,
      description: String
    }],
    lateFee: Number,
    discount: Number
  },

  // For complaints
  complaint: {
    category: String,
    subcategory: String,
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    title: String,
    description: String,
    photos: [String],
    location: String
  },

  // Status and workflow
  status: {
    current: { type: String, enum: ['pending', 'approved', 'in_progress', 'completed', 'cancelled', 'overdue'] },
    history: [{
      status: String,
      changedBy: ObjectId,
      changedAt: Date,
      notes: String
    }]
  },

  assignment: {
    assignedTo: ObjectId,
    assignedAt: Date,
    estimatedCompletion: Date,
    actualCompletion: Date
  },

  payment: {
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'] },
    amount: Number,
    method: String,
    reference: String,
    paidAt: Date,
    transactionId: String
  },

  feedback: {
    rating: Number,
    comment: String,
    providedAt: Date
  },

  // Denormalized data
  society: { name: String },
  flat: {
    number: String,
    wing: String,
    resident: String
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Facility Management Collection - Bookings and facility data
{
  _id: ObjectId,
  societyId: { type: ObjectId, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['gym', 'pool', 'clubhouse', 'garden', 'parking', 'other'], required: true },
  capacity: Number,
  description: String,
  amenities: [String],
  photos: [String],

  booking: {
    advanceDays: { type: Number, default: 7 },
    duration: { type: Number, default: 60 }, // minutes
    pricing: {
      perHour: Number,
      perBooking: Number,
      deposit: Number
    },
    rules: [String],
    cancellation: {
      allowed: Boolean,
      hoursBefore: Number,
      fee: Number
    }
  },

  availability: {
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    },
    maintenance: [{
      start: Date,
      end: Date,
      reason: String
    }],
    blockedDates: [Date]
  },

  bookings: [{
    _id: ObjectId,
    bookedBy: ObjectId,
    resident: {
      name: String,
      flat: String,
      phone: String
    },
    date: Date,
    startTime: String,
    endTime: String,
    purpose: String,
    guests: Number,
    specialRequests: String,
    status: { type: String, enum: ['confirmed', 'cancelled', 'completed', 'no_show'], default: 'confirmed' },
    payment: {
      amount: Number,
      status: String,
      paidAt: Date
    },
    createdAt: Date,
    updatedAt: Date
  }],

  stats: {
    totalBookings: Number,
    utilizationRate: Number,
    revenue: Number,
    averageRating: Number
  },

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Security & Incident Collection - Guard operations and incidents
{
  _id: ObjectId,
  societyId: { type: ObjectId, required: true, index: true },
  type: { type: String, enum: ['visitor_checkin', 'vehicle_entry', 'delivery', 'incident', 'patrol', 'emergency'], required: true },

  // Common fields
  guardId: ObjectId,
  guard: {
    name: String,
    badge: String
  },
  location: {
    gate: Number,
    area: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  timestamp: { type: Date, default: Date.now },

  // Visitor checkin data
  visitorCheckin: {
    passId: ObjectId,
    visitorName: String,
    flat: String,
    purpose: String,
    vehicle: Object,
    photos: [String]
  },

  // Vehicle entry data
  vehicleEntry: {
    licensePlate: String,
    type: String,
    color: String,
    driver: String,
    purpose: String,
    entryTime: Date,
    exitTime: Date,
    parkingSlot: String
  },

  // Delivery data
  delivery: {
    trackingNumber: String,
    partner: String,
    item: String,
    recipient: String,
    signature: String,
    photos: [String]
  },

  // Incident data
  incident: {
    type: { type: String, enum: ['theft', 'medical', 'fire', 'accident', 'suspicious_activity', 'other'] },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    title: String,
    description: String,
    witnesses: [{
      name: String,
      contact: String,
      statement: String
    }],
    evidence: [{
      type: String,
      url: String,
      description: String
    }],
    policeReport: {
      filed: Boolean,
      number: String,
      officer: String
    },
    resolution: String,
    resolvedAt: Date
  },

  // Emergency data
  emergency: {
    type: String,
    caller: String,
    description: String,
    response: String,
    responders: [String],
    resolvedAt: Date
  },

  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'completed' },
  notes: String,

  // Denormalized data
  society: { name: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Analytics & Reporting Collection - System metrics and insights
{
  _id: ObjectId,
  societyId: ObjectId,
  date: { type: Date, required: true },
  type: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },

  // Visitor analytics
  visitors: {
    totalPasses: Number,
    approvedPasses: Number,
    rejectedPasses: Number,
    checkinRate: Number,
    averageVisitDuration: Number,
    frequentVisitors: Number,
    peakHours: Object
  },

  // Financial analytics
  finance: {
    maintenanceCollection: {
      totalBilled: Number,
      totalCollected: Number,
      collectionRate: Number,
      overdueAmount: Number,
      averageDelay: Number
    },
    facilityRevenue: Number,
    outstandingPayments: Number
  },

  // Security analytics
  security: {
    incidents: Number,
    incidentTypes: Object,
    responseTime: Number,
    guardActivity: Number,
    vehicleEntries: Number
  },

  // Resident engagement
  engagement: {
    appUsers: Number,
    activeUsers: Number,
    complaintsRaised: Number,
    complaintsResolved: Number,
    resolutionTime: Number,
    facilityBookings: Number,
    averageRating: Number
  },

  // System performance
  performance: {
    apiResponseTime: Number,
    uptime: Number,
    errorRate: Number,
    userReports: Number
  },

  createdAt: { type: Date, default: Date.now }
}

// Notification Collection - System and user notifications
{
  _id: ObjectId,
  recipient: ObjectId,
  societyId: ObjectId,
  type: { type: String, enum: ['announcement', 'reminder', 'alert', 'update', 'emergency'], required: true },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  title: String,
  message: String,
  data: Object,

  channels: [{
    type: { type: String, enum: ['push', 'sms', 'email', 'in_app'] },
    status: { type: String, enum: ['pending', 'sent', 'delivered', 'read', 'failed'] },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    error: String
  }],

  // Targeting
  target: {
    userId: ObjectId,
    role: String,
    flatId: ObjectId,
    allResidents: Boolean
  },

  // Engagement tracking
  engagement: {
    delivered: Boolean,
    read: Boolean,
    interacted: Boolean,
    interactionType: String,
    interactedAt: Date
  },

  expiresAt: Date,
  createdAt: { type: Date, default: Date.now }
}

// Audit Log Collection - Security and compliance logging
{
  _id: ObjectId,
  userId: ObjectId,
  societyId: ObjectId,
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: ObjectId,
  details: Object,
  ipAddress: String,
  userAgent: String,
  location: Object,
  success: { type: Boolean, default: true },
  error: String,
  timestamp: { type: Date, default: Date.now, index: true }
}

// Index Definitions
db.societies.createIndex({ "address.city": 1 });
db.users.createIndex({ "roles.societyId": 1, "roles.role": 1 });
db.visitor_passes.createIndex({ societyId: 1, status: 1, expectedArrival: 1 });
db.maintenance_bills.createIndex({ societyId: 1, "status.current": 1, "bill.dueDate": 1 });
db.facilities.createIndex({ societyId: 1, type: 1 });
db.facility_bookings.createIndex({ facilityId: 1, date: 1 });
db.security_logs.createIndex({ societyId: 1, type: 1, timestamp: -1 });
db.analytics.createIndex({ societyId: 1, date: -1, type: 1 });
db.notifications.createIndex({ recipient: 1, createdAt: -1 });
db.audit_logs.createIndex({ userId: 1, timestamp: -1 });

// Aggregation Pipeline Examples

// Society Overview Dashboard
db.societies.aggregate([
  { $match: { _id: ObjectId("society_id") } },
  {
    $lookup: {
      from: "visitor_passes",
      localField: "_id",
      foreignField: "societyId",
      as: "todayVisitors"
    }
  },
  {
    $lookup: {
      from: "maintenance_bills",
      localField: "_id",
      foreignField: "societyId",
      as: "pendingBills"
    }
  },
  {
    $project: {
      name: 1,
      stats: 1,
      todayStats: {
        visitors: { $size: "$todayVisitors" },
        pendingBills: {
          $size: {
            $filter: {
              input: "$pendingBills",
              cond: { $eq: ["$$this.status.current", "pending"] }
            }
          }
        }
      }
    }
  }
]);

// Monthly Revenue Report
db.maintenance_bills.aggregate([
  {
    $match: {
      societyId: ObjectId("society_id"),
      "payment.status": "paid",
      "payment.paidAt": {
        $gte: new Date("2024-01-01"),
        $lt: new Date("2024-02-01")
      }
    }
  },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: "$payment.amount" },
      totalBills: { $sum: 1 },
      averageBill: { $avg: "$payment.amount" },
      collectionRate: {
        $multiply: [
          { $divide: [{ $sum: 1 }, { $literal: 100 }] }, // Assuming total bills count
          100
        ]
      }
    }
  }
]);

// Security Incident Analysis
db.security_logs.aggregate([
  {
    $match: {
      societyId: ObjectId("society_id"),
      type: "incident",
      "incident.severity": { $ne: "low" }
    }
  },
  {
    $group: {
      _id: "$incident.type",
      count: { $sum: 1 },
      averageResponseTime: { $avg: "$responseTime" },
      resolved: {
        $sum: { $cond: [{ $ne: ["$incident.resolution", null] }, 1, 0] }
      }
    }
  },
  {
    $project: {
      incidentType: "$_id",
      count: 1,
      averageResponseTime: 1,
      resolutionRate: { $multiply: [{ $divide: ["$resolved", "$count"] }, 100] }
    }
  }
]);
```

This semi-denormalized MongoDB schema provides optimal read performance for the most common queries while maintaining data consistency through careful denormalization of frequently accessed related data. The schema supports the complex relationships and rich metadata required for a comprehensive Society SuperApp platform.
