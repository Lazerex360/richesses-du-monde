const crypto = require('crypto');

function createWsUpgrade(hub, handlers, uuidv4) {
  const { handleMessage, handleDisconnect } = handlers;

  return function acceptWebSocket(req, socket) {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const accept = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    );

    const wsId = uuidv4();
    const ws = {
      _id: wsId,
      _ctx: {},
      readyState: 1,
      socket,
      send(data) {
        const payload = Buffer.from(data);
        const len = payload.length;
        let header;
        if (len < 126) {
          header = Buffer.alloc(2);
          header[0] = 0x81;
          header[1] = len;
        } else if (len < 65536) {
          header = Buffer.alloc(4);
          header[0] = 0x81;
          header[1] = 126;
          header.writeUInt16BE(len, 2);
        } else {
          header = Buffer.alloc(10);
          header[0] = 0x81;
          header[1] = 127;
          header.writeBigUInt64BE(BigInt(len), 2);
        }
        socket.write(Buffer.concat([header, payload]));
      },
    };

    hub.clients.set(wsId, ws);
    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 2) {
        const opcode = buffer[0] & 0x0f;
        const masked = (buffer[1] & 0x80) !== 0;
        let payloadLen = buffer[1] & 0x7f;
        let offset = 2;

        if (payloadLen === 126) {
          if (buffer.length < 4) return;
          payloadLen = buffer.readUInt16BE(2);
          offset = 4;
        } else if (payloadLen === 127) {
          if (buffer.length < 10) return;
          payloadLen = Number(buffer.readBigUInt64BE(2));
          offset = 10;
        }

        const maskOffset = masked ? 4 : 0;
        const frameLen = offset + maskOffset + payloadLen;
        if (buffer.length < frameLen) return;

        let payload = buffer.slice(offset + maskOffset, frameLen);
        if (masked) {
          const mask = buffer.slice(offset, offset + 4);
          for (let i = 0; i < payload.length; i++) {
            payload[i] ^= mask[i % 4];
          }
        }
        buffer = buffer.slice(frameLen);

        if (opcode === 0x8) {
          ws.readyState = 3;
          socket.end();
          handleDisconnect(ws);
          return;
        }
        if (opcode === 0x1) {
          try {
            handleMessage(ws, JSON.parse(payload.toString()));
          } catch (_) {
            /* ignore malformed */
          }
        }
      }
    });

    socket.on('close', () => {
      ws.readyState = 3;
      handleDisconnect(ws);
    });

    socket.on('error', () => {
      ws.readyState = 3;
      handleDisconnect(ws);
    });
  };
}

module.exports = { createWsUpgrade };
