export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  statusCode: number;
  requestId: string;
  timestamp: string;
  details?: unknown;
}

export interface ApiErrorEnvelope {
  error: ApiErrorPayload;
}

export interface HealthStatus {
  status: 'ok';
  service: 'api';
  timestamp: string;
  database?: 'ok';
}

export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  priceToman: number;
  available: boolean;
}
