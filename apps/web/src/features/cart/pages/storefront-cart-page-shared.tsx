import { type CartView } from '@nova/api-client';

export interface StorefrontCartPageProps {
  cart?: CartView;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onUpdateItem?: (variantId: string, quantity: number) => void;
  onRemoveItem?: (variantId: string) => void;
  customerId?: string;
  enableGuestMerge?: boolean;
  isWishlisted?: (slug: string) => boolean;
  onToggleWishlist?: (slug: string) => void;
}

export type CartLineAvailability = 'available' | 'unavailable';
