import type { Environment } from '@nova/config';

import {
  LocalNotificationSender,
  UnconfiguredNotificationSender,
  type NotificationSender,
} from './notification-worker';
import {
  isValidSmsIrNotificationConfig,
  SmsIrNotificationSender,
} from './sms-ir-notification-sender';

type NotificationEnvironment = Pick<
  Environment,
  'NODE_ENV' | 'SMS_IR_API_KEY' | 'SMS_IR_TEMPLATE_ID' | 'SMS_IR_BASE_URL' | 'SMS_IR_SANDBOX'
>;

export function createNotificationSender(config: NotificationEnvironment): NotificationSender {
  if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
    return new LocalNotificationSender();
  }
  const providerConfig = {
    apiKey: config.SMS_IR_API_KEY,
    templateId: config.SMS_IR_TEMPLATE_ID,
    baseUrl: config.SMS_IR_BASE_URL,
    sandbox: config.SMS_IR_SANDBOX,
  };
  return isValidSmsIrNotificationConfig(providerConfig)
    ? new SmsIrNotificationSender(providerConfig)
    : new UnconfiguredNotificationSender();
}
