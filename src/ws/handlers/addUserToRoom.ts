import { startDb } from '../../start';
import { v4 as randomUuid } from 'uuid';
import { CreateGame, Room, RoomState, User } from '../../types/types';
import WebSocket from 'ws';
import { createResponse } from '../helpers/callHelpers';
import { InMemoryMapDB } from '../../db/db';

export const addUserToRoom = (
  message: string,
  db: InMemoryMapDB,
  currentClientId: string,
  ws: WebSocket,
) => {
  const findUserByIndex = startDb.findById('Users', currentClientId) as User & {
    id: string;
  };
  const playerId = randomUuid();
  const { indexRoom }: Room = JSON.parse(message);
  const findRoom = db.findById('Rooms', indexRoom) as RoomState;
  const findGame = db.findById('Games', indexRoom) as CreateGame;

  const getRoomUsers = findRoom.roomUsers;
  getRoomUsers.push({
    name: findUserByIndex.name,
    index: findUserByIndex.id,
    socket: ws,
  });
  const getGamePlayers = findGame.players;
  getGamePlayers.push({
    indexPlayer: playerId,
    ships: [],
    name: findUserByIndex.name,
    socket: ws,
    field: [],
    ship_positions: [],
  });

  db.update('Rooms', indexRoom, {
    roomUsers: getRoomUsers,
  });
  db.update('Games', indexRoom, { players: getGamePlayers });

  findRoom.roomUsers.forEach((user, i) => {
    const { index } = user;
    const findUserByIndex = db.findById('Users', index) as User & {
      id: string;
    };
    const findGame = db.findById('Games', indexRoom) as CreateGame;

    createResponse(findUserByIndex.socket, 'create_game', {
      idGame: indexRoom,
      idPlayer: findGame.players[i]?.indexPlayer,
    });
  });
  startDb.delete('Rooms', indexRoom);
  console.log(db.getAll('Games'));
  console.log(db.getAll('Rooms'));
};
