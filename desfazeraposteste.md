# Desfazer Mudanças Após Teste - enrich-ids

## ⚠️ IMPORTANTE
As mudanças abaixo foram feitas para TESTAR Portugal vs Nigeria (jogo de amistoso).
Após validar que funciona, REVERTER para o comportamento original (apenas fifa.world).

---

## Mudanças Feitas no Commit `9c1dc51`

### 1. Endpoint ESPN
**ANTES (original):**
```
/sports/soccer/fifa.world/scoreboard
```

**DEPOIS (teste):**
```
/sports/soccer/all/scoreboard
```

**REVERTER PARA:**
```
/sports/soccer/fifa.world/scoreboard
```

Arquivo: `src/app/api/admin/enrich-ids/route.ts` (linha ~101)

---

### 2. Interface EspnEvent
**ANTES (original):**
```typescript
interface EspnEvent {
  id: string;
  competitions: Array<{
    date: string;
    competitors: Array<{ homeAway: string; team: { displayName: string } }>;
  }>;
}
```

**DEPOIS (teste):**
```typescript
interface EspnEvent {
  id: string;
  name?: string;           // "Nigeria at Portugal"
  shortName?: string;      // "NGA @ POR"
  date?: string;           // "2026-06-10T19:45Z"
  competitions?: Array<{
    date: string;
    competitors: Array<{ homeAway: string; team: { displayName: string } }>;
  }>;
}
```

**REVERTER PARA:** (remover name?, shortName?, date?)

Arquivo: `src/app/api/admin/enrich-ids/route.ts` (linha ~90)

---

### 3. Função findEspnEvent
**ANTES (original):**
```typescript
function findEspnEvent(game: GameRow, events: EspnEvent[]): EspnEvent | undefined {
  return events.find((e) => {
    const comp = e.competitions?.[0];
    if (!comp) return false;
    if (!datesMatch(game.scheduled_at, comp.date)) return false;
    const home = comp.competitors?.find((c) => c.homeAway === "home")?.team.displayName ?? "";
    const away = comp.competitors?.find((c) => c.homeAway === "away")?.team.displayName ?? "";
    return (
      (teamsMatch(game.home_team, home) && teamsMatch(game.away_team, away)) ||
      (teamsMatch(game.home_team, away) && teamsMatch(game.away_team, home))
    );
  });
}
```

**DEPOIS (teste):**
Usa matching por `name` e `shortName` (veja commit 9c1dc51)

**REVERTER PARA:** Código original acima

Arquivo: `src/app/api/admin/enrich-ids/route.ts` (linha ~162)

---

## Como Desfazer

### Opção 1: Revert automático (mais fácil)
```bash
git revert 9c1dc51
git push origin master
npx vercel --prod --yes
```

### Opção 2: Manual (se quiser manter histórico)
1. Abra `src/app/api/admin/enrich-ids/route.ts`
2. Reverta as 3 mudanças acima
3. Commit: `git commit -m "revert: enrich-ids volta a usar fifa.world para testes com Copa"`
4. Deploy: `npx vercel --prod --yes`

---

## Quando Desfazer?
- [ ] Após validar que Portugal vs Nigeria funciona em tempo real
- [ ] Após confirmar que ranking/gamecard atualizam corretamente
- [ ] Antes de fazer deploy final para a Copa (24/06 onwards)

## Por Que Desfazer?
O endpoint `/all/scoreboard` retorna **200+ eventos** (amistosos, qualificatórias, etc.), o que:
- ❌ Deixa mais lento (mais comparações)
- ❌ Pode dar falsos positivos (nome de times semelhante em ligas diferentes)
- ✅ Bom apenas para TESTES de amistosos como Portugal vs Nigeria

A Copa do Mundo deve usar `/fifa.world/scoreboard` (apenas ~60 eventos, mais rápido e preciso).

---

## Mudanças Adicionais - Check-in para Portugal vs Nigeria

### Migration 010: checkin_enabled
**ARQUIVO**: `supabase/migrations/010_checkin_enabled_and_deadline_fix.sql`

**ALTERAÇÕES**:
```sql
-- Adiciona coluna checkin_enabled à tabela games (default: false)
ALTER TABLE public.games ADD COLUMN checkin_enabled boolean NOT NULL DEFAULT false;

-- Habilita check-in apenas para Portugal vs Nigeria durante testes
UPDATE public.games SET checkin_enabled = true WHERE sofascore_id = 16135568;
```

**REVERTER APÓS TESTES**:
```sql
-- Remove a habilitação de check-in para Portugal vs Nigeria
UPDATE public.games SET checkin_enabled = false WHERE sofascore_id = 16135568;

-- Opcionalmente, remover a coluna completamente (deixa comentário para futura reutilização)
-- ALTER TABLE public.games DROP COLUMN checkin_enabled;
```

---

### Código: src/app/palpites/page.tsx

**ANTES (original)**:
```typescript
// Jogo do Brasil hoje para check-in
const todayBrazilGame = allEnabled.find(
  (g) => g.is_brazil_game && gameDayBrasilia(g.scheduled_at) === today
) ?? null;
```

**DEPOIS (teste)**:
```typescript
// Jogo com check-in habilitado hoje para check-in
const todayCheckinGame = allEnabled.find(
  (g) => g.checkin_enabled && gameDayBrasilia(g.scheduled_at) === today
) ?? null;
```

**REVERTER PARA**: código original acima (ou manter novo — permite flexibilidade futura)

---

### Código: src/app/palpites/page.tsx - GameCard props

**ANTES (original)**:
```typescript
isGameDay={isPredictionDay && !!(game as { is_brazil_game?: boolean }).is_brazil_game}
```

**DEPOIS (teste)**:
```typescript
const checkinEnabled = !!(game as { checkin_enabled?: boolean }).checkin_enabled;
return (
  <GameCard
    ...
    isGameDay={isPredictionDay && checkinEnabled}
    ...
  />
);
```

**REVERTER PARA**: código original acima (ou manter novo — permite check-in flexível)

---

### Código: src/app/palpites/actions.ts - Deadline bug fix

**ANTES (BUG)**:
```typescript
const playedBrazilGames = brazilGames.filter(
  (g) => new Date(g.scheduled_at) <= new Date()
);

if (playedBrazilGames.length >= 3) {
  return { success: false, error: "..." };
}
```

**PROBLEMA**: Bloqueava palpites assim que **3+ jogos começavam**, não quando **3+ jogos terminavam**.

**DEPOIS (CORRIGIDO)**:
```typescript
const finishedBrazilGames = brazilGames.filter(
  (g) => g.home_score != null && g.away_score != null
);

if (finishedBrazilGames.length >= 3) {
  return { success: false, error: "..." };
}
```

**REVERTER?**: NÃO — Este é um bug fix genuíno que deve ficar!

---

## Mudanças Adicionais - Jogos de teste (amistosos)

### Jogo de teste: Bolivia vs Algeria (sofascore 16288573)
Inserido via DB em 10/06/2026 para testar polling cross-source + check-in.
Amistoso (não é Copa), kickoff 2026-06-11 00:00 UTC.
IDs: tdb=2479816, espn=401874117 (fifa.friendly).

**REVERTER APÓS TESTES:**
```sql
-- Desabilita check-in do jogo de teste
UPDATE public.games SET checkin_enabled = false WHERE sofascore_id = 16288573;

-- Opcional: desabilitar/remover o jogo de teste completamente
-- UPDATE public.games SET is_enabled = false WHERE sofascore_id = 16288573;
-- DELETE FROM public.games WHERE sofascore_id = 16288573;
```
Os crons `gcron-tdb-<id>`/`gcron-espn-<id>` são auto-removidos pelo
`refresh_game_crons()` no dia seguinte (jogo sai da janela).

---

## Checkpoint Final

Após desfazer, confirme que:
- ❌ Portugal vs Nigeria (16135568) tem `checkin_enabled = false` no banco
- ❌ Bolivia vs Algeria (16288573) tem `checkin_enabled = false` (e/ou is_enabled=false) no banco
- ❌ Portugal vs Nigeria não aparece em enrich-ids (esperado - não é Copa)
- ✅ Brazil vs Morocco (760419) continua aparecendo e funcionando
- ✅ Polling de TDB continua funcionando (não foi alterado)
- ✅ Deadline bug fix permanece implementado (permitir palpites de torneio até 3+ jogos TERMINAREM)
