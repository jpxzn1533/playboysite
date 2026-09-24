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

## Pagamento via PIX direto (Nubank / chave PIX) — recomendado

Modo mais simples: o site gera o **QR Code + copia-e-cola** apontando direto para
a sua **chave PIX** (ex.: do Nubank). O dinheiro cai na sua conta, sem gateway e
sem taxa extra. A **confirmação é manual** (o banco não avisa o site).

Como funciona:
1. Cliente escolhe PIX e é levado à tela com o QR + copia-e-cola.
2. Ele paga no app do banco e clica em **"Já fiz o pagamento"**.
3. No admin (Vendas), o pedido mostra **"pagto informado"** — você confere no
   Nubank e muda o status para **Pago**.
4. Ao marcar como Pago, se o pedido for todo de **entregáveis** (e sem chat), a
   entrega libera automaticamente; senão, você conclui pelo atendimento.

Configuração (variáveis de ambiente — `.env` e Vercel):

```
PIX_KEY="sua-chave-pix"          # CPF, e-mail, telefone (+55...) ou chave aleatória
PIX_MERCHANT_NAME="PlayBoy Store"  # nome do recebedor (máx. 25, sem acento)
PIX_MERCHANT_CITY="Sao Paulo"      # cidade (máx. 15, sem acento)
```

> Quando `PIX_KEY` está definido, este modo tem prioridade sobre o IronPay. Não
> precisa de webhook. Depois de definir as variáveis, faça um **redeploy**.

---

## Pagamento via PIX (IronPay)

O checkout mostra o botão **"Pagar com PIX"** automaticamente quando as variáveis
da IronPay estão configuradas. Sem elas, o checkout segue no modo manual (combinar
no Discord).

Como funciona:
1. Cliente escolhe PIX no checkout e informa nome, e-mail, CPF e telefone.
2. O site gera a cobrança na IronPay e mostra **QR Code + copia-e-cola**.
3. Quando o cliente paga, a IronPay chama nosso **webhook** e o pedido é
   confirmado automaticamente.
4. Se todos os itens forem **entregáveis** (e nenhum for de chat), a entrega é
   liberada na hora. Caso contrário, o pedido fica **Pago** e a equipe conclui
   (chat/manual).

Configuração (variáveis de ambiente — no `.env` e na Vercel):

```
IRONPAY_API_TOKEN=...      # painel IronPay → configurações de API
IRONPAY_OFFER_HASH=...     # hash da OFERTA (crie 1 produto + oferta na IronPay)
IRONPAY_PRODUCT_HASH=...   # hash do PRODUTO
IRONPAY_WEBHOOK_TOKEN=...  # opcional: valida o campo "token" do postback
```

No painel da IronPay, cadastre a **URL de postback/webhook**:

```
https://SEU-DOMINIO.vercel.app/api/webhooks/ironpay
```

> A cobrança usa um único item (o total do pedido) referenciando a oferta/produto
> configurados. O valor é dinâmico (o total real do carrinho).

---

## Deploy na Vercel (produção)

O projeto já usa **PostgreSQL** e cria as tabelas + categorias automaticamente no
deploy. Você não precisa rodar nenhum comando de banco à mão.

### 1) Crie um banco Postgres (grátis)

Recomendado: **Neon** — https://neon.tech → New Project. Copie a connection string.
Use a conexão **direta** (a que NÃO tem `-pooler` no host), algo como:

```
postgresql://user:senha@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> Também funciona com Supabase ou Vercel Postgres — basta pegar a string de conexão.

### 2) Suba o código para o GitHub

O repositório já está inicializado e com o primeiro commit. Crie um repositório
vazio no GitHub e rode (troque pela URL do seu repo):

```bash
git remote add origin https://github.com/SEU_USUARIO/playboy-store.git
git push -u origin main
```

### 3) Importe na Vercel

1. https://vercel.com → **Add New → Project** → importe o repositório do GitHub.
2. Framework: **Next.js** (detectado automaticamente). Não mude o build command.
3. Em **Environment Variables**, adicione:

   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | a connection string do Postgres (passo 1) |
   | `AUTH_SECRET` | um segredo forte e aleatório (gere um novo!) |
   | `NEXT_PUBLIC_DISCORD_INVITE` | `https://discord.gg/playboystore` |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | (se usar login Google) |
   | `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | (se usar login Discord) |

4. Clique em **Deploy**. No build, o projeto cria as tabelas e as 6 categorias.

### 4) Vire administrador

O banco de produção começa vazio. **A primeira conta criada vira ADMIN
automaticamente.** Então, no site publicado:

1. Acesse `/conta` e **crie sua conta** (ou entre com Google/Discord).
2. Pronto — essa primeira conta já é administradora. Acesse `/admin`.

> Para promover outras contas depois, use `npm run make-admin -- email` apontando
> o `DATABASE_URL` para o banco de produção.

### 5) Atualize os redirects do OAuth (se usar login social)

Nos painéis do Google/Discord, adicione as URLs de callback com o **seu domínio**:

```
https://SEU-DOMINIO.vercel.app/api/auth/oauth/google/callback
https://SEU-DOMINIO.vercel.app/api/auth/oauth/discord/callback
```

### Rodando localmente (opcional)

Como o projeto agora usa Postgres, para desenvolver na sua máquina preencha
`DATABASE_URL` no `.env` com um Postgres (pode ser o mesmo do Neon ou um banco de
dev separado) e rode `npm run dev`. Para popular categorias localmente:
`npm run db:fresh`.

## Notas

- Cadastre as imagens reais dos seus produtos no painel (URLs por linha no
  formulário do produto).
- **Gere um `AUTH_SECRET` novo e forte** para produção (não reutilize o de dev).
