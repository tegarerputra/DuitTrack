// Authentication service for DuitTrack
import { browser } from '$app/environment';
import { authActions, sessionActions, type UserProfile } from '$stores/auth';
import type { User } from 'firebase/auth';

/**
 * Authentication service that provides centralized auth operations
 * for the DuitTrack fintech application
 */
export class AuthService {
  private static instance: AuthService;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!browser) {
      return { success: false, error: 'Not in browser environment' };
    }

    try {
      authActions.setLoading(true);
      authActions.setError(null);

      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('$lib/config/firebase');

      const result = await signInWithPopup(auth, googleProvider);

      // Session will be managed by Firebase auth state observer
      return { success: true, user: result.user };

    } catch (error: any) {
      console.error('Google Sign In failed:', error);

      let errorMessage = 'Failed to sign in with Google';

      // Handle specific Firebase Auth errors
      switch (error.code) {
        case 'auth/popup-blocked':
          errorMessage = 'Popup diblokir. Silakan izinkan popup untuk login.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Login dibatalkan. Silakan coba lagi.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Koneksi internet bermasalah. Silakan coba lagi.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Akun telah dinonaktifkan. Hubungi support.';
          break;
        default:
          if (error.message) {
            errorMessage = error.message;
          }
      }

      authActions.setError(errorMessage);
      authActions.setLoading(false);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    if (!browser) {
      return { success: false, error: 'Not in browser environment' };
    }

    try {
      authActions.setLoading(true);
      authActions.setError(null);

      const { signOut } = await import('firebase/auth');
      const { auth } = await import('$lib/config/firebase');

      await signOut(auth);

      // Clear all auth data
      authActions.clearAuth();

      return { success: true };

    } catch (error: any) {
      console.error('Sign out failed:', error);

      const errorMessage = 'Gagal keluar. Silakan coba lagi.';
      authActions.setError(errorMessage);
      authActions.setLoading(false);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!browser) return null;

    try {
      const { auth } = await import('$lib/config/firebase');
      return auth.currentUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!browser) return null;

    try {
      const { getDoc } = await import('firebase/firestore');
      const { FirebaseUtils } = await import('$lib/config/firebase');

      const userRef = FirebaseUtils.getUserProfileRef(userId);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Upload profile photo to Firebase Storage
   */
  async uploadProfilePhoto(file: File): Promise<{ success: boolean; photoURL?: string; error?: string }> {
    if (!browser) {
      return { success: false, error: 'Not in browser environment' };
    }

    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Import Firebase Storage
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('$lib/config/firebase');

      // Create a storage reference
      const photoRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${file.name}`);

      // Upload the file
      const snapshot = await uploadBytes(photoRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return { success: true, photoURL: downloadURL };

    } catch (error: any) {
      console.error('Error uploading profile photo:', error);
      return { success: false, error: error.message || 'Failed to upload photo' };
    }
  }

  /**
   * Update user profile in Firestore
   */
  async updateUserProfile(profileData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    if (!browser) {
      return { success: false, error: 'Not in browser environment' };
    }

    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { setDoc, serverTimestamp } = await import('firebase/firestore');
      const { FirebaseUtils } = await import('$lib/config/firebase');

      const userRef = FirebaseUtils.getUserProfileRef(user.uid);

      // Use setDoc with merge to create or update
      await setDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update local store
      authActions.setUserProfile({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        onboardingComplete: false,
        currency: 'IDR',
        locale: 'id-ID',
        budgetResetDate: 25, // Default to 25 (most common in Indonesia)
        budgetResetType: 'fixed',
        hasBudgetSetup: false,
        ...profileData
      });

      return { success: true };

    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message || 'Failed to update profile' };
    }
  }

  /**
   * Complete onboarding for user
   */
  async completeOnboarding(profileData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    return this.updateUserProfile({
      ...profileData,
      onboardingComplete: true
    });
  }

  /**
   * Check if current session is valid
   */
  isSessionValid(): boolean {
    return sessionActions.isSessionValid();
  }

  /**
   * Update user activity for session management
   */
  updateActivity(): void {
    authActions.updateActivity();
  }

  /**
   * Initialize authentication state from storage
   */
  async initializeAuth(): Promise<void> {
    if (!browser) return;

    try {
      // Restore session from localStorage
      sessionActions.restoreSession();

      // Firebase auth state will be handled by onAuthStateChanged
      console.log('Auth service initialized');
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  /**
   * Delete user account (for GDPR compliance)
   */
  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    if (!browser) {
      return { success: false, error: 'Not in browser environment' };
    }

    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Delete user data from Firestore
      const { doc, deleteDoc, collection, getDocs } = await import('firebase/firestore');
      const { deleteUser } = await import('firebase/auth');
      const { db } = await import('$lib/config/firebase');

      // Delete user collections
      const userRef = doc(db, 'users', user.uid);
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      const budgetsRef = collection(db, 'users', user.uid, 'budgets');

      // Delete expenses
      const expenses = await getDocs(expensesRef);
      for (const expenseDoc of expenses.docs) {
        await deleteDoc(expenseDoc.ref);
      }

      // Delete budgets
      const budgets = await getDocs(budgetsRef);
      for (const budgetDoc of budgets.docs) {
        await deleteDoc(budgetDoc.ref);
      }

      // Delete user profile
      await deleteDoc(userRef);

      // Delete Firebase Auth user
      await deleteUser(user);

      // Clear all local data
      authActions.clearAuth();

      return { success: true };

    } catch (error: any) {
      console.error('Error deleting account:', error);
      return { success: false, error: error.message || 'Failed to delete account' };
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();