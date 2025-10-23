# Technical Context

## Technologies
- **Frontend**: React Native 0.81.4, Expo SDK 54.0.13, TypeScript 5.9.2
- **Backend**: Node.js with Express 5.1.0, MongoDB with Mongoose 8.19.1
- **Authentication**: JWT tokens with bcryptjs 3.0.2, OTP via Msg91 SMS service
- **Security**: express-rate-limit 8.1.0, winston 3.18.3 logging, Sentry monitoring
- **Storage**: Expo Secure Store for tokens, AsyncStorage for app data
- **Development**: ESLint 9.25.0, Expo CLI, React Native Debugger

## Key Dependencies
### Frontend Core
- expo-router: 6.0.12 (file-based routing)
- react-native-reanimated: 4.1.1 (animations)
- @react-native-async-storage/async-storage: 2.2.0
- expo-secure-store: 15.0.7 (encrypted token storage)
- @sentry/react-native: 7.4.0 (crash reporting)

### Backend Core
- express: 5.1.0
- mongoose: 8.19.1
- jsonwebtoken: 9.0.2
- bcryptjs: 3.0.2
- winston: 3.18.3
- @sentry/node: 10.20.0
- express-rate-limit: 8.1.0

### UI & Data Visualization
- react-native-chart-kit: 6.12.0
- react-native-svg: 15.12.1
- @react-native-picker/picker: 2.11.1
- react-native-community/datetimepicker: 8.4.4

## API Architecture
### Authentication Endpoints
- POST /api/auth/login - Parent email/password login
- POST /api/auth/child-login - Child username/PIN login
- POST /api/auth/signup - Parent registration with OTP
- POST /api/auth/verify-otp - OTP verification
- POST /api/auth/forgot-password - Password reset flow

### Core Data Endpoints
- GET/POST/PATCH /api/users - User management and settings
- GET/POST/PATCH /api/chores - Chore CRUD operations
- GET/POST/PATCH /api/rewards - Reward management
- GET/POST/PATCH /api/goals - Savings goal tracking
- POST /api/transactions - Financial transaction creation
- GET/PUT /api/requests - Approval request workflow
- POST /api/requests/:id/messages - In-app messaging

### Analytics & Education
- GET /api/analytics/family/:familyId - Comprehensive analytics data
- GET/POST /api/education/modules - Learning module management
- GET/POST /api/education/progress - Child progress tracking

## Data Models
### User Model
- Authentication: email, password, username, PIN, OTP fields
- Profile: name, avatar, role (parent/child/elder), status
- Family: familyId, parentId relationships
- Financial: 5 money jar balances (current, save, spend, donate, invest)
- Settings: currency preferences, defaultSplit for automation
- Gamification: badges, milestones, achievements, experience
- Security: loginAttempts, lockoutUntil for brute force protection

### Chore Model
- Basic: name, description, points, frequency, status
- Assignment: assignedTo (child user ID), createdBy (parent ID)
- Automation: useDefaultSplit, customSplit for point distribution
- Tracking: completed, approved, completedAt timestamps

### Transaction Model
- Financial: amount, type, description, reference
- Jars: fromJar, toJar (source and destination)
- Parties: fromUser, toUser (who initiated transfer)
- Metadata: createdAt, familyId, related request/chore

### Request Model
- Types: chore-completion, reward-claim, point-move, goal-claim
- Status: pending, approved, rejected
- Context: fromBalance, toBalance for transfers
- Communication: messages array for discussion threads

## Configuration Management
### Environment Variables
- **Frontend**: EXPO_PUBLIC_SENTRY_DSN, API_URL configuration
- **Backend**: MONGODB_URI, JWT_SECRET, MSG91_AUTH_KEY, SENTRY_DSN
- **Development**: Separate .env files for dev/prod environments

### Build Configuration
- **Expo Config**: app.json with build settings, permissions, orientations
- **EAS Build**: eas.json for cloud builds and deployments
- **Platform Specific**: iOS and Android specific configurations

## Development Workflow
### Local Development
- `npm start` - Start backend server on port 3000
- `npm run start:mobile` - Start Expo development server
- `npm run android/ios` - Run on specific platforms
- `npm run reset-project` - Reset to clean Expo template

### Code Quality
- ESLint configuration for consistent code style
- TypeScript for type safety across frontend
- Pre-commit hooks for code quality checks
