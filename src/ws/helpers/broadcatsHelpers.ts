import { createResponse, sendDBContent } from './callHelpers';
import { RoomState, shipsPositions } from 'types/types';
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
    sendDBContent(client, 'update_winners', startDb, 'Winners');
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
