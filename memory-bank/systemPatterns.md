# System Patterns

## Architecture Overview
- **Frontend**: React Native with Expo, TypeScript
- **Backend**: Node.js/Express with MongoDB
- **State Management**: AsyncStorage + Context API
- **API Pattern**: RESTful endpoints with JWT auth

## Data Flow for Chore Approval
1. Child marks chore as completed → creates ApprovalRequest
2. Parent approves in requests.tsx → calls PUT /api/requests/:id
3. Backend processes approval → creates Transaction(s) + updates User points
4. **NEW**: Split logic determines multiple transactions vs single

## Money Jar Mapping
- current → Pocket Money (immediate spending)
- save → Savings Pot (long-term saving)
- spend → Spending Pot (discretionary purchases)
- donate → Help Others Pot (charity/giving)
- invest → Grow Money Pot (investment learning)

## Transaction Types
- chore-completion: Single transaction (legacy)
- **NEW**: Multiple transactions with toJar set for each split

## Settings Storage
- User model stores family-wide settings
- Currency context manages local state sync
- PATCH /users/:id/settings updates all family members
