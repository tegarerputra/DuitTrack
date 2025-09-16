// ========================================
// DuitTrack - Firebase Configuration
// Replace with your actual Firebase config
// ========================================

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyDBT1eHe31e2Gk-ZHTg_lhbwqU2YXW2DlM",
  authDomain: "duittrack.firebaseapp.com",
  projectId: "duittrack",
  storageBucket: "duittrack.firebasestorage.app",
  messagingSenderId: "278657280930",
  appId: "1:278657280930:web:fda1c3f6e3d7076c1020fb",
  measurementId: "G-SSR2FSQD83"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Configure Firestore settings
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence');
    }
  });

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Auth state observer
let currentUser = null;

auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (user) {
    // User is signed in
    console.log('User signed in:', user.email);
    
    // Update authentication state in app.js
    if (window.app) {
      window.app.setAuthenticationState(true, user);
    }
    
    // Check if user needs onboarding
    const needsOnboarding = await checkUserOnboarding(user);
    
    if (needsOnboarding) {
      if (typeof showBudgetOnboarding === 'function') {
        showBudgetOnboarding();
      } else {
        console.warn('showBudgetOnboarding not available yet, retrying...');
        setTimeout(() => showBudgetOnboarding(), 100);
      }
    } else {
      if (typeof showDashboard === 'function') {
        showDashboard();
        if (typeof loadUserData === 'function') loadUserData();
      } else {
        console.warn('showDashboard not available yet, retrying...');
        setTimeout(() => {
          showDashboard();
          if (typeof loadUserData === 'function') loadUserData();
        }, 100);
      }
    }
  } else {
    // User is signed out
    console.log('User signed out');
    
    // Update authentication state in app.js
    if (window.app) {
      window.app.setAuthenticationState(false, null);
    }
    
    if (typeof showLanding === 'function') {
      showLanding();
    } else {
      console.warn('showLanding not available yet, retrying...');
      setTimeout(() => showLanding(), 100);
    }
  }
});

// Check if user needs onboarding
async function checkUserOnboarding(user) {
  try {
    if (!user) return true;
    
    console.log('🔍 Checking onboarding status for:', user.email);
    
    // Direct onboarding check using simple approach
    console.log('🔍 Using direct onboarding check');
    const userProfileRef = db.collection('users').doc(user.uid);
    const userDoc = await userProfileRef.get();
    
    console.log('📄 User document exists:', userDoc.exists);
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('👤 User data:', userData);
      return userData.onboardingComplete !== true;
    }
    
    console.log('🆕 New user detected - needs onboarding');
    return true; // New user needs onboarding
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return true; // Default to showing onboarding on error
  }
}

// Utility functions for Firebase operations
const FirebaseUtils = {
  
  // Get current user
  getCurrentUser: () => currentUser,
  
  // Get user's expenses collection reference
  getUserExpensesRef: (userId = currentUser?.uid) => {
    if (!userId) throw new Error('User not authenticated');
    return db.collection('users').doc(userId).collection('expenses');
  },
  
  // Get user's budgets collection reference  
  getUserBudgetsRef: (userId = currentUser?.uid) => {
    if (!userId) throw new Error('User not authenticated');
    return db.collection('users').doc(userId).collection('budgets');
  },
  
  // Get user profile document reference
  getUserProfileRef: (userId = currentUser?.uid) => {
    if (!userId) throw new Error('User not authenticated');
    return db.collection('users').doc(userId);
  },
  
  // Format currency for display
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },
  
  // Format date for display
  formatDate: (date) => {
    if (!date) return '';
    if (date.toDate) {
      // Firestore Timestamp
      date = date.toDate();
    }
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).format(new Date(date));
  },
  
  // Get current month string (YYYY-MM format)
  getCurrentMonth: () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },
  
  // Get month display name
  getMonthDisplayName: (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  },
  
  // Create expense document
  createExpense: async (expenseData) => {
    try {
      const userId = currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');
      
      const expense = {
        ...expenseData,
        userId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
      };
      
      const docRef = await FirebaseUtils.getUserExpensesRef().add(expense);
      return docRef.id;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },
  
  // Update budget after expense creation/modification
  updateBudgetSpent: async (month, category, amount, operation = 'add') => {
    try {
      const userId = currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');
      
      const budgetRef = FirebaseUtils.getUserBudgetsRef().doc(month);
      
      await db.runTransaction(async (transaction) => {
        const budgetDoc = await transaction.get(budgetRef);
        
        if (!budgetDoc.exists) {
          // Create initial budget document
          const initialBudget = {
            month,
            categories: {
              [category.toLowerCase()]: {
                budget: 0,
                spent: operation === 'add' ? amount : 0
              }
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          transaction.set(budgetRef, initialBudget);
        } else {
          const budgetData = budgetDoc.data();
          const categoryData = budgetData.categories?.[category.toLowerCase()] || { budget: 0, spent: 0 };
          
          const newSpent = operation === 'add' 
            ? categoryData.spent + amount 
            : Math.max(0, categoryData.spent - amount);
          
          transaction.update(budgetRef, {
            [`categories.${category.toLowerCase()}.spent`]: newSpent,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      });
      
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  },

  // Update an existing expense
  updateExpense: async (expenseId, expenseData) => {
    try {
      const userId = currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const expenseRef = FirebaseUtils.getUserExpensesRef().doc(expenseId);
      await expenseRef.update({
        ...expenseData,
        userId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Expense updated successfully:', expenseId);
      return expenseId;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  // Delete an expense
  deleteExpense: async (expenseId) => {
    try {
      const userId = currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const expenseRef = FirebaseUtils.getUserExpensesRef().doc(expenseId);
      await expenseRef.delete();

      console.log('✅ Expense deleted successfully:', expenseId);
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
};

// Export for use in other modules
window.FirebaseUtils = FirebaseUtils;
window.auth = auth;
window.db = db;
window.googleProvider = googleProvider;

console.log('Firebase initialized successfully');

// ========================================
// SETUP INSTRUCTIONS FOR DEVELOPER
// ========================================

/*
To complete Firebase setup:

1. Go to https://console.firebase.google.com/
2. Create a new project called "DuitTrack" (or any name you prefer)
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google sign-in provider
   - Add your domain to authorized domains
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Start with these security rules:
   
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }

5. Get your config:
   - Go to Project Settings > General
   - Scroll down to "Your apps" 
   - Click "Web app" and copy the config object
   - Replace the firebaseConfig object above with your actual values

6. Update authorized domains:
   - Add your custom domain when ready for production
   - For development, localhost should work automatically

7. Optional - Enable Analytics:
   - Go to Analytics and follow setup if you want user analytics
*/