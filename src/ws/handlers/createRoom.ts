import { v4 as randomUuid } from 'uuid';
import { User } from '../../types/types';
import WebSocket from 'ws';
import { createResponse } from '../helpers/callHelpers';
import { InMemoryMapDB } from '../../db/db';

export const createRoom = (
  ws: WebSocket,
  db: InMemoryMapDB,
  currentClientId: string,
) => {
  const getIindex = randomUuid();
  const getPlayerId = randomUuid();
  const { name, id } = db.findById('Users', currentClientId) as User & {
    id: string;
  };

  db.insert(
    'Rooms',
    {
      roomId: getIindex,
      roomUsers: [{ name, index: id, socket: ws }],
    },
    getIindex,
  );
  const createPlayer = [
    {
      indexPlayer: getPlayerId,
      name,
      ships: [],
      socket: ws,
      field: [],
      ship_positions: [],
    },
  ];

  db.insert(
    'Games',
    {
      gameId: getIindex,
      players: createPlayer,
    },
    getIindex,
  );

  createResponse(ws, 'create_game', {
    idGame: getIindex,
    idPlayer: getPlayerId,
  });

  console.log(db.getAll('Games'));
  console.log(db.getAll('Rooms'));
};
