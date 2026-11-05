/** Llamadas tipadas a las funciones de servidor. Toda escritura pasa por aquí. */
import { getSupabase } from './supabase';
import { toPartyError } from './errors';
import type { Profile, RoomState } from './types';

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  try {
    const { data, error } = await getSupabase().rpc(fn, args);
    if (error) throw error;
    return data as T;
  } catch (e) {
    throw toPartyError(e);
  }
}

export const api = {
  upsertProfile: (nickname: string, avatar: string) =>
    rpc<Profile>('upsert_profile', { p_nickname: nickname, p_avatar: avatar }),

  createRoom: () => rpc<{ room_id: string; code: string }>('create_room'),

  joinRoom: (code: string) =>
    rpc<{ room_id: string; code: string; rejoined: boolean }>('join_room', { p_code: code }),

  leaveRoom: (roomId: string) => rpc<void>('leave_room', { p_room_id: roomId }),

  startGame: (roomId: string) => rpc<void>('start_game', { p_room_id: roomId }),

  restartGame: (roomId: string) => rpc<void>('restart_game', { p_room_id: roomId }),

  submitVote: (roundId: string, targetId: string) =>
    rpc<{ accepted: boolean; round_closed: boolean }>('submit_vote', {
      p_round_id: roundId,
      p_target_id: targetId,
    }),

  closeRound: (roundId: string) =>
    rpc<'closed' | 'already_closed' | 'not_ready'>('close_round', { p_round_id: roundId }),

  nextRound: (roomId: string, fromRound: number) =>
    rpc<'advanced' | 'finished' | 'already_advanced' | 'not_ready'>('next_round', {
      p_room_id: roomId,
      p_from_round: fromRound,
    }),

  getRoomState: (roomId: string) => rpc<RoomState>('get_room_state', { p_room_id: roomId }),

  async getMyProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await getSupabase()
        .from('profiles')
        .select('id, nickname, avatar')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      throw toPartyError(e);
    }
  },
};
