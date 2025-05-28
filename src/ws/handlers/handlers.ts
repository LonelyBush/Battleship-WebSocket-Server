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
import { InMemoryMapDB } from '../../db/db';

export const regUser = (
  message: string,
  db: InMemoryMapDB,
  ws: WebSocket,
  currentClientId: string,
) => {
  const transform: User = JSON.parse(message);

  const findSame = db.find('Users', { ...transform });
  if (findSame.length > 0) {
    createResponse<UserResponse>(ws, 'reg', {
      error: true,
      errorText: 'Such user is already logged in',
      name: transform.name,
      index: randomUuid(),
    });
  } else {
    db.insert('Users', { ...transform, socket: ws }, currentClientId);
    createResponse<UserResponse>(ws, 'reg', {
      name: transform.name,
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
    { indexPlayer: getPlayerId, ships: [], socket: ws, field: [] },
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
    socket: ws,
    field: [],
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

export const shipTypes = {
  small: 1,
  medium: 2,
  large: 3,
  huge: 4,
};

export const addShips = (message: string, db: InMemoryMapDB) => {
  const createField = [...Array(10)].map(() => Array(10).fill(0));
  const { gameId, ships, indexPlayer }: AddShips = JSON.parse(message);
  const findGame = db.findById('Games', gameId) as CreateGame;

  ships.forEach((ship) => {
    const { position, direction, length, type } = ship;
    for (let i = 0; i < length; i++) {
      const y = direction ? position.y + i : position.y;
      const x = direction ? position.x : position.x + i;
      createField[y]![x] = shipTypes[type];
    }
  });
  const addShips = findGame.players.map((el) => {
    if (el.indexPlayer === indexPlayer) {
      return { ...el, ships: ships, field: createField };
    }
    return { ...el };
  });

  db.update('Games', gameId, { players: addShips });
  const getUpdatedGames = db.findById('Games', gameId) as CreateGame;

  const validateShipsContent = getUpdatedGames.players.every(
    (el) => el.ships && el.ships?.length > 0,
  );
  if (getUpdatedGames.players.length > 1) {
    getUpdatedGames.players.forEach((el) => {
      const { socket, ships, indexPlayer } = el;
      if (validateShipsContent && socket) {
        createResponse(socket, 'start_game', {
          ships: ships,
          currentPlayerIndex: indexPlayer,
        });
      }
    });
  } else {
    console.log(`Ships of ${indexPlayer} submited waiting for second player`);
  }
};
