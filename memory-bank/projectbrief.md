# Fintoosh: Family Financial Education App

## Overview
Fintoosh is a comprehensive mobile application designed to teach children financial literacy through gamified family management. Parents create accounts, add children, and manage family financial activities including chores, rewards, money jars, savings goals, and educational modules. Children learn financial concepts through interactive dashboards, progress tracking, and achievement systems.

## Core Requirements
- **Dual User System**: Separate parent and child interfaces with role-based access
- **Family Management**: Parent-child relationships with family grouping and permissions
- **Financial Education**: Money jars (Pocket, Savings, Spending, Donate, Invest), goals, transactions
- **Gamification**: Points system, achievements, badges, and progress tracking
- **Chore & Reward System**: Task management with approval workflows and point distribution
- **Analytics & Insights**: Spending analysis, financial health assessment, and predictive analytics
- **Educational Content**: Interactive learning modules on financial concepts
- **Security & Safety**: Secure authentication, rate limiting, encrypted storage

## Technical Stack
- **Frontend**: React Native with Expo, TypeScript, Expo Router
- **Backend**: Node.js/Express with MongoDB (Mongoose), JWT authentication
- **Infrastructure**: Winston logging, Sentry monitoring, Msg91 SMS service
- **Security**: bcrypt password hashing, secure token storage, rate limiting
- **State Management**: Context API with AsyncStorage/Expo Secure Store
- **UI/UX**: Theme-aware design, haptic feedback, offline indicators

## Key Features
- Parent Dashboard: Family overview, settings, chore/reward management, analytics
- Child Dashboard: Money jars, goals, achievements, learning modules
- Money Jar System: 5 jars with point distribution and inter-jar transfers
- Chore Management: Creation, assignment, approval with automated point splitting
- Goal Tracking: Savings goals with progress visualization and completion rewards
- Analytics Dashboard: Spending trends, financial insights, CSV export
- Educational Modules: Interactive content on financial literacy topics
- Communication: In-app messaging for request discussions
- Security: OTP verification, brute force protection, secure token storage
