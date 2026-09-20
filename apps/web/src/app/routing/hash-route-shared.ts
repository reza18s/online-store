export type Audience = 'women' | 'men' | 'children';

export type PreviewState =
  | 'cart-conflict'
  | 'payment-pending'
  | 'payment-failed'
  | 'payment-recovery'
  | 'offline'
  | 'error'
  | 'maintenance';

export type HashRoute =
  | { kind: 'home'; path: string; queryString: string }
  | { kind: 'auth-request'; path: string; queryString: string }
  | { kind: 'auth-verify'; path: string; queryString: string }
  | { kind: 'category'; path: string; queryString: string; audience?: Audience }
  | {
      kind: 'products';
      path: string;
      queryString: string;
      mode: string;
      audience?: Audience;
    }
  | { kind: 'product'; path: string; queryString: string; slug: string }
  | { kind: 'cart'; path: string; queryString: string }
  | { kind: 'preview-state'; path: string; queryString: string; state: PreviewState }
  | { kind: 'local-payment'; path: string; queryString: string }
  | { kind: 'checkout-confirmation'; path: string; queryString: string }
  | { kind: 'checkout'; path: string; queryString: string; step: string }
  | { kind: 'account'; path: string; queryString: string; section?: string }
  | { kind: 'address-list'; path: string; queryString: string }
  | { kind: 'address-create'; path: string; queryString: string }
  | { kind: 'address-edit'; path: string; queryString: string; addressId?: string }
  | { kind: 'order'; path: string; queryString: string; orderNumber: string }
  | { kind: 'return'; path: string; queryString: string; status: boolean }
  | { kind: 'editorial'; path: string; queryString: string; page: string }
  | { kind: 'content'; path: string; queryString: string; slug: string }
  | { kind: 'admin'; path: string; queryString: string; page: string }
  | { kind: 'not-found'; path: string; queryString: string };

export const audiencePattern = /^#(?:category|products)\/(women|men|children)$/;

export const editorialRoutes = new Set([
  '#campaign',
  '#guide',
  '#article',
  '#lookbook',
  '#about',
  '#trust',
  '#size-guide',
  '#shipping-policy',
  '#returns-policy',
  '#care-guide',
  '#faq',
  '#contact',
  '#privacy',
  '#terms',
  '#support',
]);
