# Ecossistema Seven

## Desenvolvimento

1. Instale as dependencias:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Deploy no Easypanel com Nixpacks

Configure o servico para usar Nixpacks. O projeto usa `nixpacks.toml` para instalar dependencias, gerar o build Vite e iniciar o servidor Node de producao.

Variaveis de ambiente necessarias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

O app nao precisa de navegador headless nem de `SUPABASE_SERVICE_ROLE_KEY` no Easypanel.

## Comandos uteis

```bash
npm run build
npm run typecheck
npm run lint
npm run start
```
# ecossistemasevengroupEP
