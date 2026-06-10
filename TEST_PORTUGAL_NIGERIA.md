# TEST: Portugal vs Nigeria (10/06/2026)

## Objetivo
Testar fallback + polling (NÃO enrich-ids):
1. ✅ Descoberta de jogo via Sofascore
2. ✅ Polling TDB (International Friendlies funciona)
3. ✅ Polling ESPN (mas não via fifa.world endpoint)
4. ✅ Consenso de dados
5. ✅ Atualização em tempo real
6. ❌ enrich-ids (International Friendlies não aparece em fifa.world)

**NOTA:** Este é um jogo de TESTE de fallback. Para testar enrich-ids, usar jogo da Copa 2026.

## Dados do Jogo

| Campo | Valor |
|-------|-------|
| **Data UTC** | 2026-06-10 19:45:00 |
| **Data São Paulo** | 2026-06-10 16:45:00 (UTC-3) |
| **Home Team** | Portugal (idTeam TDB: 133908) |
| **Away Team** | Nigeria (idTeam TDB: 134512) |
| **Local** | Estádio Dr. Magalhães Pessoa, Leiria |
| **Competição** | International Friendlies |
| **Liga TDB** | 4562 |
| **Season** | 2026 |
| **Round** | 18 |
| **Status** | NS (Not Started) |

## IDs Confirmados

### TheSportsDB
```
idEvent: 2464805
idAPIfootball: 1540358
URL: https://www.thesportsdb.com/api/v1/json/123/lookupevent.php?id=2464805
```

### ESPN
```
Buscar via: /sports/soccer/scoreboard?dates=20260610
Procurar por: "Portugal" vs "Nigeria"
```

### Sofascore
```
A ser descoberto por sync-agenda
(Fallback se Sofascore não encontrar)
```

## Script de Inserção

```sql
INSERT INTO public.games (
  external_id,
  sofascore_id,
  sofascore_url,
  home_team,
  away_team,
  stage,
  scheduled_at,
  is_brazil_game,
  is_enabled,
  predictions_early,
  is_final,
  ranking_visible,
  status_type,
  status_description,
  thesportsdb_event_id,
  created_at,
  updated_at
) VALUES (
  2464805,                                                                  -- external_id (TDB)
  2464805,                                                                  -- sofascore_id (teste)
  'https://www.sofascore.com/pt/football/match/portugal-nigeria',          -- sofascore_url
  'Portugal',                                                               -- home_team
  'Nigeria',                                                                -- away_team
  'friendlies',                                                             -- stage
  '2026-06-10 19:45:00+00'::timestamptz,                                  -- scheduled_at
  false,                                                                    -- is_brazil_game
  true,                                                                     -- is_enabled
  true,                                                                     -- predictions_early
  false,                                                                    -- is_final
  false,                                                                    -- ranking_visible
  'Not started',                                                            -- status_type
  'Not started',                                                            -- status_description
  '2464805',                                                                -- thesportsdb_event_id
  now(),                                                                    -- created_at
  now()                                                                     -- updated_at
)
ON CONFLICT (sofascore_id) DO UPDATE SET
  updated_at = now()
RETURNING id, sofascore_id, home_team, away_team, scheduled_at;
```

## Testes a Executar

### 1. Inserção no Banco ✅
```sql
SELECT * FROM games WHERE sofascore_id = 16135568;
```
✓ Jogo inserido com IDs: TDB 2464805, Sofascore 16135568

### 2. Auto-Enrich ❌ (Esperado falhar - não é fifa.world)
```bash
curl -X POST https://bolao-amauri.vercel.app/api/admin/enrich-ids \
  -H "x-sync-secret: bolao_sync_2026" \
  -H "Content-Type: application/json"
```
❌ Esperado: NÃO vai encontrar (International Friendlies não em fifa.world)
✓ Isso é normal - enrich-ids só funciona para Copa 2026

### 3. Polling TDB ✅
```sql
SELECT * FROM match_latest WHERE event_id = 16135568;
```
✓ Verificar se registro foi criado após poll-thesportsdb

### 4. Polling ESPN ✅
Usar endpoint correto (não fifa.world):
```bash
curl "https://site.api.espn.com/apis/site/v2/sports/soccer/summary?event=401867372"
```
✓ Deve retornar dados de Portugal vs Nigeria

### 5. Simular Resultado
```sql
UPDATE games SET
  home_score = 2,
  away_score = 1,
  ball_possession_home = 58,
  status_type = 'Finished'
WHERE sofascore_id = 16135568;
```

### 6. Verificar GameCard ✅
https://bolao-amauri.vercel.app/palpites
✓ Deve exibir: Portugal 2-1 Nigeria | 58% posse

### 7. Verificar Ranking ✅
https://bolao-amauri.vercel.app/ranking
✓ Deve atualizar em tempo real

## Status Atual

- [ ] Inserção no banco
- [ ] Auto-enrich (TDB + ESPN)
- [ ] Polling durante jogo
- [ ] Consenso de dados
- [ ] GameCard atualizado
- [ ] Ranking atualizado

## Notas Importantes

### Por que NÃO é para testar enrich-ids:
- Liga: **International Friendlies** (não é Copa do Mundo)
- ESPN endpoint `/sports/soccer/fifa.world/` **só busca Copa 2026**
- Portugal × Nigeria **não aparece em fifa.world scoreboard**
- enrich-ids **não vai encontrar este jogo**

### Propósito REAL deste jogo de teste:
1. ✅ **Testar fallback Sofascore → ESPN** (sync-agenda-with-enrichment)
2. ✅ **Testar polling de TDB** (qualquer liga funciona)
3. ✅ **Testar polling de ESPN** (via endpoint direto, não fifa.world)
4. ✅ **Testar consenso de dados**
5. ✅ **Testar GameCard + Ranking em tempo real**

### Para testar enrich-ids:
- Usar jogo **REAL da Copa 2026** (ex: Brazil vs Morocco - sofascore_id=760419)
- Esse jogo JÁ está no banco com IDs corretos
- enrich-ids funciona porque o jogo é de Copa 2026

### Ação final:
- Pode ser **deletado após testes** de fallback
- Ou **mantido para testes de polling/consenso**
- Não afeta o sistema da Copa (diferentes ligas)
