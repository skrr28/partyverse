import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '@/backend/api';
import { toPartyError, type PartyError } from '@/backend/errors';
import type { PlayerState } from '@/backend/types';
import { PlayerAvatar } from '@/players/PlayerAvatar';
import { canVoteFor } from '@/scoring/mostLikely';
import { Banner, Body, Card, NeonButton, NeonTitle } from '@/ui/components';
import { colors, glow, radius, space } from '@/ui/theme';
import type { MinigameProps } from '../types';

export function MostLikelyGame(props: MinigameProps) {
  const round = props.state.round;
  if (!round) return null;
  return round.phase === 'voting' ? <VotingView {...props} /> : <RevealView {...props} />;
}

function RoundHeader({ props, color }: { props: MinigameProps; color: string }) {
  const { room, round } = props.state;
  return (
    <View style={styles.roundHeader}>
      <Text style={[styles.roundLabel, { color }]}>
        RONDA {round?.round_no} / {room.total_rounds}
      </Text>
      <NeonTitle color={color} style={styles.question}>
        {round?.question}
      </NeonTitle>
    </View>
  );
}

function TimerBar({ leftMs, totalSec, color }: { leftMs: number; totalSec: number; color: string }) {
  const pct = Math.max(0, Math.min(1, leftMs / (totalSec * 1000)));
  const secs = Math.ceil(leftMs / 1000);
  return (
    <View accessibilityLabel={`Quedan ${secs} segundos`}>
      <View style={styles.timerTrack}>
        <View style={[styles.timerFill, { width: `${pct * 100}%`, backgroundColor: secs <= 5 ? colors.pink : color }]} />
      </View>
      <Text style={[styles.timerText, secs <= 5 && { color: colors.pink }]}>{secs > 0 ? `${secs}s` : 'Cerrando…'}</Text>
    </View>
  );
}

function VotingView(props: MinigameProps) {
  const { state, voteLeftMs, refresh } = props;
  const round = state.round!;
  const me = state.me;
  const active = state.players.filter((p) => p.is_active);
  const candidates = active.filter((p) => p.user_id !== me);
  const iAmActive = active.some((p) => p.user_id === me);

  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<PartyError | null>(null);

  // Nueva ronda => limpiar selección.
  useEffect(() => {
    setSelected(null);
    setError(null);
  }, [round.id]);

  const myVote = round.my_vote;
  const votedFor = state.players.find((p) => p.user_id === myVote);
  const timeUp = voteLeftMs <= 0;

  const submit = async () => {
    if (!selected) return;
    const check = canVoteFor(me, selected, active.map((p) => p.user_id), !!myVote);
    if (!check.ok) {
      setError(toPartyError({ message: `PV_${check.reason}` }));
      return;
    }
    setSending(true);
    setError(null);
    try {
      await api.submitVote(round.id, selected);
      refresh();
    } catch (e) {
      const err = toPartyError(e);
      setError(err);
      if (err.code === 'PV_ALREADY_VOTED' || err.code === 'PV_ROUND_CLOSED') refresh();
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ gap: space.md }}>
      <RoundHeader props={props} color={colors.cyan} />
      <TimerBar leftMs={voteLeftMs} totalSec={state.room.vote_seconds} color={colors.cyan} />

      {myVote ? (
        <Card accent={colors.violet} style={styles.votedCard}>
          <Body style={{ textAlign: 'center' }}>Tu voto secreto: {votedFor?.nickname ?? '—'} 🤫</Body>
          <Body muted style={{ textAlign: 'center' }}>
            {round.votes_cast} de {active.length} votos · esperando al resto
          </Body>
        </Card>
      ) : !iAmActive ? (
        <Banner kind="info" text="Estás como espectador en esta ronda." />
      ) : (
        <>
          <Body muted>Elige a una persona. Nadie verá tu voto hasta la revelación.</Body>
          <View style={styles.grid}>
            {candidates.map((p) => (
              <CandidateTile
                key={p.user_id}
                player={p}
                selected={selected === p.user_id}
                disabled={timeUp || sending}
                onPress={() => setSelected(p.user_id)}
              />
            ))}
          </View>
          {error ? <Banner text={error.message} /> : null}
          <NeonButton
            label={timeUp ? 'Tiempo agotado' : selected ? 'Confirmar voto' : 'Selecciona a alguien'}
            onPress={submit}
            disabled={!selected || timeUp}
            loading={sending}
          />
        </>
      )}

      <VoteProgress players={active} />
    </View>
  );
}

function CandidateTile({
  player,
  selected,
  disabled,
  onPress,
}: {
  player: PlayerState;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`Votar por ${player.nickname}`}
      style={[
        styles.tile,
        selected && { borderColor: colors.pink, boxShadow: glow(colors.pink, 16), backgroundColor: colors.surfaceHigh },
      ]}
    >
      <PlayerAvatar avatar={player.avatar} size={52} />
      <Text style={styles.tileName} numberOfLines={1}>
        {player.nickname}
      </Text>
    </Pressable>
  );
}

function VoteProgress({ players }: { players: PlayerState[] }) {
  return (
    <View style={styles.progressRow} accessibilityLabel="Quién ha votado">
      {players.map((p) => (
        <View key={p.user_id} style={{ alignItems: 'center', gap: 2 }}>
          <PlayerAvatar avatar={p.avatar} size={30} dimmed={!p.has_voted} />
          <Text style={[styles.progressMark, { color: p.has_voted ? colors.success : colors.muted }]}>
            {p.has_voted ? '✓' : '…'}
          </Text>
        </View>
      ))}
    </View>
  );
}

function RevealView(props: MinigameProps) {
  const { state, revealLeftMs, refresh } = props;
  const round = state.round!;
  const results = round.results;
  const isHost = state.room.host_id === state.me;
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<PartyError | null>(null);

  const byId = new Map(state.players.map((p) => [p.user_id, p]));
  const tallies = results?.tallies ?? {};
  const top = new Set(results?.top ?? []);
  const ranked = Object.entries(tallies).sort((a, b) => b[1] - a[1]);
  const maxVotes = Math.max(1, results?.max_votes ?? 1);
  const myPoints = results?.points?.[state.me] ?? 0;
  const myTarget = results?.votes?.find((v) => v.voter === state.me)?.target;
  const isLast = state.room.current_round >= state.room.total_rounds;

  const advance = async () => {
    setAdvancing(true);
    setError(null);
    try {
      await api.nextRound(state.room.id, state.room.current_round);
      refresh();
    } catch (e) {
      setError(toPartyError(e));
    } finally {
      setAdvancing(false);
    }
  };

  const topNames = [...top].map((id) => byId.get(id)?.nickname ?? '?');

  return (
    <View style={{ gap: space.md }}>
      <RoundHeader props={props} color={colors.pink} />

      <Card accent={colors.pink} style={{ alignItems: 'center', gap: space.sm }}>
        {topNames.length === 0 ? (
          <Body style={{ textAlign: 'center' }}>Nadie votó en esta ronda 😶</Body>
        ) : (
          <>
            <Text style={styles.revealKicker}>{topNames.length > 1 ? '¡EMPATE!' : 'LA MÁS VOTADA ES…'}</Text>
            <View style={styles.winnersRow}>
              {[...top].map((id) => (
                <PlayerAvatar key={id} avatar={byId.get(id)?.avatar ?? ''} size={64} />
              ))}
            </View>
            <NeonTitle color={colors.pink} style={{ textAlign: 'center' }}>
              {topNames.join(' · ')}
            </NeonTitle>
          </>
        )}
      </Card>

      <View style={{ gap: space.sm }}>
        {ranked.map(([id, count]) => {
          const p = byId.get(id);
          return (
            <View key={id} style={styles.barRow}>
              <PlayerAvatar avatar={p?.avatar ?? ''} size={32} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.barName}>{p?.nickname ?? '?'}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${(count / maxVotes) * 100}%`, backgroundColor: top.has(id) ? colors.pink : colors.violet },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          );
        })}
      </View>

      <Card style={{ alignItems: 'center' }}>
        <Text style={[styles.points, { color: myPoints > 0 ? colors.success : colors.muted }]}>
          {myTarget ? `+${myPoints} puntos` : 'No votaste: +0'}
        </Text>
        {myTarget ? (
          <Body muted>
            {top.has(myTarget) ? '¡Acertaste con la mayoría! (+100 voto, +50 extra)' : 'Voto válido (+100)'}
          </Body>
        ) : null}
      </Card>

      {error ? <Banner text={error.message} /> : null}
      {isHost ? (
        <NeonButton
          label={isLast ? 'Ver clasificación final' : 'Siguiente ronda'}
          onPress={advance}
          loading={advancing}
        />
      ) : null}
      <Body muted style={{ textAlign: 'center' }}>
        {revealLeftMs > 0
          ? `${isLast ? 'Clasificación' : 'Siguiente ronda'} en ${Math.ceil(revealLeftMs / 1000)}s`
          : 'Continuando…'}
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  roundHeader: { gap: space.sm },
  roundLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 3 },
  question: { fontSize: 24, lineHeight: 31 },
  timerTrack: { height: 10, borderRadius: radius.pill, backgroundColor: colors.surface, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: radius.pill },
  timerText: { color: colors.muted, fontWeight: '800', marginTop: 4, textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '31%',
    flexGrow: 1,
    minWidth: 96,
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tileName: { color: colors.text, fontWeight: '800', fontSize: 14, maxWidth: '90%' },
  votedCard: { gap: space.xs, paddingVertical: space.lg },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center', marginTop: space.sm },
  progressMark: { fontSize: 12, fontWeight: '900' },
  revealKicker: { color: colors.muted, fontWeight: '900', letterSpacing: 3, fontSize: 13 },
  winnersRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', justifyContent: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  barName: { color: colors.text, fontWeight: '700' },
  barTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surface, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill },
  barCount: { color: colors.text, fontWeight: '900', fontSize: 18, width: 28, textAlign: 'right' },
  points: { fontSize: 28, fontWeight: '900' },
});
