// Integration test for Socket.io room flow
import { createServer } from 'http';
import { Server }       from 'socket.io';
import { io as Client }   from 'socket.io-client';

// Minimal socket server for testing (no Supabase/Redis needed)
function createTestServer() {
  const httpServer = createServer();
  const ioServer   = new Server(httpServer, { cors: { origin: '*' } });

  ioServer.on('connection', (socket) => {
    socket.on('room:join', ({ code }) => {
      socket.join(`room:${code}`);
      socket.emit('room:joined', { roomId: 'test-id', code, players: [], status: 'waiting' });
      socket.to(`room:${code}`).emit('room:player_joined', { players: [] });
    });

    socket.on('room:leave', () => {
      socket.emit('room:left', { ok: true });
    });
  });

  return { httpServer, ioServer };
}

describe('Room socket flow', () => {
  let httpServer, ioServer, client1, client2;
  const PORT = 3099;

  beforeAll((done) => {
    ({ httpServer, ioServer } = createTestServer());
    httpServer.listen(PORT, '127.0.0.1', done);
  });

  afterAll(() => {
    ioServer.close();
    httpServer.close();
  });

  afterEach(() => {
    client1?.disconnect();
    client2?.disconnect();
  });

  it('client receives room:joined on join', (done) => {
    client1 = Client(`http://127.0.0.1:${PORT}`);
    client1.emit('room:join', { code: 'ABC123' });
    client1.on('room:joined', (data) => {
      expect(data.code).toBe('ABC123');
      done();
    });
  });

  it('second client gets notified when first joins', (done) => {
    client1 = Client(`http://127.0.0.1:${PORT}`);
    client2 = Client(`http://127.0.0.1:${PORT}`);

    client1.emit('room:join', { code: 'XYZ789' });

    client1.on('room:joined', () => {
      client2.emit('room:join', { code: 'XYZ789' });
    });

    client1.on('room:player_joined', () => {
      done();
    });
  });
});
