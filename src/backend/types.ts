/** Tipos de lo que devuelven las funciones de servidor (ver migraciones SQL). */

export type RoomStatus = 'lobby' | 'playing' | 'finished' | 'closed';
export type RoundPhase = 'voting' | 'reveal';

export interface Profile {
  id: string;
  nickname: string;
  avatar: string;
}

export interface PlayerState {
  user_id: string;
  nickname: string;
  avatar: string;
  score: number;
  is_active: boolean;
  is_host: boolean;
  has_voted: boolean;
}

export interface RoundResults {
  tallies: Record<string, number>;
  top: string[];
  max_votes: number;
  points: Record<string, number>;
  votes: { voter: string; target: string }[];
  cancelled?: boolean;
}

export interface RoundState {
  id: string;
  round_no: number;
  question: string;
  phase: RoundPhase;
  started_at: string;
  deadline: string;
  revealed_at: string | null;
  votes_cast: number;
  my_vote: string | null;
  results: RoundResults | null;
}

export interface RoomState {
  server_now: string;
  me: string;
  room: {
    id: string;
    code: string;
    host_id: string;
    status: RoomStatus;
    game_mode: string;
    game_no: number;
    current_round: number;
    total_rounds: number;
    vote_seconds: number;
    reveal_seconds: number;
    version: number;
  };
  players: PlayerState[];
  round: RoundState | null;
}
