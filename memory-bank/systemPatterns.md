# System Patterns

## Architecture Overview
- **Frontend**: React Native with Expo Router, TypeScript, Context API state management
- **Backend**: Node.js/Express with MongoDB (Mongoose), JWT authentication, Winston logging
- **Security**: bcrypt password hashing, Expo Secure Store, rate limiting, brute force protection
- **Communication**: RESTful APIs, Msg91 SMS service for OTP, Sentry error monitoring
- **Data Flow**: Family-centric with parent-child relationships and approval workflows

## Core System Components

### Authentication System
- **Parent Registration**: Email/password with OTP verification via SMS
- **Child Creation**: Parent adds children with username/PIN authentication
- **Session Management**: JWT tokens stored securely with automatic refresh
- **Security Features**: Rate limiting, brute force protection, secure token storage

### Family Management
- **Family Grouping**: All users linked by familyId for shared data access
- **Role-Based Access**: Parent (full access), Child (limited access), Elder (view-only)
- **Hierarchical Permissions**: Parents control children's activities and approvals

### Financial System
- **Money Jars**: 5 distinct jars (Pocket, Savings, Spending, Donate, Invest) with points/INR currency
- **Point Distribution**: Automated splitting based on parent-defined rules or per-chore overrides
- **Transaction Tracking**: All financial activities logged with detailed metadata
- **Goal Management**: Savings goals with progress tracking and milestone rewards

### Gamification Engine
- **Achievement System**: Badges and milestones for completed educational activities
- **Progress Tracking**: Experience points, levels, and unlockable content
- **Reward Mechanisms**: Automatic point awards for parent teaching activities

### Educational Framework
- **Learning Modules**: Interactive content on financial literacy topics
- **Progress Assessment**: Child progress tracking through module completion
- **Adaptive Learning**: Content tailored to child's current understanding level

### Communication System
- **Request Workflow**: Children submit requests, parents review and approve/reject
- **In-App Messaging**: Discussion threads within request conversations
- **Notification System**: Real-time updates on request status and approvals

## Data Flow Patterns

### Chore Completion Flow
1. Parent creates chore with point value and distribution rules
2. Child completes chore and submits for approval
3. Parent reviews and approves (manual or auto-approval)
4. System creates split transactions across money jars
5. Points distributed according to rules, child receives rewards

### Inter-Jar Transfer Flow
1. Child requests point transfer between jars with justification
2. System captures current balances for context
3. Parent sees before/after preview in approval modal
4. Upon approval, transactions created and balances updated
5. Educational discussion can occur via in-app messaging

### Goal Achievement Flow
1. Child or parent creates savings goal with target amount
2. Progress tracked through jar contributions and chore rewards
3. System monitors completion and triggers celebrations
4. Achievement badges awarded, new goals unlocked
5. Analytics updated with goal success metrics

## Security Patterns
- **Data Isolation**: Family-level data separation with proper authorization
- **Input Validation**: Server-side validation with XSS protection
- **Error Handling**: Centralized logging with user-safe error messages
- **Rate Limiting**: API protection against abuse with configurable limits
