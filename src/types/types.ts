import { WebSocket } from 'ws';

export type CallType =
  | 'reg'
  | 'update_winners'
  | 'update_room'
  | 'create_room'
  | 'add_user_to_room'
  | 'add_ships'
  | 'start_game'
  | 'attack'
  | 'create_game'
  | 'randomAttack';

export interface WSCall<T> {
  type: CallType;

  data: T;
  id: number;
}

export interface User {
  name: string;
  password: string;
  socket: WebSocket;
}

export interface RoomState {
  roomId: string;
  roomUsers: RoomUsers[];
}

export interface RoomUsers {
  name: string;
  index: string;
}

export interface UserResponse {
  name: string;
  index: string | number;
  error?: boolean;
  errorText?: string;
}

export interface CreateGameResponse {
  idGame: number | string;
  idPlayer: number | string;
}
