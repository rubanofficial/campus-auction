import { Server as SocketIOServer } from 'socket.io';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let io = null;

/**
 * Initialize Socket.IO with the HTTP server
 * @param {import('http').Server} httpServer
 */
export const initSocketIO = (httpServer) => {
  const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow server-to-server, curl, mobile, and dev clients
        if (!origin) return callback(null, true);
        if (
          origin === clientOrigin ||
          origin === 'http://localhost:5173' ||
          origin === 'http://127.0.0.1:5173' ||
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(new Error(`CORS not allowed for origin: ${origin}`));
      },
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    // 1. Client joins an auction room
    socket.on('auction:join', (data, callback) => {
      try {
        const auctionId = typeof data === 'string' ? data : data?.auctionId;

        // Validate UUID format
        if (!auctionId || !UUID_REGEX.test(auctionId)) {
          if (typeof callback === 'function') {
            callback({ error: 'Invalid auction ID format' });
          }
          return;
        }

        const room = `auction:${auctionId}`;
        socket.join(room);

        if (typeof callback === 'function') {
          callback({ success: true, room });
        }
      } catch (err) {
        console.error(`[Socket] Error joining auction room: ${err.message}`);
        if (typeof callback === 'function') {
          callback({ error: 'Failed to join auction room' });
        }
      }
    });

    // 2. Client leaves an auction room
    socket.on('auction:leave', (data, callback) => {
      try {
        const auctionId = typeof data === 'string' ? data : data?.auctionId;
        if (auctionId && UUID_REGEX.test(auctionId)) {
          const room = `auction:${auctionId}`;
          socket.leave(room);
          if (typeof callback === 'function') {
            callback({ success: true, room });
          }
        }
      } catch (err) {
        console.error(`[Socket] Error leaving auction room: ${err.message}`);
      }
    });

    socket.on('disconnect', () => {
      // Socket.IO automatically removes socket from all rooms on disconnect
    });
  });

  return io;
};

/**
 * Retrieve the active Socket.IO server instance
 */
export const getIO = () => {
  return io;
};

/**
 * Broadcast an accepted bid event to all clients viewing the specific auction room.
 * MUST only be invoked after the database transaction has successfully committed.
 *
 * @param {string} auctionId - Auction UUID
 * @param {Object} payload - Bid update payload
 */
export const broadcastBidUpdate = (auctionId, payload = {}) => {
  if (!io) {
    console.warn('[Socket] Cannot broadcast bid update: Socket.IO is not initialized.');
    return;
  }

  const bid = payload.bid || (payload.id ? payload : null);
  const auction = payload.auction || {};

  const currentPrice = Number(
    auction.currentPrice ??
    auction.current_price ??
    bid?.amount ??
    payload.currentPrice ??
    payload.current_price ??
    0
  );

  const bidCount = Number(
    auction.bidCount ??
    auction.bid_count ??
    payload.bidCount ??
    payload.bid_count ??
    0
  );

  const currentLeaderId =
    auction.currentLeaderId ||
    auction.current_leader_id ||
    bid?.bidderId ||
    bid?.bidder_id ||
    payload.currentLeaderId ||
    payload.current_leader_id ||
    null;

  const currentLeaderName =
    auction.currentLeaderName ||
    auction.current_leader_name ||
    bid?.bidderName ||
    bid?.bidder_name ||
    payload.currentLeaderName ||
    payload.current_leader_name ||
    'Verified Student';

  const timestamp =
    bid?.createdAt ||
    bid?.created_at ||
    auction.updatedAt ||
    auction.updated_at ||
    new Date().toISOString();

  const formattedPayload = {
    auctionId,
    auction_id: auctionId,
    currentPrice,
    current_price: currentPrice,
    bidCount,
    bid_count: bidCount,
    currentLeaderId,
    current_leader_id: currentLeaderId,
    currentLeaderName,
    current_leader_name: currentLeaderName,
    timestamp,
    bid: bid
      ? {
          id: bid.id,
          auctionId,
          auction_id: auctionId,
          bidderId: bid.bidderId || bid.bidder_id,
          bidder_id: bid.bidderId || bid.bidder_id,
          bidderName: bid.bidderName || bid.bidder_name || currentLeaderName,
          bidder_name: bid.bidderName || bid.bidder_name || currentLeaderName,
          amount: Number(bid.amount),
          createdAt: bid.createdAt || bid.created_at || timestamp,
          created_at: bid.createdAt || bid.created_at || timestamp,
        }
      : null,
    auction: {
      ...auction,
      id: auctionId,
      currentPrice,
      current_price: currentPrice,
      currentLeaderId,
      current_leader_id: currentLeaderId,
      currentLeaderName,
      current_leader_name: currentLeaderName,
      bidCount,
      bid_count: bidCount,
      updatedAt: timestamp,
      updated_at: timestamp,
    },
  };

  const room = `auction:${auctionId}`;
  io.to(room).emit('auction:bid-updated', formattedPayload);
};

/**
 * Broadcast a seller decision (accepted / rejected) event to all clients viewing the auction room.
 * MUST only be invoked after the database transaction has successfully committed.
 *
 * @param {string} auctionId - Auction UUID
 * @param {Object} payload - Decision update payload
 */
export const broadcastAuctionDecision = (auctionId, payload = {}) => {
  if (!io) {
    console.warn('[Socket] Cannot broadcast auction decision: Socket.IO is not initialized.');
    return;
  }

  const room = `auction:${auctionId}`;
  io.to(room).emit('auction:decision-updated', {
    auctionId,
    auction_id: auctionId,
    ...payload,
  });
};
