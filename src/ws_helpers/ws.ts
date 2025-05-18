import { startDb } from '../start';
import { v4 as randomUuid } from 'uuid';
import { CallType, User, UserResponse, WSCall } from '../types/types';
import WebSocket, { RawData } from 'ws';

type Parsed = WSCall<User>;

export const dispatchEvent = (message: RawData, ws: WebSocket) => {
  const messageString = message.toString();
  const parsed: Parsed = JSON.parse(messageString);

  switch (parsed.type) {
    case 'reg':
      const { data } = parsed;
      const convertData: User = JSON.parse(data as unknown as string);

      startDb.insert('Users', { ...convertData });

      console.log(startDb.getAll('Users'));

      createResponse<UserResponse>(ws, 'reg', {
        name: convertData.name,
        index: randomUuid(),
      });
      break;
    default:
      ws.send(JSON.stringify({ error: 'Wrong type of request' }));
  }
};

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
    console.error(err);
    if (err) {
      ws.send(JSON.stringify({ error: 'Send failed' }));
    }
  });
};
