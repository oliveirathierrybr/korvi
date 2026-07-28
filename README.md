# Fluxo — Gestão financeira para pequenas empresas

Dashboard financeiro moderno para controlar o caixa (entradas e saídas),
contas a pagar, contas a receber e relatórios de uma pequena empresa em um
único lugar.

## Funcionalidades

- **Dashboard**: saldo atual, entradas/saídas do mês, fluxo de caixa dos
  últimos 6 meses, despesas por categoria e alertas de contas a vencer.
- **Caixa**: lançamentos de entrada e saída, com filtros por tipo, categoria
  e período.
- **Contas a Pagar / Contas a Receber**: controle de vencimentos, com baixa
  automática que gera o lançamento correspondente no caixa (sem digitar duas
  vezes).
- **Categorias**: organização própria de entradas e saídas.
- **Relatórios**: comparativo mensal, distribuição por categoria e
  exportação em CSV.
- Modo claro/escuro e layout responsivo (funciona bem no celular).

## Stack técnica

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com)
- [Prisma](https://www.prisma.io) + SQLite (banco de dados local, arquivo
  `dev.db`)
- Autenticação própria (e-mail/senha) com cookie de sessão assinado
  (`jose` + `bcryptjs`)
- Recharts para os gráficos

## Como rodar localmente

Pré-requisitos: [Node.js](https://nodejs.org) 20.9 ou superior.

```bash
# 1. Instalar dependências
npm install

# 2. Criar o banco de dados e aplicar as migrações
npx prisma migrate dev

# 3. Popular o banco com um usuário e categorias iniciais
npx prisma db seed

# 4. Rodar o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Login inicial

```
E-mail: admin@empresa.com
Senha:  mudar123
```

Troque essa senha (ou crie um novo usuário direto no banco) antes de usar em
produção.

## Build de produção

```bash
npm run build
npm run start
```

## Estrutura do projeto

```
prisma/                  Schema, migrações e seed do banco de dados
src/app/(app)/            Páginas autenticadas (dashboard, caixa, contas, etc.)
src/app/login/            Tela de login
src/components/           Componentes de UI e de cada módulo
src/lib/actions/          Server Actions (mutações do banco)
src/lib/data/             Consultas e agregações para dashboard/relatórios
src/lib/session.ts        Autenticação e cookie de sessão
src/proxy.ts               Protege as rotas autenticadas
```

## Variáveis de ambiente

Veja `.env`:

- `DATABASE_URL`: caminho do banco SQLite (padrão: `file:./dev.db`)
- `AUTH_SECRET`: chave usada para assinar o cookie de sessão. Gere uma nova
  em produção com:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
