import { customAlphabet } from 'nanoid';

// Room codes: uppercase letters + digits, 6 chars — e.g. "ABC123"
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

/**
 * Generates a unique 6-character room code.
 * Avoids ambiguous chars (0/O, 1/I).
 */
export function generateRoomCode() {
  return generateCode();
}

/**
 * Builds the full shareable URL for a room.
 */
export function buildRoomShareUrl(code, clientUrl) {
  return `${clientUrl}/join/${code}`;
}
