-- entries.mood and check_ins.mood now store the emotion id (1..N from
-- lib/emotions.ts) instead of a 1..10 rating, so the upper bound goes away.
alter table entries drop constraint if exists entries_mood_check;
alter table entries add constraint entries_mood_check check (mood is null or mood >= 1);

alter table check_ins drop constraint if exists check_ins_mood_check;
alter table check_ins add constraint check_ins_mood_check check (mood is null or mood >= 1);

-- mood_scores.valence / .energy are derived from picker coordinates on a 0..10
-- axis; widen the check to allow the 0 endpoint (corner emotions).
alter table mood_scores drop constraint if exists mood_scores_valence_check;
alter table mood_scores add constraint mood_scores_valence_check check (valence between 0 and 10);

alter table mood_scores drop constraint if exists mood_scores_energy_check;
alter table mood_scores add constraint mood_scores_energy_check check (energy between 0 and 10);
