import { AddShips, Cords, CreateGame, shipsPositions } from '../../types/types';
import { createResponse } from '../helpers/callHelpers';
import { InMemoryMapDB } from '../../db/db';
import { translateShipType } from '../../utills/utills';

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
