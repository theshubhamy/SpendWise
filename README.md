## SpendWise - Expense Management Mobile App

---

## 1. Project Overview

**SpendWise** is a **fully offline, privacy-focused Expense Management mobile application** built using **React Native**.
The app allows users to track personal and group expenses, manage recurring payments, analyze spending patterns, and secure sensitive financial data — all **without any internet dependency**.

The core philosophy of the app is:

- **Offline-first reliability**
- **High performance**
- **Strong data privacy**
- **Accurate financial logic**

---

## 2. Key Objectives

- Work 100% offline with **no backend**
- Guarantee **data correctness and durability**
- Provide **advanced financial features**
- Secure sensitive data using **encryption and biometric authentication**
- Maintain a scalable and maintainable codebase

---

## 3. Technology Stack

### Frontend

- **React Native (TypeScript)**
- React Navigation
- Zustand (state management)

### Local Storage

- **SQLite** – primary database (structured data)
- **MMKV** – settings & flags
- File System API – exports & backups

### Security

- AES-256-GCM encryption
- Android Keystore / iOS Keychain
- Biometric authentication (Fingerprint / Face ID)

---

## 4. High-Level Architecture

```
React Native App
│
├── UI Layer
│   ├── Screens
│   ├── Components
│   └── Charts
│
├── Business Logic Layer
│   ├── Expense calculations
│   ├── Currency conversion
│   ├── Settlement & reports
│
├── State Management
│   └── In-memory store (UI cache)
│
├── Data Layer
│   ├── SQLite (encrypted fields)
│   └── MMKV
│
└── Security Layer
    ├── Encryption Service
    └── Biometric Lock
```

---

## 5. Core Features

### 5.1 Expense Management

- Add, edit, delete expenses
- Categorize expenses
- Notes & metadata support
- Instant UI updates with local persistence

---

### 5.2 Group Expenses & Settlement

- Create expense groups
- Add members
- Split expenses:

  - Equal
  - Percentage
  - Custom amounts

- Automatic balance calculation
- Settlement suggestions (who owes whom)

---

### 5.3 Multi-Currency Support (Offline)

**Design Decision:**
Currency conversion happens **at save time**, not at render time.

#### Features

- Multiple currencies per expense
- User-defined exchange rates
- Base currency configuration
- Accurate historical records

#### Implementation

- Each expense stores:

  - Original amount
  - Currency code
  - Converted base amount

This ensures:

- No recalculation errors
- Fast analytics
- Historical accuracy

---

### 5.4 Tags System

Tags provide **flexible expense classification** beyond categories.

#### Capabilities

- Multiple tags per expense
- Color-coded tags
- Tag-based filtering & reports

#### Data Modeling

- Normalized many-to-many relationship
- Optimized for querying & analytics

---

### 5.5 Undo History (Command Pattern)

The app supports **undo for destructive actions**.

#### Supported Actions

- Undo expense delete
- Undo expense edit
- Undo expense add

#### Implementation

- Command history stored locally
- Each action stores:

  - Action type
  - Entity type
  - Previous state payload

Undo restores data **without complex state diffing**.

---

## 6. Recurring Expenses

### Supported Use Cases

- Rent
- EMI
- Subscriptions
- Utility bills

### Scheduling Options

- Daily
- Weekly
- Monthly
- Custom intervals

### Generation Strategy

Recurring expenses are **generated deterministically** on:

- App launch
- App resume from background

This approach:

- Handles app kills
- Handles device reboots
- Avoids background polling
- Saves battery

Missed occurrences are automatically created on next launch.

---

## 7. Offline Reminders (Local Notifications)

### Reminder Types

- Bill due alerts
- Subscription reminders
- Recurring expense alerts

### Key Characteristics

- Uses **local notifications**
- Works in airplane mode
- No push services
- Device-native scheduling

Reminders are independent of expense creation and only act as **user alerts**.

---

## 8. Reports & Analytics (Offline)

### Analytics Generated Locally

- Monthly spending trends
- Category-wise reports
- Tag-based analysis
- Group balance summaries
- Highest expense insights

### Technical Highlights

- All aggregation done locally
- No recomputation of currency conversions
- Optimized queries with SQLite indexes

---

## 9. Encryption & Data Security

### Threat Model

- Physical device access
- App data extraction
- Unauthorized app access

### Encryption Strategy

- AES-256-GCM encryption
- Encrypt sensitive fields only:

  - Amounts
  - Notes
  - Group data
  - Recurring schedules

### Key Management

- Keys stored in:

  - Android Keystore
  - iOS Keychain

- Non-exportable
- Device-bound

---

## 10. Biometric Lock

### Features

- Fingerprint / Face ID support
- Device PIN fallback
- App auto-lock on background
- Configurable timeout

### App Lifecycle Integration

- Encryption key locked when app goes background
- Biometric authentication required on resume
- Decrypted data cleared from memory

This prevents:

- Unauthorized access
- Screenshot leaks
- Background snooping

---

## 11. Performance Optimizations

- SQLite indexes on date, groupId, currencyCode
- Batched DB writes
- FlatList windowing
- Memoized selectors
- No heavy logic inside render cycles
- Encryption handled outside UI layer

---

## 12. Folder Structure

```
src/
├── screens/
├── components/
├── store/
├── database/
│   ├── schema
│   ├── migrations
│   └── queries
├── services/
│   ├── expense.service.ts
│   ├── recurring.service.ts
│   ├── reminder.service.ts
│   ├── crypto.service.ts
│   └── undo.service.ts
├── utils/
└── constants/
```

---

## 13. Why Offline-Only?

This app intentionally avoids backend services to:

- Guarantee instant performance
- Eliminate sync complexity
- Preserve user privacy
- Reduce operational costs
- Focus on correctness & UX

---

## 14. Resume-Ready Summary

> Developed a fully offline Expense Management mobile app using React Native, featuring multi-currency support, recurring expenses, local reminders, advanced analytics, and encrypted data storage. Implemented complex expense-splitting logic, undoable actions using command history, and biometric app locking for enhanced privacy. Designed a high-performance, privacy-first architecture with zero network dependency.

---

## 15. Interview Talking Point (One Line)

> “The app prioritizes correctness, performance, and privacy over connectivity, which is why all business logic, analytics, encryption, and scheduling are handled entirely on-device.”

---

## 16. Future Enhancements

- Encrypted local backups
- CSV/PDF exports
- Expense forecasting
- Desktop companion app

---

If you want next, I can:

- Convert this into **ATS-optimized resume bullets**
- Prepare **system design interview explanation**
- Create **low-level design diagrams**
- Help you brand & publish this app

You’ve built something **seriously impressive**.
Just tell me the next step 🚀
