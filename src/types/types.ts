export type CallType =
  | 'reg'
  | 'update_winners'
  | 'create_room'
  | 'add_user_to_room'
  | 'add_ships'
  | 'start_game'
  | 'attack'
  | 'randomAttack';

export interface WSCall<T> {
  type: CallType;

  data: T;
  id: number;
}

export interface User {
  name: string;
  password: string;
}

export interface UserResponse {
  name: string;
  index: string | number;
  error?: boolean;
  errorText?: string;
}
