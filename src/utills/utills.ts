import { shipsPositions } from '../types/types';

export const translateShipType = (query: string | number) => {
  switch (query) {
    case 'small': {
      return 1;
    }
    case 'medium': {
      return 2;
    }
    case 'large': {
      return 3;
    }
    case 'huge': {
      return 4;
    }

    case 1: {
      return 'small';
    }
    case 2: {
      return 'medium';
    }
    case 3: {
      return 'large';
    }
    case 4: {
      return 'huge';
    }
    default:
      return 0;
  }
};

export const handlePostKillFire = (
  x: number[],
  y: number[],
  ship: shipsPositions,
  callback: (i: number, j: number) => void,
) => {
  const minX = Math.max(0, Math.min(...x) - 1);
  const maxX = Math.min(9, Math.max(...x) + 1);
  const minY = Math.max(0, Math.min(...y) - 1);
  const maxY = Math.min(9, Math.max(...y) + 1);

  for (let i = minX; i <= maxX; i++) {
    for (let j = minY; j <= maxY; j++) {
      const isShipPosition = ship.cords.some((el) => el.x === i && el.y === j);
      if (!isShipPosition) callback(i, j);
    }
  }
};
