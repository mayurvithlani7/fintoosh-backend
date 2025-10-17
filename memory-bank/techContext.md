# Technical Context

## Technologies
- **Frontend**: React Native 0.72+, Expo SDK
- **Backend**: Node.js 18+, Express 4.x
- **Database**: MongoDB with Mongoose 7.x
- **Auth**: JWT tokens with bcrypt
- **Storage**: AsyncStorage for mobile persistence

## Key Dependencies
- @react-native-async-storage/async-storage
- @react-native-picker/picker
- react-native-community/datetimepicker
- express-rate-limit
- mongoose

## API Endpoints Used
- GET/PATCH /api/users/:id/settings - Currency & automation settings
- POST/PATCH /api/chores - Chore CRUD with split fields
- PUT /api/requests/:id - Approval processing with split logic
- POST /api/transactions - Multiple transaction creation

## Data Models
- **User**: currentPoints, savePoints, spendPoints, donatePoints, investPoints, currency settings, **NEW: defaultSplit**
- **Chore**: name, points, frequency, **NEW: useDefaultSplit, customSplit**
- **Transaction**: type, amount, fromJar, toJar, reference

## Split Storage Format
```javascript
// User model - default split (family level)
defaultSplit: {
  current: 40,  // Pocket Money
  save: 30,     // Savings Pot  
  spend: 15,    // Spending Pot
  donate: 10,   // Help Others Pot
  invest: 5     // Grow Money Pot
}

// Chore model - per-chore override
useDefaultSplit: true,  // or false for custom
customSplit: {
  current: 0,
  save: 100,   // 100% to savings for "savings chore"
  spend: 0,
  donate: 0,
  invest: 0
}
