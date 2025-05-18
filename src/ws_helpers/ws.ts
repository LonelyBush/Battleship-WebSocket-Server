import { broadcastUpdateRoom, startDb } from '../start';
import { v4 as randomUuid } from 'uuid';
import {
  CallType,
  CreateGameResponse,
  RoomState,
  User,
  UserResponse,
  WSCall,
} from '../types/types';
import WebSocket, { RawData } from 'ws';
import { CollectionTypes, InMemoryMapDB } from '../db/db';

type Room = {
  indexRoom: string;
};

type Parsed = WSCall<User> | WSCall<Room>;

export const dispatchEvent = (
  message: RawData,
  ws: WebSocket,
  client_Id: string,
) => {
  const messageString = message.toString();
  const parsed: Parsed = JSON.parse(messageString);
  console.log(startDb.getAll('Users'));

  switch (parsed.type) {
    case 'reg': {
      const { data } = parsed;
      const convertData: User = JSON.parse(data as unknown as string);
      const findSame = startDb.find('Users', { ...convertData });
      if (findSame.length > 0) {
        createResponse<UserResponse>(ws, 'reg', {
          error: true,
          errorText: 'Such user is already logged in',
          name: convertData.name,
          index: randomUuid(),
        });
      } else {
        startDb.insert('Users', { ...convertData, socket: ws }, client_Id);
        createResponse<UserResponse>(ws, 'reg', {
          name: convertData.name,
          index: client_Id,
        });
        sendDBContent(ws, 'update_winners', startDb, 'Winners');
        sendDBContent<RoomState>(ws, 'update_room', startDb, 'Rooms', (val) => {
          return val.filter((elem) => elem.roomUsers.length === 1);
        });
      }
      break;
    }
    case 'create_room': {
      const getIindex = randomUuid();
      const getNewGameId = randomUuid();
      const { name, id } = startDb.findById(
        'Users',
        client_Id,
      ) as unknown as User & { id: string };

      startDb.insert(
        'Rooms',
        {
          roomId: getIindex,
          roomUsers: [{ name, index: id }],
        },
        getIindex,
      );
      createResponse<CreateGameResponse>(ws, 'create_game', {
        idGame: getNewGameId,
        idPlayer: randomUuid(),
      });
      broadcastUpdateRoom();
      break;
    }
    case 'add_user_to_room': {
      const findUserByIndex = startDb.findById(
        'Users',
        client_Id,
      ) as unknown as User & { id: string };
      const { data } = parsed;
      const playerId = randomUuid();
      const { indexRoom }: Room = JSON.parse(data as unknown as string);
      const findRoom = startDb.findById(
        'Rooms',
        indexRoom,
      ) as unknown as RoomState;

      const getRoomUsers = findRoom.roomUsers;
      getRoomUsers.push({
        name: findUserByIndex.name,
        index: findUserByIndex.id,
      });
      startDb.update('Rooms', indexRoom, {
        roomUsers: getRoomUsers,
      });

      findRoom.roomUsers.forEach((user) => {
        const { index } = user;
        const findUserByIndex = startDb.findById(
          'Users',
          index,
        ) as unknown as User & { id: string };

        createResponse<CreateGameResponse>(
          findUserByIndex.socket,
          'create_game',
          {
            idGame: indexRoom,
            idPlayer: playerId,
          },
        );
      });
      startDb.delete('Rooms', indexRoom);
      break;
    }
    default:
      ws.send(JSON.stringify({ error: 'Wrong type of request' }));
      sendDBContent<RoomState>(ws, 'update_room', startDb, 'Rooms', (val) => {
        return val.filter((elem) => elem.roomUsers.length === 1);
      });
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
