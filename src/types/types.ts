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
  | 'randomAttack'
  | 'turn';

export interface WSCall {
  type: CallType;

  data: string;
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
  socket: WebSocket;
}

export interface UserResponse {
  name: string;
  index: string | number;
  error?: boolean;
  errorText?: string;
}

export interface CreateGame {
  gameId: string;
  players: Player[];
}

export interface Ship {
  position: Cords;
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export interface Player {
  indexPlayer: string;
  ships: Ship[];
  socket?: WebSocket;
  field: number[][];
  ship_positions: shipsPositions[];
}

export type Room = {
  indexRoom: string;
};

export type AddShips = {
  gameId: string;
  ships: Ship[];
  indexPlayer: string;
};

export type Attack = {
  gameId: string;
  x: number;
  y: number;
  indexPlayer: string;
};

export type shipsPositions = {
  cords: Cords[];
  type: string;
  direction: boolean;
};

export type Cords = {
  x: number;
  y: number;
};

export type Turn = {
  currentPlayer: string;
};
