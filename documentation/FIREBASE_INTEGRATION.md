# 🔥 Firebase Integration Guide

Complete guide untuk Firebase integration di DuitTrack menggunakan Firebase v9 modular SDK dengan TypeScript.

---

## 📋 **Overview**

DuitTrack menggunakan Firebase sebagai backend solution untuk:
- **Authentication**: Google OAuth sign-in
- **Database**: Firestore untuk real-time data storage
- **Hosting**: (Optional) Firebase Hosting untuk deployment

**File Utama**: [`src/lib/config/firebase.ts`](../src/lib/config/firebase.ts)

---

## 🏗️ **Firebase Configuration**

### **Project Setup**
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "duittrack.firebaseapp.com",
  projectId: "duittrack",
  storageBucket: "duittrack.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

**⚠️ Security Note**: API keys are public in client-side code. Security is enforced through Firebase Security Rules, not API key secrecy.

### **Initialization**
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app, auth, db;

if (browser) {  // Only initialize in browser
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}
```

---

## 🔐 **Authentication**

### **Google OAuth Setup**
```typescript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Sign in function
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log('Signed in:', user.email);
  } catch (error) {
    console.error('Sign-in error:', error);
  }
}
```

### **Auth State Observer**
```typescript
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User signed in
    authActions.setAuthState(true, user);

    // Load/create user profile
    const userProfile = await loadUserProfile(user);
    authActions.setUserProfile(userProfile);

    // Handle navigation
    if (!userProfile.onboardingComplete) {
      // Redirect to onboarding
    } else {
      // Redirect to dashboard
    }
  } else {
    // User signed out
    authActions.clearAuth();
    // Redirect to landing page
  }
});
```

### **User Profile Management**
```typescript
interface UserProfile {
  id?: string;
  email: string;
  displayName: string;
  onboardingComplete: boolean;
  currency: string;        // "IDR"
  locale: string;          // "id-ID"
  budgetResetDate?: number; // Day of month (1-31)
  createdAt?: Date;
  updatedAt?: Date;
}

// Create new user profile
async function createUserProfile(user: User): Promise<UserProfile> {
  const userProfileRef = doc(db, 'users', user.uid);

  const newProfile: UserProfile = {
    email: user.email || '',
    displayName: user.displayName || 'User',
    onboardingComplete: false,
    currency: 'IDR',
    locale: 'id-ID',
    budgetResetDate: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await setDoc(userProfileRef, newProfile);
  return { id: user.uid, ...newProfile };
}
```

---

## 🗄️ **Firestore Database Structure**

### **Collections Hierarchy**
```
users/
├── {userId}/                    # User document
│   ├── profile                  # User profile data
│   ├── budgets/                 # Budget subcollection
│   │   ├── {month}/            # e.g., "2025-12"
│   │   │   ├── categories      # Budget per category
│   │   │   ├── totalBudget     # Total budget amount
│   │   │   └── totalSpent      # Total spent amount
│   │   └── template/           # Default budget template
│   └── expenses/               # Expense subcollection
│       └── {expenseId}/        # Individual expense
│           ├── amount          # Expense amount (number)
│           ├── category        # Category name (string)
│           ├── description     # Expense description
│           ├── date            # Expense date (timestamp)
│           └── createdAt       # Creation timestamp
```

### **Data Interfaces**
```typescript
// Budget structure
interface Budget {
  id?: string;
  month: string;  // "YYYY-MM" format
  categories: Record<string, {
    budget: number;
    spent: number;
  }>;
  totalBudget: number;
  totalSpent: number;
  userId: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Expense structure
interface Expense {
  id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date | Timestamp;
  userId: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}
```

---

## 📝 **CRUD Operations**

### **Collection References**
```typescript
// Helper functions for collection references
const FirebaseUtils = {
  getUserExpensesRef: (userId?: string) => {
    const uid = userId || auth?.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');
    return collection(db, 'users', uid, 'expenses');
  },

  getUserBudgetsRef: (userId?: string) => {
    const uid = userId || auth?.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');
    return collection(db, 'users', uid, 'budgets');
  },

  getUserProfileRef: (userId?: string) => {
    const uid = userId || auth?.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');
    return doc(db, 'users', uid);
  }
};
```

### **Create Expense**
```typescript
async function createExpense(expenseData: Omit<Expense, 'id' | 'userId'>) {
  try {
    const user = auth?.currentUser;
    if (!user) throw new Error('User not authenticated');

    const expense = {
      ...expenseData,
      userId: user.uid,
      createdAt: new Date()
    };

    const docRef = await addDoc(
      FirebaseUtils.getUserExpensesRef(),
      expense
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
}
```

### **Update Expense**
```typescript
async function updateExpense(
  expenseId: string,
  updates: Partial<Expense>
) {
  try {
    const expenseRef = doc(
      FirebaseUtils.getUserExpensesRef(),
      expenseId
    );

    await updateDoc(expenseRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
}
```

### **Delete Expense**
```typescript
async function deleteExpense(expenseId: string) {
  try {
    const expenseRef = doc(
      FirebaseUtils.getUserExpensesRef(),
      expenseId
    );

    await deleteDoc(expenseRef);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
}
```

### **Query Expenses**
```typescript
import { query, where, orderBy, limit, getDocs } from 'firebase/firestore';

async function getExpensesByMonth(month: string) {
  try {
    const expensesRef = FirebaseUtils.getUserExpensesRef();

    const q = query(
      expensesRef,
      where('month', '==', month),
      orderBy('date', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    const expenses = [];

    snapshot.forEach((doc) => {
      expenses.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return expenses;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
}
```

---

## 🔄 **Real-time Data Synchronization**

### **Listen to Budget Changes**
```typescript
import { onSnapshot, doc } from 'firebase/firestore';

function subscribeToBudget(month: string, callback: (budget: Budget) => void) {
  const budgetRef = doc(FirebaseUtils.getUserBudgetsRef(), month);

  const unsubscribe = onSnapshot(budgetRef, (docSnap) => {
    if (docSnap.exists()) {
      const budget = {
        id: docSnap.id,
        ...docSnap.data()
      } as Budget;

      callback(budget);
    }
  });

  return unsubscribe; // Call this to stop listening
}
```

### **Listen to Expenses**
```typescript
function subscribeToExpenses(callback: (expenses: Expense[]) => void) {
  const expensesRef = FirebaseUtils.getUserExpensesRef();
  const q = query(expensesRef, orderBy('date', 'desc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const expenses = [];
    snapshot.forEach((doc) => {
      expenses.push({
        id: doc.id,
        ...doc.data()
      });
    });

    callback(expenses);
  });

  return unsubscribe;
}
```

---

## 🔒 **Transaction Management**

### **Atomic Budget Updates**
```typescript
import { runTransaction } from 'firebase/firestore';

async function updateBudgetSpent(
  month: string,
  category: string,
  amount: number,
  operation: 'add' | 'subtract' = 'add'
) {
  const budgetRef = doc(FirebaseUtils.getUserBudgetsRef(), month);

  await runTransaction(db, async (transaction) => {
    const budgetDoc = await transaction.get(budgetRef);

    if (!budgetDoc.exists()) {
      // Create new budget document
      transaction.set(budgetRef, {
        month,
        categories: {
          [category]: {
            budget: 0,
            spent: operation === 'add' ? amount : 0
          }
        },
        totalBudget: 0,
        totalSpent: operation === 'add' ? amount : 0,
        userId: auth.currentUser.uid,
        createdAt: new Date()
      });
    } else {
      // Update existing budget
      const budgetData = budgetDoc.data() as Budget;
      const categoryData = budgetData.categories?.[category] || { budget: 0, spent: 0 };

      const newSpent = operation === 'add'
        ? categoryData.spent + amount
        : Math.max(0, categoryData.spent - amount);

      const updatedCategories = {
        ...budgetData.categories,
        [category]: {
          ...categoryData,
          spent: newSpent
        }
      };

      const totalSpent = Object.values(updatedCategories)
        .reduce((sum, cat) => sum + cat.spent, 0);

      transaction.update(budgetRef, {
        categories: updatedCategories,
        totalSpent,
        updatedAt: serverTimestamp()
      });
    }
  });
}
```

---

## 🛠️ **Utility Functions**

### **Currency Formatting**
```typescript
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Usage: formatCurrency(25000) → "Rp 25.000"
```

### **Date Formatting**
```typescript
function formatDate(date: Date | Timestamp | string): string {
  let dateObj: Date;

  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    // Firestore Timestamp
    dateObj = date.toDate();
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
}
```

### **Month Utilities**
```typescript
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getMonthDisplayName(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

// Usage:
// getCurrentMonth() → "2025-12"
// getMonthDisplayName("2025-12") → "Desember 2025"
```

---

## 🔐 **Security Rules**

### **Recommended Firestore Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data
    match /users/{userId} {
      // Allow users to read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Budgets subcollection
      match /budgets/{budgetId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Expenses subcollection
      match /expenses/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## ⚡ **Performance Best Practices**

### **1. Minimize Reads**
```typescript
// ❌ Bad: Multiple reads
const budget = await getDoc(budgetRef);
const expenses = await getDocs(expensesRef);

// ✅ Good: Batch operations when possible
const [budgetSnap, expensesSnap] = await Promise.all([
  getDoc(budgetRef),
  getDocs(expensesRef)
]);
```

### **2. Use Indexes**
Create composite indexes for complex queries in Firebase Console:
- `expenses`: `userId` + `date` (descending)
- `expenses`: `userId` + `category` + `date`

### **3. Limit Query Results**
```typescript
// Always use limit() for large collections
const q = query(
  expensesRef,
  orderBy('date', 'desc'),
  limit(50)  // Don't fetch everything at once
);
```

### **4. Offline Persistence**
```typescript
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Enable offline persistence
try {
  await enableNetwork(db);
} catch (err) {
  console.warn('Offline persistence setup failed:', err);
}
```

---

## 🐛 **Common Issues & Solutions**

### **Issue: "Missing or insufficient permissions"**
**Solution**: Check Firestore security rules. Ensure user is authenticated and rules allow access.

### **Issue: "Timestamp conversion errors"**
**Solution**: Always handle both Date and Timestamp types:
```typescript
const dateObj = data.createdAt instanceof Date
  ? data.createdAt
  : data.createdAt.toDate();
```

### **Issue: "Collection reference undefined"**
**Solution**: Ensure Firebase is initialized before accessing collections:
```typescript
if (!auth?.currentUser) {
  throw new Error('User not authenticated');
}
```

---

## 📚 **Additional Resources**

- [Firebase v9 Documentation](https://firebase.google.com/docs/web/modular-upgrade)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Authentication](https://firebase.google.com/docs/auth/web/start)

---

**Last Updated**: December 30, 2025
**Firebase SDK Version**: 9.x (modular)
**Status**: ✅ Production Implementation

---

*DuitTrack Firebase Integration - Bank-Grade Security & Real-Time Sync 🔥*