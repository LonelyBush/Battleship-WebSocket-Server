import { InMemoryMapDB } from './db/db';
import { httpServer } from './http/http';
import { WebSocketServer } from 'ws';
import { v4 as randomUuid } from 'uuid';
import { dispatchEvent } from './ws/ws';
import {
  broadcastUpdateRoom,
  broadcastWinners,
  clearRooms,
} from './ws/helpers/broadcatsHelpers';

const HTTP_PORT = 8181;
export const startDb = new InMemoryMapDB();

export const wss = new WebSocketServer({ port: 3000 });

httpServer.listen(HTTP_PORT);

console.log(
  `Start static http server on the http://localhost:${HTTP_PORT}/ port!`,
);

wss.on('connection', (ws) => {
  const client_Id = randomUuid();
  console.log(`Новый клиент подключился! его уникальный ID ${client_Id}`);

  ws.on('message', (message) => {
    dispatchEvent(message, ws, client_Id);
    broadcastUpdateRoom();
    broadcastWinners();
  });

  ws.on('close', () => {
    console.log(`Клиент отключился ID ${client_Id}`);
    clearRooms(client_Id);
  });
});
