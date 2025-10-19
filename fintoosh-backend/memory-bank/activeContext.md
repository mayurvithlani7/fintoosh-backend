# Active Context

## Current Status: SECURITY REFACTORING IN AUTHENTICATION COMPLETED ✅

**Server-side brute-force protection and rate limiting fully implemented for enhanced authentication security.**

## Completed Features

### ✅ Centralized Server Logging (Backend: Node.js/Express)
- **Winston Logger Setup**: JSON format logging with timestamp and service metadata
- **Console Transport**: Colored output for all environments with custom format
- **Sentry Integration**: Production error/warn level reporting with DSN configuration
- **Request Logging Middleware**: Logs method, URL, IP, and User-Agent for every incoming request
- **Final Error Handler**: Catches unhandled errors, logs full stack traces, sends generic 500 responses
- **Environment-Aware Configuration**: Development vs production logging levels and Sentry activation

### ✅ Client Crash Reporting (Frontend: React Native/Expo)
- **Sentry-Expo Installation**: Crash reporting library installed and configured
- **Early SDK Initialization**: Sentry initialized in _layout.tsx with DSN from environment variables
- **Development Support**: enableInExpoDevelopment flag for testing crash reporting
- **API Error Capturing**: Try-catch blocks added to critical API functions (chores, requests, transactions, users)
- **Contextual Error Data**: Feature tags and extra metadata included with each error report
- **Authentication Error Tracking**: Comprehensive error logging for all login/signup flows
- **Comprehensive Coverage**: Error handling implemented for fetchChores, patchChore, submitRequest, createTransaction, patchUserPoints, fetchUser
- **TypeScript Compatibility**: API-level error tracking implemented with proper error boundaries
- **Login Error Tracking**: All authentication functions include detailed error logging with user context

### ✅ Smarter Money Jar Automation
- **Default Split Storage**: Family-level setting in User model with 100% validation
- **Per-Chore Override**: Chore model with useDefaultSplit boolean + customSplit object
- **Transaction Creation**: Multiple split transactions on chore approval
- **UI Integration**: Point Automation section in parent settings + chore creation forms

### ✅ Inter-Jar Requests and Approvals
- **Context-Rich Requests**: ApprovalRequest model includes fromBalance/toBalance fields
- **Enhanced Kid UI**: money-jars.tsx sends current balances with move requests
- **Enhanced Parent UI**: requests.tsx shows Before & After Summary in approval modal
- **Visual Impact Preview**: Color-coded balance changes (red decrease, green increase)

### ✅ Teaching Milestones Gamification
- **Parent Milestone Tracking**: teaching.tsx with auto-reward system for completed milestones
- **Child Achievement Display**: learn.tsx "My Achievements" section showing unlocked badges
- **Automatic Rewards**: Points and badges awarded to children when parents complete teaching milestones
- **Feedback Loop**: Parent teaching efforts directly rewarded with child point/badget unlocks

### ✅ In-App Communication (Requests)
- **Message API**: New POST /requests/:requestId/messages endpoint
- **Persistent Chat**: TextInput and Send button in both parent and child request views
- **Status Preservation**: Messages sent without changing request approval status
- **Real-time Updates**: Message threads display with sender identification and timestamps

### ✅ Security Refactoring in Authentication
- **Server-Side Rate Limiting**: 100 requests per IP per 15 minutes for general routes, 10 requests per IP per hour for sensitive routes
- **Account-Specific Brute Force Protection**: User model fields (loginAttempts, lockoutUntil) with 5-attempt limit and 5-minute lockout
- **Enhanced Login Controllers**: Both parent and child login routes enforce brute force protection with proper error messaging
- **Client-Side Integration**: Login UI handles lockout states and displays remaining attempts/lockout time
- **Security Middleware**: Express rate limiting applied to all API routes with sensitive route restrictions

### ✅ Secure Token Storage (Client Refactoring)
- **Expo Secure Store Integration**: Installed and configured expo-secure-store for encrypted device storage
- **Secure Storage Utility**: Created utils/secureStorage.ts with saveAuthToken, getAuthToken, deleteAuthToken functions
- **Automatic Migration**: One-time cleanup of existing tokens from AsyncStorage during first save
- **Authentication Refactoring**: Updated login.tsx and settings.tsx to use secure token storage
- **Device-Level Encryption**: Authentication tokens now protected with platform-specific secure storage (Keychain on iOS, EncryptedSharedPreferences on Android)

### ✅ Analytics Page Theme Compatibility
- **Chart Color Refactoring**: Replaced all hardcoded colors in analytics charts with theme-aware color palettes
- **Light/Dark Mode Support**: Charts now use different color schemes for light and dark themes
- **Jar Distribution Colors**: Theme-compatible colors for Pocket Money, Savings Pot, Spending Pot, Help Others, Grow Money Pot
- **Category Colors**: Theme-aware colors for spending categories (Food, Entertainment, Transportation, etc.)
- **Pie Chart Updates**: Both analytics.tsx and AnalyticsChart.tsx components updated with dynamic color schemes
- **High Contrast**: Ensured sufficient contrast between colors in both light and dark modes

## Key Design Decisions Implemented
- **Data Flow**: Kid requests → include balances → Parent sees before/after → Informed approval
- **UI Patterns**: Consistent jar naming, clear visual hierarchy, responsive design
- **Validation**: Server-side percentage validation, client-side real-time feedback
- **Backward Compatibility**: Existing requests/chore work unchanged
- **Message Architecture**: Messages append to existing request objects without status changes
- **Goal Claim Status Persistence**: Goals with pending approval requests remain "pending" across app sessions
- **Goal Deletion Feature**: Added delete buttons to both parent and child goal pages with proper status restrictions (only active goals can be deleted)
- **Goal Approval Error Handling**: Fixed insufficient points error to display proper message to parent and reset goal status to "active" for child retry

## Validation Requirements Met
- ✅ Split percentages total 100%
- ✅ Non-negative percentages only
- ✅ Default split required for family
- ✅ Custom split optional per chore
- ✅ Request balances included and displayed
- ✅ Message threads functional and persistent
- ✅ Achievement rewards automatic and tracked

## Edge Cases Handled
- ✅ Legacy chores fallback to 100% Pocket Money
- ✅ Invalid split data server validation
- ✅ Zero balance requests
- ✅ Same jar transfers prevented
- ✅ Split calculation precision (Math.round)
- ✅ Empty message handling
- ✅ Message threading for all request types

## Testing Ready - All Features Complete
- All APIs extended with validation
- UI components have real-time feedback
- Transaction creation handles all jar types
- Error handling for edge cases
- Backward compatibility maintained
- Message functionality fully operational
- Achievement system integrated and working

## Next Steps (Optional Future Enhancements)
- Add split history visualization
- Analytics on jar distribution effectiveness
- Child education modules explaining splits
- Export to Sheets functionality
- Enhanced notification system
- Message read receipts
- Achievement sharing features
