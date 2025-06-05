import { createResponse, sendDBContent } from './callHelpers';
import {
  CreateGame,
  RoomState,
  shipsPositions,
  User,
  Winner,
} from 'types/types';
import { startDb, wss } from '../../start';
import { handlePostKillFire } from '../../utills/utills';
import { WebSocket } from 'ws';

export const broadcastUpdateRoom = () => {
  wss.clients.forEach((client) => {
    sendDBContent<RoomState>(client, 'update_room', startDb, 'Rooms', (val) => {
      return val.filter((elem) => elem.roomUsers.length === 1);
    });
  });
};
export const broadcastWinners = () => {
  wss.clients.forEach((client) => {
    sendDBContent<Omit<Winner, 'winnerId'>>(
      client,
      'update_winners',
      startDb,
      'Winners',
      (val) => {
        return val.map((el) => ({ name: el.name, wins: el.wins }));
      },
    );
  });
};

export const clearRooms = (clientId: string) => {
  const getRooms = startDb.getAll('Rooms') as unknown as RoomState[];
  const findRoom = getRooms.find((elem) => {
    return elem.roomUsers.some((el) => el.index === clientId);
  });
  if (findRoom?.roomId) startDb.delete('Rooms', findRoom.roomId);
  console.log(`Комната клиента ID ${clientId} была удалена`);
  console.log(getRooms);
  broadcastUpdateRoom();
};

export const clearGames = (clientId: string) => {
  const findUser = startDb.findById('Users', clientId) as User & {
    id: string;
  };
  const getGames = startDb.getAll('Games') as unknown as CreateGame[];
  const findGame = getGames.find((el) => {
    return el.players.some((el) => el.name === findUser.name);
  });
  const findOtherPlayer = findGame?.players.find(
    (el) => el.name !== findUser.name,
  );

  if (findGame && findOtherPlayer) {
    const findWinner = startDb.find('Winners', {
      name: findOtherPlayer?.name,
    })[0] as Winner;
    if (findWinner) {
      startDb.update('Winners', findWinner.winnerId, {
        wins: findWinner.wins + 1,
      });
    } else {
      startDb.insert(
        'Winners',
        {
          winnerId: findOtherPlayer.indexPlayer,
          name: findOtherPlayer.name,
          wins: 1,
        },
        findOtherPlayer.indexPlayer,
      );
    }

    findGame.players.forEach((el) => {
      createResponse(el.socket!, 'finish', {
        winPlayer: findOtherPlayer.indexPlayer,
      });
    });
  }
  if (findGame && findGame.gameId) startDb.delete('Games', findGame.gameId);
};

export const broadcastKilled = (
  socket: WebSocket,
  ship: shipsPositions,
  player: string,
) => {
  const getXs = ship.cords.map((el) => el.x);
  const getYs = ship.cords.map((el) => el.y);
  handlePostKillFire(getXs, getYs, ship, (i, j) => {
    createResponse(socket, 'attack', {
      status: 'miss',
      currentPlayer: player,
      position: { x: i, y: j },
    });
  });
};
