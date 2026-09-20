import { create } from 'zustand';

import type { CartMergeConflict } from '@nova/api-client';

export interface CartFeedback {
  message: string;
  error?: boolean;
}

interface CartUiState {
  feedback: CartFeedback | undefined;
  mergeConflicts: CartMergeConflict[];
  mergeResolutions: Record<string, number>;
  setFeedback: (feedback: CartFeedback | undefined) => void;
  setMergeConflicts: (conflicts: CartMergeConflict[]) => void;
  setMergeResolution: (variantId: string, quantity: number) => void;
  resetMergeState: () => void;
  reset: () => void;
}

const initialCartUiState = {
  feedback: undefined,
  mergeConflicts: [],
  mergeResolutions: {},
} satisfies Pick<CartUiState, 'feedback' | 'mergeConflicts' | 'mergeResolutions'>;

export const useCartUiStore = create<CartUiState>((set) => ({
  ...initialCartUiState,
  setFeedback: (feedback) => set({ feedback }),
  setMergeConflicts: (mergeConflicts) => set({ mergeConflicts }),
  setMergeResolution: (variantId, quantity) =>
    set((state) => ({
      mergeResolutions: { ...state.mergeResolutions, [variantId]: quantity },
    })),
  resetMergeState: () => set({ mergeConflicts: [], mergeResolutions: {} }),
  reset: () => set(initialCartUiState),
}));
