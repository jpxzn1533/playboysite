# PlayBoy Store

Plataforma de vendas completa (loja + painel administrativo) para uma comunidade do Discord.
Visual premium em preto/branco/cinza, banco de dados real e todas as ações principais com
lógica funcional e persistência.

Stack: **Next.js 14 (App Router) · TypeScript · Prisma · SQLite · Tailwind CSS · Recharts**

---

## Como rodar localmente

```bash
npm install
npm run db:fresh   # banco limpo (dados REAIS): só categorias, sem produtos/clientes/pedidos
npm run dev
```

Acesse **http://localhost:3000**.

### Configurar seu administrador real

O banco começa **sem contas** (dados reais). Para ter acesso ao painel `/admin`:

1. Registre sua conta normalmente em **/conta** (você define sua própria senha).
2. Promova esse e-mail a administrador:
   ```bash
   npm run make-admin -- seu-email@exemplo.com
   ```
3. **Saia e entre novamente** para a sessão carregar o papel de administrador.

Depois é só usar o painel para cadastrar seus produtos reais — tudo aparece na loja
imediatamente.

### (Opcional) Dados de demonstração

Se quiser popular a loja com produtos/clientes/pedidos de exemplo para testar:

```bash
npm run db:reset   # recria o banco e insere dados de demonstração
```

> Contas demo (só nesse modo): admin@playboystore.com / admin123 ·
> cliente@playboystore.com / cliente123

---

## Variações de produto

No admin, ao criar/editar um produto, ative **"Variações"** para oferecer opções
com **preço e estoque próprios** (ex.: Nitro 1 mês / 3 meses / 1 ano, ou níveis de
VIP). Com variações ativas:

- A loja mostra **"a partir de"** no card e um **seletor de opções** na página do
  produto; preço, estoque, reserva e entrega usam a variação escolhida.
- O **estoque** é gerenciado por variação (aba Estoque mostra cada uma).
- Carrinho, pedido e entrega registram qual variação foi escolhida.

O preço/estoque "base" do produto passam a servir apenas de referência quando há
variações.

---

## Login com Google e Discord (OAuth)

Os botões **"Continuar com Google"** e **"Continuar com Discord"** aparecem
automaticamente na página `/conta` assim que você preencher as credenciais no
arquivo `.env`. Sem credenciais, ficam ocultos (o login por e-mail/senha continua
funcionando normalmente).

As URLs de callback (redirect URI) que você vai cadastrar são:

```
Local:      http://localhost:3000/api/auth/oauth/google/callback
            http://localhost:3000/api/auth/oauth/discord/callback
Produção:   https://SEU-DOMINIO/api/auth/oauth/google/callback
            https://SEU-DOMINIO/api/auth/oauth/discord/callback
```

### 1) Discord

1. Acesse https://discord.com/developers/applications → **New Application**.
2. Menu **OAuth2** → copie o **Client ID** e o **Client Secret** (Reset Secret se preciso).
3. Em **OAuth2 → Redirects**, adicione as URLs de callback do Discord acima
   (local e/ou produção) e salve.
4. Cole no `.env`:
   ```
   DISCORD_CLIENT_ID="seu_client_id"
   DISCORD_CLIENT_SECRET="seu_client_secret"
   ```

### 2) Google

1. Acesse https://console.cloud.google.com/apis/credentials (crie um projeto se
   necessário).
2. Configure a **Tela de consentimento OAuth** (External) uma vez.
3. **Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
4. Em **URIs de redirecionamento autorizados**, adicione as URLs de callback do
   Google acima (local e/ou produção).
5. Copie o **Client ID** e o **Client Secret** e cole no `.env`:
   ```
   GOOGLE_CLIENT_ID="seu_client_id"
   GOOGLE_CLIENT_SECRET="seu_client_secret"
   ```

### 3) Reinicie o servidor

```bash
npm run dev
```

Na Vercel, cadastre as mesmas variáveis em **Settings → Environment Variables**
e use a URL de callback de produção.

> Como funciona: contas criadas por Google/Discord não têm senha. Se o e-mail já
> existir, a conta é vinculada automaticamente. O login por e-mail avisa quando a
> conta é social. O primeiro admin continua sendo definido via `npm run make-admin`.

---

## Scripts

| Comando            | O que faz                                            |
| ------------------ | ---------------------------------------------------- |
| `npm run dev`      | Servidor de desenvolvimento                          |
| `npm run build`    | Build de produção (gera o Prisma Client)             |
| `npm start`        | Roda o build de produção                             |
| `npm run db:push`  | Aplica o schema ao banco                             |
| `npm run db:fresh` | Banco limpo: só categorias (dados reais, produção)   |
| `npm run make-admin -- email` | Promove um usuário existente a ADMIN      |
| `npm run db:seed`  | Popula dados de exemplo                              |
| `npm run db:reset` | Recria o banco do zero + dados de exemplo            |
| `npm run db:studio`| Abre o Prisma Studio (inspeção visual do banco)      |

---

## Estrutura

```
prisma/
  schema.prisma        Modelo de dados (usuários, produtos, carrinhos, pedidos, entregas, logs...)
  seed.ts              Catálogo inicial + carrinhos/pedidos de exemplo
src/
  app/
    (store)/           Loja: home, produtos, carrinho, checkout, pedidos, conta
    admin/             Painel: dashboard, produtos, estoque, carrinhos, vendas, clientes, logs
      actions.ts       Server actions (CRUD, estoque, entrega manual, status) + logs
    api/               Rotas de auth, carrinho e pedidos
  components/          UI, componentes da loja e do admin
  lib/                 prisma, auth (JWT + bcrypt), carrinho, queries, formatação, logs
```

## Funcionalidades principais

- **Loja**: hero, destaques, mais vendidos, novidades, categorias, catálogo com busca/filtros/ordenação, página de produto com galeria, estados de esgotado.
- **Carrinho dinâmico** (sem reload), estados vazio/carregando, toasts.
- **Pedidos**: checkout com dados de entrega, histórico "Meus pedidos", status completo.
- **Autenticação** por sessão (JWT em cookie httpOnly, senha com bcrypt): cliente e administrador.
- **Painel admin** com dashboard (faturamento, vendas, pendentes, estoque) e gráficos.
- **Gerenciamento de produtos** (criar/editar/excluir/ativar), **estoque** (ajuste em tempo real, alertas), **vendas** (filtros + detalhe + status), **clientes** (histórico).
- **Carrinhos abertos**: o admin vê todos os carrinhos ativos em tempo real, abre, edita itens.
- **Entrega manual sem pagamento**: converte um carrinho aberto em pedido `Entregue`, baixa estoque, registra admin responsável, data/hora e observação — tudo persistido e auditado.
- **Logs administrativos** de todas as ações importantes.

Toda alteração feita no admin (preço, estoque, ativar/desativar) reflete imediatamente na loja.

---

## Deploy na Vercel (produção)

SQLite não funciona bem em ambientes serverless (o disco é efêmero). Para produção use **Postgres**:

1. Crie um banco Postgres (Neon, Supabase ou Vercel Postgres).
2. Em `prisma/schema.prisma`, troque o `datasource`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Na Vercel, defina as variáveis de ambiente:
   - `DATABASE_URL` → string de conexão do Postgres
   - `AUTH_SECRET` → um segredo forte e aleatório
   - `NEXT_PUBLIC_DISCORD_INVITE` → o convite do seu Discord
4. Rode as migrações uma vez: `npx prisma db push` (e opcionalmente `npm run db:seed`).
5. O `build` já executa `prisma generate` automaticamente.

> Os campos de "enum" usam `String` no schema para serem compatíveis com SQLite e Postgres.
> Ao migrar para Postgres você pode, se quiser, convertê-los em enums nativos.

## Notas

- As imagens de exemplo vêm de `picsum.photos`. Troque pelas imagens reais dos seus produtos
  no painel (URLs por linha no formulário do produto).
- Troque `AUTH_SECRET` no `.env` antes de publicar.
