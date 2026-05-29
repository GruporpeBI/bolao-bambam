# Alterações de Teste — Como Reverter

Arquivo gerado em 2026-05-29 para documentar as alterações feitas para o teste com
o jogo Nublense × Cobresal (sofascore_id: 15353058).

---

## O que foi alterado para o teste

### 1. Jogo de teste inserido no banco
- **Jogo:** Nublense × Cobresal
- **sofascore_id:** 15353058
- **Flags:** `is_brazil_game = true`, `is_enabled = true`, `predictions_early = true`

### 2. Feature `predictions_early` implementada (permanente)
- Migration 006 aplicada: coluna `predictions_early boolean DEFAULT false` na tabela `games`
- Toggle no admin → aba "Jogos" → coluna "Antecip."
- Esta feature é permanente e útil para uso futuro

### 3. `CheckInTrigger` adicionado a `/palpites` (permanente)
- Componente que dispara geolocalização ao entrar na página, mesmo sem fazer login novo
- Esta melhoria é permanente

---

## Para reverter o jogo de teste

### Opção A — via Supabase Dashboard (recomendado)
Acesse: https://supabase.com/dashboard/project/yzbsahubleskqbfmvmei/editor

Execute:
```sql
DELETE FROM public.games WHERE sofascore_id = 15353058;
```

### Opção B — via terminal
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://yzbsahubleskqbfmvmei.supabase.co',
  'SUA_SERVICE_ROLE_KEY'
);
sb.from('games').delete().eq('sofascore_id', 15353058)
  .then(({ error }) => console.log(error ?? 'Deletado'));
"
```

---

## Para zerar dados do teste (predictions, attendances, scores)

Execute no Supabase Dashboard:

```sql
-- Limpar palpites do jogo de teste
DELETE FROM public.predictions
WHERE game_id = (SELECT id FROM public.games WHERE sofascore_id = 15353058);

-- Limpar presenças do jogo de teste
DELETE FROM public.attendances
WHERE game_id = (SELECT id FROM public.games WHERE sofascore_id = 15353058);

-- Se quiser zerar TODOS os scores e recomeçar do zero:
DELETE FROM public.scores;
DELETE FROM public.predictions;
DELETE FROM public.attendances;
DELETE FROM public.tournament_predictions;
```

---

## Checklist pós-teste

- [ ] Deletar jogo de teste (sofascore_id: 15353058)
- [ ] Limpar predictions/attendances/scores de teste
- [ ] Verificar que os jogos da Copa continuam corretos
- [ ] Verificar ranking zerado (ou com dados reais)
- [ ] Confirmar que `predictions_early = false` para todos os jogos reais
