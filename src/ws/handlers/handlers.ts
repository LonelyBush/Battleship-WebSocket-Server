import { startDb } from '../../start';
import { v4 as randomUuid } from 'uuid';
import {
  AddShips,
  CreateGame,
  Room,
  RoomState,
  User,
  UserResponse,
} from '../../types/types';
import WebSocket from 'ws';
import { createResponse } from './../helpers/helpers';
import { ParsedData } from '../../ws/ws';
import { InMemoryMapDB } from '../../db/db';

export const regUser = (
  message: ParsedData,
  db: InMemoryMapDB,
  ws: WebSocket,
  currentClientId: string,
) => {
  const { data } = message;
  const convertData: User = JSON.parse(data as unknown as string);
  const findSame = db.find('Users', { ...convertData });
  if (findSame.length > 0) {
    createResponse<UserResponse>(ws, 'reg', {
      error: true,
      errorText: 'Such user is already logged in',
      name: convertData.name,
      index: randomUuid(),
    });
  } else {
    db.insert('Users', { ...convertData, socket: ws }, currentClientId);
    createResponse<UserResponse>(ws, 'reg', {
      name: convertData.name,
      index: currentClientId,
    });
  }
};

export const createRoom = (
  ws: WebSocket,
  db: InMemoryMapDB,
  currentClientId: string,
) => {
  const getIindex = randomUuid();
  const getPlayerId = randomUuid();
  const { name, id } = db.findById(
    'Users',
    currentClientId,
  ) as unknown as User & { id: string };

  db.insert(
    'Rooms',
    {
      roomId: getIindex,
      roomUsers: [{ name, index: id, socket: ws }],
    },
    getIindex,
  );
  const createPlayer = [{ indexPlayer: getPlayerId, ships: [], socket: ws }];

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

export const addUserToRoom = (
  message: ParsedData,
  db: InMemoryMapDB,
  currentClientId: string,
  ws: WebSocket,
) => {
  const findUserByIndex = startDb.findById(
    'Users',
    currentClientId,
  ) as unknown as User & { id: string };
  const { data } = message;
  const playerId = randomUuid();
  const { indexRoom }: Room = JSON.parse(data as unknown as string);
  const findRoom = db.findById('Rooms', indexRoom) as unknown as RoomState;
  const findGame = db.findById('Games', indexRoom) as unknown as CreateGame;

  const getRoomUsers = findRoom.roomUsers;
  getRoomUsers.push({
    name: findUserByIndex.name,
    index: findUserByIndex.id,
    socket: ws,
  });
  const getGamePlayers = findGame.players;
  getGamePlayers.push({ indexPlayer: playerId, ships: [], socket: ws });

  db.update('Rooms', indexRoom, {
    roomUsers: getRoomUsers,
  });
  db.update('Games', indexRoom, { players: getGamePlayers });

  findRoom.roomUsers.forEach((user, i) => {
    const { index } = user;
    const findUserByIndex = db.findById('Users', index) as unknown as User & {
      id: string;
    };
    const findGame = db.findById('Games', indexRoom) as unknown as CreateGame;

    createResponse(findUserByIndex.socket, 'create_game', {
      idGame: indexRoom,
      idPlayer: findGame.players[i]?.indexPlayer,
    });
  });
  startDb.delete('Rooms', indexRoom);
  console.log(db.getAll('Games'));
  console.log(db.getAll('Rooms'));
};

export const addShips = (message: ParsedData, db: InMemoryMapDB) => {
  const { data } = message;
  const { gameId, ships, indexPlayer }: AddShips = JSON.parse(
    data as unknown as string,
  );
  const findGame = db.findById('Games', gameId) as unknown as CreateGame;
  const addShips = findGame.players.map((el) => {
    if (el.indexPlayer === indexPlayer) {
      return { ...el, ships: ships };
    }
    return { ...el };
  });

  db.update('Games', gameId, { players: addShips });
  const getUpdatedGames = db.findById('Games', gameId) as unknown as CreateGame;

  const validateShipsContent = getUpdatedGames.players.every(
    (el) => el.ships && el.ships?.length > 0,
  );

  getUpdatedGames.players.forEach((el) => {
    const { socket, ships, indexPlayer } = el;
    if (validateShipsContent && socket) {
      createResponse(socket, 'start_game', {
        ships: ships,
        currentPlayerIndex: indexPlayer,
      });
    }
  });
};
