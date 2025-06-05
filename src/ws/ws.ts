import { startDb } from '../start';
import { RandomAttack, WSCall } from '../types/types';
import WebSocket, { RawData } from 'ws';
import { broadcastUpdateRoom } from './helpers/broadcatsHelpers';
import { regUser } from './handlers/regUser';
import { createRoom } from './handlers/createRoom';
import { addUserToRoom } from './handlers/addUserToRoom';
import { addShips } from './handlers/addShips';
import { attackEvent } from './handlers/attackEvent';

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
      attackEvent(JSON.parse(data), startDb);
      break;
    }
    case 'randomAttack': {
      const { gameId, indexPlayer }: RandomAttack = JSON.parse(data);
      const configAttack = {
        gameId,
        indexPlayer,
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
      };

      attackEvent(configAttack, startDb);
      break;
    }
    default:
      ws.send(JSON.stringify({ error: 'Wrong type of request' }));
  }
};
