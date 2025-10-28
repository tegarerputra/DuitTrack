// Toast notification store
import { writable } from 'svelte/store';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<ToastNotification[]>([]);

  return {
    subscribe,

    show: (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 3000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const toast: ToastNotification = { id, message, type, duration };

      update(toasts => [...toasts, toast]);

      // Auto-remove after duration
      setTimeout(() => {
        update(toasts => toasts.filter(t => t.id !== id));
      }, duration + 300); // Add 300ms for animation
    },

    success: (message: string, duration?: number) => {
      toastStore.show(message, 'success', duration);
    },

    error: (message: string, duration?: number) => {
      toastStore.show(message, 'error', duration);
    },

    info: (message: string, duration?: number) => {
      toastStore.show(message, 'info', duration);
    },

    warning: (message: string, duration?: number) => {
      toastStore.show(message, 'warning', duration);
    },

    remove: (id: string) => {
      update(toasts => toasts.filter(t => t.id !== id));
    },

    clear: () => {
      update(() => []);
    }
  };
}

export const toastStore = createToastStore();
