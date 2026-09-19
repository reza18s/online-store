import { IsIn, IsObject, IsOptional, IsString, Matches } from 'class-validator';

export const ANALYTICS_EVENT_NAMES = [
  'product_view',
  'search',
  'add_to_cart',
  'checkout_started',
  'purchase',
  'payment_failure',
  'provider_failure',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

const CLIENT_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export class TrackAnalyticsEventDto {
  @IsIn(ANALYTICS_EVENT_NAMES)
  public name!: AnalyticsEventName;

  @IsOptional()
  @IsString()
  @Matches(CLIENT_IDENTIFIER_PATTERN)
  public anonymousId?: string;

  @IsOptional()
  @IsString()
  @Matches(CLIENT_IDENTIFIER_PATTERN)
  public sessionId?: string;

  @IsOptional()
  @IsObject()
  public properties?: Record<string, unknown>;
}
