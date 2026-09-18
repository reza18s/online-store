import { parseEnvironment } from '../packages/config/src/env';

import { generateTotpCode } from '../apps/api/src/modules/staff-auth/staff-auth.crypto';

const environment = parseEnvironment();
if (!environment.LOCAL_TEST_MODE) {
  throw new Error('Set LOCAL_TEST_MODE=true in the local environment first.');
}

const secret = process.env.LOCAL_STAFF_TOTP_SECRET?.trim() || 'JBSWY3DPEHPK3PXP';
const code = generateTotpCode(secret, Math.floor(Date.now() / 1_000));
console.log(code);
