import { dispatchEvent, sendDBContent } from './ws_helpers/ws';
import { InMemoryMapDB } from './db/db';
import { httpServer } from './http/http';
import { WebSocketServer } from 'ws';
import { v4 as randomUuid } from 'uuid';
import { RoomState } from 'types/types';

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
  });

  ws.on('close', () => {
    console.log(`Клиент отключился ID ${client_Id}`);
    const getRooms = startDb.getAll('Rooms') as unknown as RoomState[];
    const findRoom = getRooms.find((elem) => {
      return elem.roomUsers.some((el) => el.index === client_Id);
    });
    if (findRoom?.roomId) startDb.delete('Rooms', findRoom.roomId);
    console.log(`Комната клиента ID ${client_Id} была удалена`);
    console.log(getRooms);
    broadcastUpdateRoom();
  });
});

export const broadcastUpdateRoom = () => {
  wss.clients.forEach((client) => {
    sendDBContent<RoomState>(client, 'update_room', startDb, 'Rooms', (val) => {
      return val.filter((elem) => elem.roomUsers.length === 1);
    });
  });
};
