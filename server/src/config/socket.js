import { Server as SocketIOServer } from 'socket.io';
import { query } from './database.js';

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
      origin: clientOrigin,
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    // 1. Client joins an auction room
    socket.on('auction:join', async (data, callback) => {
      try {
        const auctionId = typeof data === 'string' ? data : data?.auctionId;

        // Validate UUID format
        if (!auctionId || !UUID_REGEX.test(auctionId)) {
          if (typeof callback === 'function') {
            callback({ error: 'Invalid auction ID format' });
          }
          return;
        }

        // Verify auction exists in database
        const res = await query('SELECT id FROM auctions WHERE id = $1', [auctionId]);
        if (res.rows.length === 0) {
          if (typeof callback === 'function') {
            callback({ error: 'Auction listing not found' });
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
    socket.on('auction:leave', (data) => {
      const auctionId = typeof data === 'string' ? data : data?.auctionId;
      if (auctionId && UUID_REGEX.test(auctionId)) {
        const room = `auction:${auctionId}`;
        socket.leave(room);
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
export const broadcastBidUpdate = (auctionId, payload) => {
  if (!io) {
    console.warn('[Socket] Cannot broadcast bid update: Socket.IO is not initialized.');
    return;
  }

  const room = `auction:${auctionId}`;
  io.to(room).emit('auction:bid-updated', payload);
};

