import { dispatchEvent } from './ws_helpers/ws';
import { InMemoryMapDB } from './db/db';
import { httpServer } from './http/http';
import { WebSocketServer } from 'ws';

const HTTP_PORT = 8181;
export const startDb = new InMemoryMapDB();

export const wss = new WebSocketServer({ port: 3000 });

httpServer.listen(HTTP_PORT);

console.log(
  `Start static http server on the http://localhost:${HTTP_PORT}/ port!`,
);

wss.on('connection', (ws) => {
  console.log('Новый клиент подключился!');

  ws.on('message', (message) => {
    dispatchEvent(message, ws);
  });

  ws.on('close', () => {
    console.log('Клиент отключился');
  });
});
