import test from 'node:test';
import assert from 'node:assert';
import { Keypair } from 'stellar-sdk';

// Setup mock global localStorage for tests
const mockLocalStorage = {};
globalThis.localStorage = {
  getItem: (key) => mockLocalStorage[key] || null,
  setItem: (key, val) => { mockLocalStorage[key] = val.toString(); },
  removeItem: (key) => { delete mockLocalStorage[key]; }
};

const { apiService } = await import('../src/services/apiService.js');


// Formatter helper
const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
};

test('Shorten address formatter validation', () => {
  const addr = 'GD35R7T4A4L4C2Q5W4I6O3N8B2X8T9Y0U1I2O3P4L5K6J7H8G9F0D1S2A3';
  const shortened = shortenAddress(addr, 5);
  assert.strictEqual(shortened, 'GD35R...1S2A3');
});

test('Sandbox Wallet Key Generation & Public Key validation', () => {
  const kp = Keypair.random();
  const pub = kp.publicKey();
  const sec = kp.secret();

  assert.strictEqual(pub.startsWith('G'), true);
  assert.strictEqual(pub.length, 56);
  assert.strictEqual(sec.startsWith('S'), true);
  assert.strictEqual(sec.length, 56);
});

test('On-Chain Simulator & Trust Calculations', async () => {
  const creator = 'GCREATOR888888888888888888888888888888888888888888888888';
  const recipient = 'GRECIPIENT999999999999999999999999999999999999999999999';

  // 1. Fetch initial profile (should lazy init to score 100)
  const profile = await apiService.getUserProfile(creator);
  assert.strictEqual(profile.reputationScore, 100);

  // 2. Create escrow
  const escrow = await apiService.createEscrow(creator, recipient, '150.00', 'tx_test_hash');
  assert.strictEqual(escrow.escrowId, 1);
  assert.strictEqual(escrow.status, 'Funded');

  // 3. Verify escrows list
  const escrows = await apiService.getEscrows(creator);
  assert.strictEqual(escrows.length, 1);
  assert.strictEqual(escrows[0].amount, '150.0000');

  // 4. Release escrow and verify trust score updates (+5 reputation for creator and recipient)
  await apiService.releaseEscrow(escrow.escrowId);
  const updatedCreatorProfile = await apiService.getUserProfile(creator);
  assert.strictEqual(updatedCreatorProfile.reputationScore, 105);
  assert.strictEqual(updatedCreatorProfile.completedContracts, 1);

  // 5. Verify analytics
  const analytics = await apiService.getAnalytics();
  assert.strictEqual(analytics.totalVolume, '150.00');
  assert.strictEqual(analytics.completedEscrows, 1);
});

test('Shorten address formatter edge cases', () => {
  assert.strictEqual(shortenAddress(''), '');
  assert.strictEqual(shortenAddress(null), '');
  assert.strictEqual(shortenAddress('ABC'), 'ABC...ABC');
});

test('Escrow dispute raising lifecycle', async () => {
  const creator = 'GCREATOR888888888888888888888888888888888888888888888888';
  const recipient = 'GRECIPIENT999999999999999999999999999999999999999999999';
  
  const escrow = await apiService.createEscrow(creator, recipient, '200.00', 'tx_dispute_hash');
  assert.strictEqual(escrow.status, 'Funded');
  
  const disputed = await apiService.openDispute(escrow.escrowId, 'Product not received');
  assert.strictEqual(disputed.status, 'Disputed');
  assert.strictEqual(disputed.disputeReason, 'Product not received');
});

test('Dispute resolution - Recipient wins', async () => {
  const creator = 'GCREATOR888888888888888888888888888888888888888888888888';
  const recipient = 'GRECIPIENT999999999999999999999999999999999999999999999';
  
  const escrow = await apiService.createEscrow(creator, recipient, '50.00', 'tx_dispute_rec_win');
  await apiService.openDispute(escrow.escrowId, 'Recipient claims completed, creator disputes');
  
  const resolved = await apiService.resolveDispute(escrow.escrowId, recipient);
  assert.strictEqual(resolved.status, 'Released');
});

test('Dispute resolution - Creator wins', async () => {
  const creator = 'GCREATOR888888888888888888888888888888888888888888888888';
  const recipient = 'GRECIPIENT999999999999999999999999999999999999999999999';
  
  const escrow = await apiService.createEscrow(creator, recipient, '75.00', 'tx_dispute_cre_win');
  await apiService.openDispute(escrow.escrowId, 'Invalid delivery details');
  
  const resolved = await apiService.resolveDispute(escrow.escrowId, creator);
  assert.strictEqual(resolved.status, 'Refunded');
});

test('Escrow refund lifecycle', async () => {
  const creator = 'GCREATOR888888888888888888888888888888888888888888888888';
  const recipient = 'GRECIPIENT999999999999999999999999999999999999999999999';
  
  const escrow = await apiService.createEscrow(creator, recipient, '100.00', 'tx_refund_hash');
  const refunded = await apiService.refundEscrow(escrow.escrowId);
  assert.strictEqual(refunded.status, 'Refunded');
});

test('Escrow cancellation flow', async () => {
  const creator = 'GCREATOR888888888888888888888888888888888888888888888888';
  const recipient = 'GRECIPIENT999999999999999999999999999999999999999999999';
  
  const escrow = await apiService.createEscrow(creator, recipient, '300.00', 'tx_cancel_hash');
  const cancelled = await apiService.cancelEscrow(escrow.escrowId);
  assert.strictEqual(cancelled.status, 'Cancelled');
});

test('Notification system validations', async () => {
  const user = 'GUSER777777777777777777777777777777777777777777777777777';
  
  const initialNotifs = await apiService.getNotifications(user);
  assert.strictEqual(initialNotifs.length, 0);
  
  // Creating escrow sends notifications to creator & recipient
  await apiService.createEscrow(user, 'GRECIPIENT999999999999999999999999999999999999999999999', '20.00');
  
  const notifs = await apiService.getNotifications(user);
  assert.strictEqual(notifs.length > 0, true);
  assert.strictEqual(notifs[0].read, false);
  
  await apiService.markNotificationsRead(user);
  const readNotifs = await apiService.getNotifications(user);
  assert.strictEqual(readNotifs[0].read, true);
});

test('Reputation penalty calculations', async () => {
  const recipient = 'GFAILURERECEIVER222222222222222222222222222222222222222';
  
  const initialProfile = await apiService.getUserProfile(recipient);
  assert.strictEqual(initialProfile.reputationScore, 100);
  
  // Refund an escrow - reduces recipient score by 15
  const escrow = await apiService.createEscrow('GCREATOR888888888888888888888888888888888888888888888888', recipient, '100.00');
  await apiService.refundEscrow(escrow.escrowId);
  
  const updatedProfile = await apiService.getUserProfile(recipient);
  assert.strictEqual(updatedProfile.reputationScore, 85);
  assert.strictEqual(updatedProfile.failedContracts, 1);
});

