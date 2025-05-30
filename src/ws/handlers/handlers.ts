import { startDb } from '../../start';
import { v4 as randomUuid } from 'uuid';
import {
  AddShips,
  Attack,
  Cords,
  CreateGame,
  Player,
  Room,
  RoomState,
  shipsPositions,
  Turn,
  User,
  UserResponse,
} from '../../types/types';
import WebSocket from 'ws';
import { createResponse } from '../helpers/callHelpers';
import { InMemoryMapDB } from '../../db/db';
import { translateShipType } from '../../utills/utills';
import { broadcastKilled } from '../../ws/helpers/broadcatsHelpers';

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

export const addShips = (message: string, db: InMemoryMapDB) => {
  const createField = [...Array(10)].map(() => Array(10).fill(0));
  const shipPositions: shipsPositions[] = [];
  const {
    gameId,
    ships,
    indexPlayer: requestPlayer,
  }: AddShips = JSON.parse(message);
  const findGame = db.findById('Games', gameId) as CreateGame;

  ships.forEach((ship) => {
    const { position, direction, length, type } = ship;
    const shipCords: Cords[] = [];
    for (let i = 0; i < length; i++) {
      const y = direction ? position.y + i : position.y;
      const x = direction ? position.x : position.x + i;
      createField[y]![x] = translateShipType(type);
      shipCords.push({ x: x, y: y });
    }
    shipPositions.push({ cords: shipCords, type, direction });
  });
  const addShips = findGame.players.map((el) => {
    if (el.indexPlayer === requestPlayer) {
      return {
        ...el,
        ships: ships,
        field: createField,
        ship_positions: shipPositions,
      };
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
        createResponse(socket, 'turn', {
          currentPlayer: requestPlayer,
        });
        db.insert('Turn', { currentPlayer: requestPlayer }, gameId);
      }
    });
  } else {
    console.log(`Ships of ${requestPlayer} submited waiting for second player`);
  }
};

export const attackEvent = (message: string, db: InMemoryMapDB) => {
  const { gameId, x, y, indexPlayer }: Attack = JSON.parse(message);
  const findGame = db.findById('Games', gameId) as CreateGame;
  const findTurn = db.findById('Turn', gameId) as Turn;
  const attacker = indexPlayer;
  let defender = '';
  let defenderName = '';
  let attackerName = '';
  const enemyShip: shipsPositions = {
    cords: [],
    type: '',
    direction: false,
  };
  const attackEcho = {
    position: {
      x: x,
      y: y,
    },
    currentPlayer: attacker,
    status: 'miss',
  };

  const battlefield = findGame.players.map((player) => {
    if (player.indexPlayer !== attacker) {
      defender = player.indexPlayer;

      defenderName = player.name;
      attackerName =
        findGame.players.find((player) => player.indexPlayer === attacker)
          ?.name ?? '';

      const fire = player.field[y]![x];
      console.log(`Cords: x:${x} y:${y}`);
      console.log('Hit detector ' + (fire! > 0));
      console.log(`Ship type: ${translateShipType(fire!)}`);

      if ((fire && fire > 0) || fire === -1) {
        const boatTag: number[] = [];
        player.field[y]![x] = -1;

        const findShip = player.ship_positions.find((ship) =>
          ship.cords.some((el) => el.x === x && el.y === y),
        );
        findShip?.cords.forEach((cord) => {
          boatTag.push(player.field[cord.y]![cord.x]!);
        });
        if (boatTag.every((el) => el === -1)) {
          attackEcho.status = 'killed';
          Object.assign(enemyShip, findShip);
        } else {
          attackEcho.status = 'shot';
        }
      }
      return { ...player };
    } else {
      return { ...player };
    }
  }, []);

  db.update('Game', gameId, { players: battlefield as Player[] });
  const getUpdatedGames = db.findById('Games', gameId) as CreateGame;

  if (findTurn.currentPlayer === attacker) {
    console.log(`Current player: > ${attackerName}`);
    getUpdatedGames.players.forEach((el) => {
      const { socket, field } = el;
      const isValidateWin = field.every((elem) =>
        elem.every((nums) => nums <= 0),
      );
      if (socket) {
        const currentTurn = attackEcho.status === 'miss' ? defender : attacker;
        attackEcho.status === 'miss' ? defenderName : attackerName;
        if (attackEcho.status === 'killed') {
          if (!enemyShip) return;
          broadcastKilled(socket, enemyShip, currentTurn);
        }
        createResponse(socket, 'attack', {
          ...attackEcho,
          currentPlayer: attacker,
        });
        console.log('Possible win is ' + isValidateWin, el.indexPlayer);

        if (isValidateWin) {
          db.insert(
            'Winners',
            { winnerId: attacker, name: attackerName, wins: 1 },
            attacker,
          );
          getUpdatedGames.players.forEach((el) => {
            createResponse(el.socket!, 'finish', {
              winPlayer: attacker,
            });
          });
        } else {
          db.update('Turn', gameId, { currentPlayer: currentTurn });
          createResponse(socket, 'turn', {
            currentPlayer: currentTurn,
          });
        }
      }
    });
  }
};
