import { shortenAddress } from '../utils/formatters.js';


// Keys for localStorage
const STORAGE_KEYS = {
  ESCROWS: 'stellarpay_escrows_db',
  PROFILES: 'stellarpay_profiles_db',
  EVENTS: 'stellarpay_events_db',
  NOTIFICATIONS: 'stellarpay_notifications_db'
};

// Seed initial leaderboard profiles to keep dashboard looking gorgeous
const INITIAL_PROFILES = [
  {
    walletAddress: 'GD35R7T4A4L4C2Q5W4I6O3N8B2X8T9Y0U1I2O3P4L5K6J7H8G9F0D1S2A3',
    reputationScore: 280,
    totalVolume: '4500.00',
    completedContracts: 15,
    failedContracts: 0,
    successRate: 100,
    rank: 1
  },
  {
    walletAddress: 'GBXBU753G3K2M6YV6N7R8E9T0Y1U2I3O4P5L6K7J8H9G0F1D2S3A4P5O',
    reputationScore: 195,
    totalVolume: '2350.00',
    completedContracts: 8,
    failedContracts: 1,
    successRate: 88,
    rank: 2
  },
  {
    walletAddress: 'GCN7R8E9T0Y1U2I3O4P5L6K7J8H9G0F1D2S3A4P5OBXBU753G3K2M6YV6N',
    reputationScore: 115,
    totalVolume: '980.00',
    completedContracts: 4,
    failedContracts: 0,
    successRate: 100,
    rank: 3
  }
];

// Helper functions to read/write from localStorage
const db = {
  get: (key, defaultVal = []) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Error writing to storage:', e);
    }
  }
};

// Initialize DBs if empty
if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
  db.set(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
}
if (!localStorage.getItem(STORAGE_KEYS.ESCROWS)) {
  db.set(STORAGE_KEYS.ESCROWS, []);
}
if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
  db.set(STORAGE_KEYS.EVENTS, []);
}
if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
  db.set(STORAGE_KEYS.NOTIFICATIONS, []);
}

// Event publisher helper
const publishEvent = (type, value, txHash) => {
  const events = db.get(STORAGE_KEYS.EVENTS);
  const newEvent = {
    _id: Math.random().toString(36).substring(2, 9),
    type,
    ledger: Math.floor(Math.random() * 500) + 120000,
    txHash: txHash || 't_' + Math.random().toString(36).substring(2, 12),
    value,
    createdAt: new Date().toISOString()
  };
  db.set(STORAGE_KEYS.EVENTS, [newEvent, ...events]);
  return newEvent;
};

// Notification sender helper
const sendNotification = (recipient, title, message, type = 'INFO') => {
  const notifs = db.get(STORAGE_KEYS.NOTIFICATIONS);
  const newNotif = {
    _id: Math.random().toString(36).substring(2, 9),
    recipient,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };
  db.set(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...notifs]);
};

// Reputation updates helper
const updateReputation = (address, isCompleted, volume) => {
  const profiles = db.get(STORAGE_KEYS.PROFILES);
  let profIndex = profiles.findIndex(p => p.walletAddress === address);
  
  let prof = profIndex !== -1 ? profiles[profIndex] : {
    walletAddress: address,
    reputationScore: 100,
    totalVolume: '0.00',
    completedContracts: 0,
    failedContracts: 0,
    successRate: 100
  };

  const parsedVolume = parseFloat(volume);

  if (isCompleted) {
    prof.completedContracts += 1;
    prof.reputationScore = Math.min(1000, prof.reputationScore + 5);
    prof.totalVolume = (parseFloat(prof.totalVolume) + parsedVolume).toFixed(2);
  } else {
    prof.failedContracts += 1;
    prof.reputationScore = Math.max(0, prof.reputationScore - 15);
  }

  const total = prof.completedContracts + prof.failedContracts;
  prof.successRate = total > 0 ? Math.round((prof.completedContracts / total) * 100) : 100;

  if (profIndex !== -1) {
    profiles[profIndex] = prof;
  } else {
    profiles.push(prof);
  }

  // Recalculate ranks
  profiles.sort((a, b) => b.reputationScore - a.reputationScore);
  profiles.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  db.set(STORAGE_KEYS.PROFILES, profiles);
};

export const apiService = {
  // Get platform analytics compiled on the fly
  async getAnalytics() {
    const escrows = db.get(STORAGE_KEYS.ESCROWS);
    const profiles = db.get(STORAGE_KEYS.PROFILES);

    // Calculate totals
    const totalVolume = escrows
      .filter(e => e.status === 'Released')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0)
      .toFixed(2);

    const completed = escrows.filter(e => e.status === 'Released').length;
    const active = escrows.filter(e => e.status === 'Funded').length;
    const disputed = escrows.filter(e => e.status === 'Disputed').length;

    // Leaderboard sorted by score
    const rankings = [...profiles].sort((a, b) => b.reputationScore - a.reputationScore);

    return {
      totalVolume,
      escrowCount: escrows.length,
      activeEscrows: active,
      disputedEscrows: disputed,
      completedEscrows: completed,
      successRate: escrows.length > 0 ? Math.round((completed / escrows.length) * 100) : 100,
      rankings
    };
  },

  // Get escrows (optionally filtered by user)
  async getEscrows(userAddress = '') {
    const escrows = db.get(STORAGE_KEYS.ESCROWS);
    if (!userAddress) return escrows;
    return escrows.filter(e => e.creator === userAddress || e.recipient === userAddress);
  },

  // Get specific escrow
  async getEscrow(escrowId) {
    const escrows = db.get(STORAGE_KEYS.ESCROWS);
    const escrow = escrows.find(e => e.escrowId === Number(escrowId));
    if (!escrow) throw new Error('Escrow not found');
    return escrow;
  },

  // Create/Fund Escrow
  async createEscrow(creator, recipient, amount, txHash = '') {
    const escrows = db.get(STORAGE_KEYS.ESCROWS);
    const escrowId = escrows.length + 1;

    const newEscrow = {
      escrowId,
      creator,
      recipient,
      amount: parseFloat(amount).toFixed(4),
      status: 'Funded',
      disputeReason: '',
      txHash,
      createdAt: new Date().toISOString()
    };

    escrows.unshift(newEscrow);
    db.set(STORAGE_KEYS.ESCROWS, escrows);

    // Log Event
    publishEvent('Escrow Created', { escrowId, creator, recipient, amount }, txHash);

    // Send notifications
    sendNotification(
      creator, 
      'Escrow Funded', 
      `Locked ${amount} XLM in Escrow #${escrowId} for recipient ${shortenAddress(recipient, 5)}.`,
      'INFO'
    );
    sendNotification(
      recipient, 
      'Escrow Received', 
      `Creator ${shortenAddress(creator, 5)} locked ${amount} XLM for you in Escrow #${escrowId}.`,
      'SUCCESS'
    );

    return newEscrow;
  },

  // Release Escrow
  async releaseEscrow(escrowId) {
    const escrows = db.get(STORAGE_KEYS.ESCROWS);
    const idx = escrows.findIndex(e => e.escrowId === Number(escrowId));
    if (idx === -1) throw new Error('Escrow not found');

    const escrow = escrows[idx];
    if (escrow.status !== 'Funded' && escrow.status !== 'Disputed') {
      throw new Error('Escrow cannot be released');
    }

    escrow.status = 'Released';
    db.set(STORAGE_KEYS.ESCROWS, escrows);

    // Update reputation scores
    updateReputation(escrow.creator, true, escrow.amount);
    updateReputation(escrow.recipient, true, escrow.amount);

    // Log Event
    publishEvent('Escrow Released', { escrowId }, escrow.txHash);

    // Send notifications
    sendNotification(
      escrow.creator, 
      'Escrow Released', 
      `Successfully released ${escrow.amount} XLM to recipient from Escrow #${escrowId}.`,
      'SUCCESS'
    );
    sendNotification(
      escrow.recipient, 
      'Funds Received', 
      `Escrow #${escrowId} released! ${escrow.amount} XLM transferred to your wallet.`,
      'SUCCESS'
    );

    return escrow;
  },

  // Refund Escrow
  async refundEscrow(escrowId) {
    const escrows = db.get(STORAGE_KEYS.ESCROWS);
    const idx = escrows.findIndex(e => e.escrowId === Number(escrowId));
    if (idx === -1) throw new Error('Escrow not found');

    const escrow = escrows[idx];
    if (escrow.status !== 'Funded' && escrow.status !== 'Disputed') {
      throw new Error('Escrow cannot be refunded');
    }

    escrow.status = 'Refunded';
    db.set(STORAGE_KEYS.ESCROWS, escrows);

    // Update reputation scores (deduct for refund/failure)
    updateReputation(escrow.recipient, false, 0);

    // Log Event
    publishEvent('Escrow Refunded', { escrowId }, escrow.txHash);

    // Send notifications
    sendNotification(
      escrow.creator, 
      'Escrow Refunded', 
      `Recipient returned ${escrow.amount} XLM to your wallet from Escrow #${escrowId}.`,
      'SUCCESS'
    );
    sendNotification(
      escrow.recipient, 
      'Escrow Refunded', 
      `Refunded ${escrow.amount} XLM back to creator for Escrow #${escrowId}.`,
      'INFO'
    );

    return escrow;
  },

  // Cancel Escrow
  async cancelEscrow(escrowId) {
    const escrows = db.get(STORAGE_KEYS.ESCROWS);
    const idx = escrows.findIndex(e => e.escrowId === Number(escrowId));
    if (idx === -1) throw new Error('Escrow not found');

    const escrow = escrows[idx];
    if (escrow.status !== 'Funded') {
      throw new Error('Only active funded escrows can be cancelled');
    }

    escrow.status = 'Cancelled';
    db.set(STORAGE_KEYS.ESCROWS, escrows);

    // Log Event
    publishEvent('Escrow Cancelled', { escrowId }, escrow.txHash);

    // Send notifications
    sendNotification(
      escrow.creator, 
      'Escrow Cancelled', 
      `Escrow #${escrowId} cancelled. Funds refunded to your account.`,
      'INFO'
    );
    sendNotification(
      escrow.recipient, 
      'Escrow Cancelled', 
      `Creator cancelled Escrow #${escrowId}. Locked funds returned.`,
      'WARNING'
    );

    return escrow;
  },

  // Open Dispute
  async openDispute(escrowId, reason) {
    const escrows = db.get(STORAGE_KEYS.ESCROWS);
    const idx = escrows.findIndex(e => e.escrowId === Number(escrowId));
    if (idx === -1) throw new Error('Escrow not found');

    const escrow = escrows[idx];
    if (escrow.status !== 'Funded') {
      throw new Error('Only funded escrows can be disputed');
    }

    escrow.status = 'Disputed';
    escrow.disputeReason = reason;
    db.set(STORAGE_KEYS.ESCROWS, escrows);

    // Log Event
    publishEvent('Escrow Disputed', { escrowId, reason }, escrow.txHash);

    // Send notifications
    sendNotification(
      escrow.creator, 
      'Dispute Raised', 
      `Dispute filed on Escrow #${escrowId}: "${reason}".`,
      'WARNING'
    );
    sendNotification(
      escrow.recipient, 
      'Dispute Raised', 
      `Dispute filed on Escrow #${escrowId}: "${reason}".`,
      'WARNING'
    );

    return escrow;
  },

  // Resolve Dispute
  async resolveDispute(escrowId, winner) {
    const escrows = db.get(STORAGE_KEYS.ESCROWS);
    const idx = escrows.findIndex(e => e.escrowId === Number(escrowId));
    if (idx === -1) throw new Error('Escrow not found');

    const escrow = escrows[idx];
    if (escrow.status !== 'Disputed') {
      throw new Error('Escrow is not in dispute');
    }

    const isWinnerRecipient = winner === escrow.recipient;
    escrow.status = isWinnerRecipient ? 'Released' : 'Refunded';
    db.set(STORAGE_KEYS.ESCROWS, escrows);

    // Update reputation scores
    if (isWinnerRecipient) {
      updateReputation(escrow.creator, true, escrow.amount);
      updateReputation(escrow.recipient, true, escrow.amount);
    } else {
      updateReputation(escrow.recipient, false, 0);
    }

    // Log Event
    publishEvent('Dispute Resolved', { escrowId, winner }, escrow.txHash);

    // Send notifications
    sendNotification(
      escrow.creator, 
      'Dispute Resolved', 
      `Dispute resolved. Winner: ${shortenAddress(winner, 5)}.`,
      'INFO'
    );
    sendNotification(
      escrow.recipient, 
      'Dispute Resolved', 
      `Dispute resolved. Winner: ${shortenAddress(winner, 5)}.`,
      'INFO'
    );

    return escrow;
  },

  // Get User profile metrics
  async getUserProfile(address) {
    const profiles = db.get(STORAGE_KEYS.PROFILES);
    let prof = profiles.find(p => p.walletAddress === address);
    
    if (!prof) {
      // Lazy init default profile
      prof = {
        walletAddress: address,
        reputationScore: 100,
        totalVolume: '0.00',
        completedContracts: 0,
        failedContracts: 0,
        successRate: 100,
        rank: profiles.length + 1
      };
      profiles.push(prof);
      db.set(STORAGE_KEYS.PROFILES, profiles);
    }
    return prof;
  },

  // Get User activity history
  async getUserActivity(address) {
    const events = db.get(STORAGE_KEYS.EVENTS);
    return events.filter(ev => 
      (ev.value && (ev.value.creator === address || ev.value.recipient === address || ev.value.winner === address))
    );
  },

  // Get User notifications
  async getNotifications(address) {
    const notifs = db.get(STORAGE_KEYS.NOTIFICATIONS);
    return notifs.filter(n => n.recipient === address);
  },

  // Mark all notifications as read
  async markNotificationsRead(address) {
    const notifs = db.get(STORAGE_KEYS.NOTIFICATIONS);
    notifs.forEach(n => {
      if (n.recipient === address) n.read = true;
    });
    db.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
    return { success: true };
  },

  // Get all indexed events (live activity stream)
  async getEvents() {
    return db.get(STORAGE_KEYS.EVENTS);
  }
};
