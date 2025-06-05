import {
  Attack,
  CreateGame,
  Player,
  shipsPositions,
  Turn,
  Winner,
} from '../../types/types';
import { createResponse } from '../helpers/callHelpers';
import { InMemoryMapDB } from '../../db/db';
import { translateShipType } from '../../utills/utills';
import { broadcastKilled } from '../../ws/helpers/broadcatsHelpers';

export const attackEvent = (message: Attack, db: InMemoryMapDB) => {
  const { gameId, x, y, indexPlayer }: Attack = message;
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
          const findWinner = db.find('Winners', {
            name: attackerName,
          })[0] as Winner;
          if (findWinner) {
            db.update('Winners', findWinner.winnerId, {
              wins: findWinner.wins + 1,
            });
          } else {
            db.insert(
              'Winners',
              { winnerId: attacker, name: attackerName, wins: 1 },
              attacker,
            );
          }
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
          db.delete('Games', gameId);
          db.delete('Turn', gameId);
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
