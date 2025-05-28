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
