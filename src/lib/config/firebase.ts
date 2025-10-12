// Firebase configuration for Svelte + TypeScript
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  type DocumentReference,
  type CollectionReference,
  type Query,
  type Timestamp
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { browser } from '$app/environment';
import { authActions, authStore, userStore, userProfileStore } from '$stores/auth';
import { get } from 'svelte/store';

// Firebase configuration - replace with your actual config
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
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

if (browser) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Configure Google Provider
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('profile');
  googleProvider.addScope('email');

  // Enable offline persistence
  try {
    // Note: enableNetwork/disableNetwork replaced enablePersistence in v9
    enableNetwork(db);
  } catch (err) {
    console.warn('Firebase offline persistence setup failed:', err);
  }

  // Check for redirect result on app start
  (async () => {
    try {
      const { getRedirectResult } = await import('firebase/auth');
      const result = await getRedirectResult(auth);
      if (result) {
        console.log('Redirect sign-in successful:', result.user.email);
      }
    } catch (error) {
      console.error('Redirect result error:', error);
    }
  })();

  // Auth state observer
  onAuthStateChanged(auth, async (user: User | null) => {
    console.log('Auth state changed:', user ? `Signed in as ${user.email}` : 'Signed out');

    // Update auth stores using enhanced actions
    authActions.setAuthState(!!user, user);
    authActions.setLoading(false);

    if (user) {
      console.log('User signed in:', user.email);

      try {
        // Load or create user profile data
        let userProfile = await loadUserProfile(user);

        // If no profile exists, create one for new user
        if (!userProfile) {
          userProfile = await createUserProfile(user);
        }

        if (userProfile) {
          // Convert Firebase types to store types
          const storeProfile: import('$stores/auth').UserProfile = {
            email: userProfile.email,
            displayName: userProfile.displayName,
            onboardingComplete: userProfile.onboardingComplete,
            currency: userProfile.currency,
            locale: userProfile.locale,
            ...(userProfile.id && { id: userProfile.id }),
            ...(userProfile.budgetResetDate && { budgetResetDate: userProfile.budgetResetDate }),
            ...(userProfile.createdAt && {
              createdAt: userProfile.createdAt instanceof Date ? userProfile.createdAt : userProfile.createdAt.toDate()
            }),
            ...(userProfile.updatedAt && {
              updatedAt: userProfile.updatedAt instanceof Date ? userProfile.updatedAt : userProfile.updatedAt.toDate()
            })
          };
          authActions.setUserProfile(storeProfile);

          // Handle navigation using SvelteKit navigation
          const currentPath = window.location.pathname;

          // Use setTimeout to avoid conflicts with current navigation
          setTimeout(() => {
            if (!userProfile.onboardingComplete && currentPath !== '/onboarding') {
              console.log('Redirecting to onboarding - new user');
              // Let SvelteKit handle navigation
              if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('auth-redirect', {
                  detail: { path: '/onboarding', reason: 'onboarding-required' }
                }));
              }
            } else if (userProfile.onboardingComplete && currentPath === '/') {
              console.log('Redirecting to dashboard - returning user');
              // Let SvelteKit handle navigation
              if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('auth-redirect', {
                  detail: { path: '/dashboard', reason: 'authenticated' }
                }));
              }
            }
          }, 100);
        }

      } catch (error) {
        console.error('Error loading user data:', error);
        authActions.setError('Failed to load user data');
      }
    } else {
      console.log('User signed out');
      authActions.clearAuth();

      // Use setTimeout to avoid conflicts with current navigation
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (currentPath !== '/') {
          console.log('Redirecting to home - user signed out');
          // Let SvelteKit handle navigation
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('auth-redirect', {
              detail: { path: '/', reason: 'unauthenticated' }
            }));
          }
        }
      }, 100);
    }
  });
}

// TypeScript interfaces for DuitTrack data
export interface Expense {
  id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date | Timestamp;
  userId: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Budget {
  id?: string;
  month: string; // YYYY-MM format
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

export interface UserProfile {
  id?: string;
  email: string;
  displayName: string;
  onboardingComplete: boolean;
  currency: string;
  locale: string;
  budgetResetDate?: number;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Load user profile data
async function loadUserProfile(user: User): Promise<UserProfile | null> {
  try {
    if (!user || !db) return null;

    const userProfileRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userProfileRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      return {
        id: userDoc.id,
        email: userData.email || user.email || '',
        displayName: userData.displayName || user.displayName || '',
        onboardingComplete: userData.onboardingComplete ?? false,
        currency: userData.currency || 'IDR',
        locale: userData.locale || 'id-ID',
        budgetResetDate: userData.budgetResetDate || 1,
        ...(userData.createdAt && { createdAt: userData.createdAt }),
        ...(userData.updatedAt && { updatedAt: userData.updatedAt })
      };
    }

    return null; // No profile exists
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}

// Create user profile for new users
async function createUserProfile(user: User): Promise<UserProfile | null> {
  try {
    if (!user || !db) return null;

    const userProfileRef = doc(db, 'users', user.uid);

    const newUserProfile: UserProfile = {
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      onboardingComplete: false,
      currency: 'IDR',
      locale: 'id-ID',
      budgetResetDate: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Use setDoc instead of addDoc to set the document with the user's UID
    const { setDoc } = await import('firebase/firestore');
    await setDoc(userProfileRef, newUserProfile);

    console.log('Created new user profile for:', user.email);

    return {
      id: user.uid,
      ...newUserProfile
    };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
}

// Check if user needs onboarding
async function checkUserOnboarding(user: User): Promise<boolean> {
  try {
    if (!user || !db) return true;

    const userProfileRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userProfileRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      return userData.onboardingComplete !== true;
    }

    return true; // New user needs onboarding
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return true; // Default to showing onboarding on error
  }
}

// Firebase utilities for DuitTrack
export const FirebaseUtils = {
  // Auth utilities
  getCurrentUser: () => auth?.currentUser,

  // Collection references
  getUserExpensesRef: (userId?: string): CollectionReference => {
    const uid = userId || auth?.currentUser?.uid;
    if (!uid || !db) throw new Error('User not authenticated');
    return collection(db, 'users', uid, 'expenses');
  },

  getUserBudgetsRef: (userId?: string): CollectionReference => {
    const uid = userId || auth?.currentUser?.uid;
    if (!uid || !db) throw new Error('User not authenticated');
    return collection(db, 'users', uid, 'budgets');
  },

  getUserProfileRef: (userId?: string): DocumentReference => {
    const uid = userId || auth?.currentUser?.uid;
    if (!uid || !db) throw new Error('User not authenticated');
    return doc(db, 'users', uid);
  },

  // Currency formatting for Indonesian Rupiah
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  // Date formatting for Indonesian locale
  formatDate: (date: Date | Timestamp | string): string => {
    if (!date) return '';

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
  },

  // Month utilities
  getCurrentMonth: (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  getMonthDisplayName: (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    if (!year || !month) return monthStr;
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  },

  // CRUD operations
  createExpense: async (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    try {
      const user = auth?.currentUser;
      if (!user || !db) throw new Error('User not authenticated');

      const expense: Omit<Expense, 'id'> = {
        ...expenseData,
        userId: user.uid,
        createdAt: new Date() // Use Date instead of serverTimestamp for type compatibility
      };

      const docRef = await addDoc(FirebaseUtils.getUserExpensesRef(), expense);
      return docRef.id;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  updateExpense: async (expenseId: string, expenseData: Partial<Expense>): Promise<void> => {
    try {
      const user = auth?.currentUser;
      if (!user || !db) throw new Error('User not authenticated');

      const expenseRef = doc(FirebaseUtils.getUserExpensesRef(), expenseId);
      await updateDoc(expenseRef, {
        ...expenseData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  deleteExpense: async (expenseId: string): Promise<void> => {
    try {
      const user = auth?.currentUser;
      if (!user || !db) throw new Error('User not authenticated');

      const expenseRef = doc(FirebaseUtils.getUserExpensesRef(), expenseId);
      await deleteDoc(expenseRef);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // Budget operations with transaction support
  updateBudgetSpent: async (month: string, category: string, amount: number, operation: 'add' | 'subtract' = 'add'): Promise<void> => {
    try {
      const user = auth?.currentUser;
      if (!user || !db) throw new Error('User not authenticated');

      const budgetRef = doc(FirebaseUtils.getUserBudgetsRef(), month);

      await runTransaction(db, async (transaction) => {
        const budgetDoc = await transaction.get(budgetRef);

        if (!budgetDoc.exists()) {
          // Create initial budget document
          const initialBudget: Omit<Budget, 'id'> = {
            month,
            categories: {
              [category.toLowerCase()]: {
                budget: 0,
                spent: operation === 'add' ? amount : 0
              }
            },
            totalBudget: 0,
            totalSpent: operation === 'add' ? amount : 0,
            userId: user.uid,
            createdAt: new Date() // Use Date instead of serverTimestamp for type compatibility
          };
          transaction.set(budgetRef, initialBudget);
        } else {
          const budgetData = budgetDoc.data() as Budget;
          const categoryData = budgetData.categories?.[category.toLowerCase()] || { budget: 0, spent: 0 };

          const newSpent = operation === 'add'
            ? categoryData.spent + amount
            : Math.max(0, categoryData.spent - amount);

          const updatedCategories = {
            ...budgetData.categories,
            [category.toLowerCase()]: {
              ...categoryData,
              spent: newSpent
            }
          };

          // Calculate total spent
          const totalSpent = Object.values(updatedCategories).reduce((sum, cat) => sum + cat.spent, 0);

          transaction.update(budgetRef, {
            categories: updatedCategories,
            totalSpent,
            updatedAt: serverTimestamp()
          });
        }
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }
};

// Export Firebase instances (only available in browser)
export { app, auth, db, storage, googleProvider };

// Backward compatibility for existing vanilla JS code
if (browser && typeof window !== 'undefined') {
  // @ts-ignore - Adding to window for backward compatibility
  window.auth = auth;
  // @ts-ignore
  window.db = db;
  // @ts-ignore
  window.firebase = { auth: () => auth, firestore: () => db };
  // @ts-ignore
  window.FirebaseUtils = FirebaseUtils;
  // @ts-ignore
  window.googleProvider = googleProvider;
}