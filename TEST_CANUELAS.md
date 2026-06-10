# Teste de Funcionalidade: Cañuelas × General Lamadrid

**Data:** 2026-06-10 | **SofaScore ID:** 16300515  
**Objetivo:** Validar fluxo completo de sincronização de resultado + cálculo de pontuação

---

## ✅ Status da Implementação

### Fase 1: Inserção do Jogo
- [ ] Jogo inserido no banco com `sofascore_id = 16300515`
- [ ] Flags ativadas: `is_enabled=true`, `predictions_early=true`

### Fase 2: Validação de API
- [x] **API SofaScore respondeu:** ✅ Status "Not started" (código 0)
  - Home: Cañuelas Reserve
  - Away: General Lamadrid Reserve
  - Start: 2026-06-10 17:00 UTC (timestamp: 1781110800)
  
- [x] **Estatísticas (antes do jogo):** ✅ 404 esperado (normal)

### Fase 3: Sincronização de Resultado (pendente)
- [ ] Inserir resultado manualmente: Home 2, Away 1
- [ ] Testar `/api/sync-result` endpoint
- [ ] Verificar `match_latest` atualizado
- [ ] Verificar `games.home_score` atualizado

### Fase 4: Cálculo de Pontuação (pendente)
- [ ] Rodar `recalculateScores()`
- [ ] Verificar tabela `scores` atualizada

---

## 🔄 Fluxo de Sincronização

```
SofaScore API (ID: 16300515)
    ↓
Poller busca: /event/16300515 + /incidents + /statistics
    ↓
match_latest, match_snapshots (histórico)
    ↓
/api/sync-result → UPDATE games SET home_score, away_score, ball_possession_home
    ↓
recalculateScores() → UPDATE scores
```

---

## SQL para Inserção (PENDENTE)

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
  status_description
) VALUES (
  16300515,
  16300515,
  'https://www.sofascore.com/pt/football/match/canuelas-reserve-general-lamadrid-reserve/vagdsEagd#id:16300515',
  'Cañuelas Reserve',
  'General Lamadrid Reserve',
  'group',
  '2026-06-10 17:00:00+00',
  false,
  true,
  true,
  false,
  false,
  'Not started',
  'Not started'
)
ON CONFLICT (sofascore_id) DO NOTHING;
```

---

## 🧪 Testes Executados

### 1. Verificação de API
```
✅ GET https://api.sofascore.com/api/v1/event/16300515
   Status: 200 OK
   Response: home_team=Cañuelas, away_team=General Lamadrid, status=Not started
```

### 2. Verificação de Estatísticas (antes do jogo)
```
✅ GET https://api.sofascore.com/api/v1/event/16300515/statistics
   Status: 404 OK (esperado - jogo não iniciado)
```

---

## 🔙 Como Reverter

### Deletar jogo de teste
```sql
DELETE FROM public.games WHERE sofascore_id = 16300515;
```

### Limpar dados associados
```sql
DELETE FROM public.predictions 
WHERE game_id = (SELECT id FROM public.games WHERE sofascore_id = 16300515);

DELETE FROM public.attendances 
WHERE game_id = (SELECT id FROM public.games WHERE sofascore_id = 16300515);
```

---

## 📋 Próximos Passos

1. Confirmar inserção no Supabase Dashboard
2. Criar palpites de teste (se usuarios existirem)
3. Simular resultado: `Home 2-1 Away` + `Possession 55%`
4. Verificar sincronização automática via `/api/sync-result`
5. Validar recalculation de scores
6. Documentar resultado final
