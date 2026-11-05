/** Catálogo de avatares. Los ids deben coincidir con pv_valid_avatar() en SQL. */
export interface AvatarDef {
  id: string;
  emoji: string;
  color: string;
}

export const AVATARS: readonly AvatarDef[] = [
  { id: 'astro', emoji: '🧑‍🚀', color: '#22D3EE' },
  { id: 'alien', emoji: '👽', color: '#34D399' },
  { id: 'robot', emoji: '🤖', color: '#8B5CF6' },
  { id: 'ghost', emoji: '👻', color: '#E0E7FF' },
  { id: 'fox', emoji: '🦊', color: '#FB923C' },
  { id: 'cat', emoji: '🐱', color: '#FBBF24' },
  { id: 'dragon', emoji: '🐲', color: '#4ADE80' },
  { id: 'unicorn', emoji: '🦄', color: '#F472B6' },
  { id: 'ninja', emoji: '🥷', color: '#A78BFA' },
  { id: 'wizard', emoji: '🧙', color: '#818CF8' },
  { id: 'rocket', emoji: '🚀', color: '#F87171' },
  { id: 'planet', emoji: '🪐', color: '#FCD34D' },
  { id: 'bolt', emoji: '⚡', color: '#FDE047' },
  { id: 'gem', emoji: '💎', color: '#67E8F9' },
  { id: 'crown', emoji: '👑', color: '#FACC15' },
  { id: 'dj', emoji: '🎧', color: '#F472B6' },
];

const BY_ID = new Map(AVATARS.map((a) => [a.id, a]));

export function avatarFor(id: string): AvatarDef {
  return BY_ID.get(id) ?? AVATARS[0];
}
