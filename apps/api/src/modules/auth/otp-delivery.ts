import { ServiceUnavailableException, Injectable } from '@nestjs/common';

export const OTP_DELIVERY = Symbol('OTP_DELIVERY');

export interface OtpDelivery {
  send(phone: string, code: string): Promise<void>;
}

@Injectable()
export class UnconfiguredOtpDelivery implements OtpDelivery {
  public async send(): Promise<void> {
    throw new ServiceUnavailableException('سرویس ارسال پیامک پیکربندی نشده است.');
  }
}
