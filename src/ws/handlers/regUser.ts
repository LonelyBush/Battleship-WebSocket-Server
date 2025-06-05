import { v4 as randomUuid } from 'uuid';
import { User, UserResponse } from '../../types/types';
import WebSocket from 'ws';
import { createResponse } from '../helpers/callHelpers';
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
