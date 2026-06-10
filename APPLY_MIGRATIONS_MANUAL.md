# 🚀 Aplicar Migrations Manualmente no Supabase Dashboard

## Passo 1: Acessar Supabase Dashboard

1. Abra https://app.supabase.com
2. Faça login com sua conta
3. Selecione o projeto **bolao-amauri**

## Passo 2: Abrir SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query** (botão azul)

## Passo 3: Copiar e Colar as Migrations

Abra o arquivo `MIGRATIONS_APPLY.sql` neste projeto e:

1. **Selecione TODO o conteúdo** (Ctrl+A)
2. **Copie** (Ctrl+C)
3. **Cole** (Ctrl+V) no SQL Editor do Supabase

## Passo 4: Executar

1. Clique no botão **Run** (ícone de play ▶️ no topo)
2. Aguarde até ver:
   - ✅ **No errors** ou
   - ✅ **Success** na resposta

## Passo 5: Verificar que Funcionou

Ao final do arquivo `MIGRATIONS_APPLY.sql`, há 4 queries de verificação:

```sql
-- Listar schedules pg_cron
SELECT jobname, schedule, command FROM cron.job WHERE jobname LIKE 'poll-%' OR jobname LIKE 'sync-%';

-- Verificar se match_latest existe
SELECT column_name FROM information_schema.columns WHERE table_name = 'match_latest' LIMIT 5;

-- Verificar se checkin_enabled existe
SELECT column_name FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'checkin_enabled';

-- Verificar Portugal vs Nigeria
SELECT id, home_team, away_team, checkin_enabled, espn_event_id, thesportsdb_event_id FROM games WHERE sofascore_id = 16135568;
```

**Crie uma nova query e rode cada uma dessas 4 linhas separadamente.** Você deve ver:

✅ Query 1: 3 jobs (poll-thesportsdb, poll-espn, sync-agenda-with-enrichment)
✅ Query 2: Várias colunas da tabela match_latest
✅ Query 3: Uma linha com checkin_enabled = true
✅ Query 4: Portugal vs Nigeria com checkin_enabled = true

---

## Solução de Problemas

**Se receber erro "relation não existe":**
- É normal se a tabela foi recriada
- Ignore e execute o próximo comando

**Se receber erro "column already exists":**
- É ok, a migration é idempotente
- Significa que foi parcialmente aplicada antes

**Se receber erro "function cron.schedule não existe":**
- Significa que pg_cron não está habilitado no Supabase
- Contate o suporte ou verifique extensões habilitadas

---

## Próximo Passo

Após aplicar as migrations, rode:

```bash
npm run deploy  # ou vercel deploy --prod
```

Para colocar o novo código em produção que usa essas tabelas/schedules.

---

## ⏱️ Tempo Esperado

- Aplicar migrations: **1-2 minutos**
- Verificação: **30 segundos**
- Deploy: **2-3 minutos**

**Total: ~5 minutos** ✅
