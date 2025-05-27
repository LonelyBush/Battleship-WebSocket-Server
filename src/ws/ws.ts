import { broadcastUpdateRoom, startDb } from '../start';
import { AddShips, Room, User, WSCall } from '../types/types';
import WebSocket, { RawData } from 'ws';
import {
  addShips,
  addUserToRoom,
  createRoom,
  regUser,
} from './handlers/handlers';

export type ParsedData = WSCall<User> | WSCall<Room> | WSCall<AddShips>;

export const dispatchEvent = (
  message: RawData,
  ws: WebSocket,
  client_Id: string,
) => {
  const messageString = message.toString();
  const parsed: ParsedData = JSON.parse(messageString);
  console.log(startDb.getAll('Users'));

  switch (parsed.type) {
    case 'reg': {
      regUser(parsed, startDb, ws, client_Id);
      break;
    }
    case 'create_room': {
      createRoom(ws, startDb, client_Id);
      broadcastUpdateRoom();
      break;
    }
    case 'add_user_to_room': {
      addUserToRoom(parsed, startDb, client_Id, ws);
      break;
    }
    case 'add_ships': {
      addShips(parsed, startDb);
      break;
    }
    default:
      ws.send(JSON.stringify({ error: 'Wrong type of request' }));
  }
};
