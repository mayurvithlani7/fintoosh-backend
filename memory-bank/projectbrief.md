# Smarter Money Jar Automation Project

## Overview
This project implements automatic percentage-based point distribution for chore completion in a family financial education app. Parents can set default splits across five money jars (Pocket Money, Savings Pot, Spending Pot, Help Others Pot, Grow Money Pot) with per-chore overrides.

## Core Requirements
- **Parent Settings**: Configure default percentage splits (total must equal 100%)
- **Chore Management**: Option to use default split or custom split per chore
- **Transaction Processing**: Replace single transaction with multiple split transactions on approval
- **Money Jars**: 5 jars - current (Pocket), save (Savings), spend (Spending), donate (Help Others), invest (Grow Money)

## Technical Stack
- React Native (Expo)
- Node.js/Express backend
- MongoDB with Mongoose
- TypeScript
- AsyncStorage for local state

## Key Components
- Parent Settings UI (settings.tsx)
- Chore Creation/Editing UI (chores.tsx)
- Backend approval logic (data.js routes)
- User/Chore/Transaction models
- Currency context for settings management
