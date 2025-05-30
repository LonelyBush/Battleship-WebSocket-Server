import { CallType } from '../../types/types';
import { CollectionTypes, InMemoryMapDB } from '../../db/db';
import { WebSocket } from 'ws';

export const createResponse = <T>(
  ws: WebSocket,
  type: CallType,
  message: T,
) => {
  const createResponse = {
    type,
    data: JSON.stringify(message),
    id: 0,
  };
  const goJson = JSON.stringify(createResponse);

  ws.send(goJson, (err) => {
    if (err) {
      ws.send(JSON.stringify({ error: 'Send failed' }));
    }
  });
};

export const sendDBContent = <T extends Omit<CollectionTypes, 'id'>>(
  ws: WebSocket,
  type: CallType,
  db: InMemoryMapDB,
  collectionName: string,
  callback?: (value: Omit<T, 'id'>[]) => Omit<T, 'id'>[],
) => {
  const collection = db.getAll(collectionName);
  const transform = collection.map(({ id, ...rest }) => {
    console.log(id);
    return rest;
  }) as unknown as Omit<T, 'id'>[];

  const callBackTransform = callback ? callback(transform) : transform;

  const createResponse = {
    type,
    data: JSON.stringify(callBackTransform),
    id: 0,
  };
  const goJson = JSON.stringify(createResponse);

  ws.send(goJson, (err) => {
    if (err) {
      ws.send(JSON.stringify({ error: 'Send failed' }));
    }
  });
};
