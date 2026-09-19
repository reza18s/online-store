import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  customerAddressDefaultPath,
  customerAddressPath,
  customerAddressesPath,
} from './addresses-api';

test('encodes customer address resource and default paths', () => {
  assert.equal(customerAddressesPath, '/v1/account/addresses');
  assert.equal(customerAddressPath('address/one 1'), '/v1/account/addresses/address%2Fone%201');
  assert.equal(
    customerAddressDefaultPath('address/one 1'),
    '/v1/account/addresses/address%2Fone%201/default',
  );
});
