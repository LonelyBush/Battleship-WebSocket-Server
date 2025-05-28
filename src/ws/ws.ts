import { broadcastUpdateRoom, startDb } from '../start';
import { WSCall } from '../types/types';
import WebSocket, { RawData } from 'ws';
import {
  addShips,
  addUserToRoom,
  attackEvent,
  createRoom,
  regUser,
} from './handlers/handlers';

export const dispatchEvent = (
  message: RawData,
  ws: WebSocket,
  client_Id: string,
) => {
  const messageString = message.toString();
  const { type, data }: WSCall = JSON.parse(messageString);

  switch (type) {
    case 'reg': {
      regUser(data, startDb, ws, client_Id);
      break;
    }
    case 'create_room': {
      createRoom(ws, startDb, client_Id);
      broadcastUpdateRoom();
      break;
    }
    case 'add_user_to_room': {
      addUserToRoom(data, startDb, client_Id, ws);
      break;
    }
    case 'add_ships': {
      addShips(data, startDb);
      break;
    }
    case 'attack': {
      attackEvent(data, startDb);
      break;
    }
    default:
      ws.send(JSON.stringify({ error: 'Wrong type of request' }));
  }
};
