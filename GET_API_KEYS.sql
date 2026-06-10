-- Recuperar API keys armazenadas no Supabase
SELECT key, value
FROM public.app_config
WHERE key LIKE '%api%' OR key LIKE '%API%' OR key LIKE '%sports%'
ORDER BY key;

-- Se não encontrar, tente buscar TODOS os configs
SELECT * FROM public.app_config;
