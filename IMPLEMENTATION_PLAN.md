# IMPLEMENTATION PLAN — Palmital Digital

> **Status:** Fase 1 (MVP) em andamento  
> **Stack:** Turborepo · TypeScript · NestJS · React (Vite) · PostgreSQL · Prisma · Socket.io · Docker

---

## 1. Visão Geral do Sistema

Palmital Digital é um ecossistema digital mobile-first para cidades pequenas. Opera como uma plataforma integrada com feed social, classificados, perfis empresariais e mensageria — tudo em uma única experiência.

### Módulos Principais

| Módulo | Descrição | Status |
|---|---|---|
| **Feed** | Timeline unificada com posts sociais, classificados e publicações de empresas | Fase 1 |
| **Classificados** | Compra e venda entre usuários com categorias e mídia | Fase 1 |
| **Empresas** | Perfil público de estabelecimentos com catálogo de produtos | Fase 2 |
| **Chat** | Mensageria local em tempo real entre usuários | Fase 1 |
| **Serviços** | Delivery, corridas, agendamentos (futuro) | Fase 3 |

### Princípios Arquiteturais

- **Mobile-first:** layout projetado para telas 375px+
- **Offline-tolerant:** cache local com React Query, sincronização na reconexão
- **Modular:** cada domínio é independente, acoplado por contratos de tipo
- **Realtime seletivo:** WebSocket apenas para chat e notificações, feed via polling

---

## 2. Arquitetura do Monorepo (Turborepo)

```
palmital-digital/
├── apps/
│   ├── web/                    # React + Vite (frontend)
│   └── api/                    # NestJS (backend)
├── packages/
│   ├── ui/                     # Componentes compartilhados (shadcn base)
│   ├── types/                  # Tipos TypeScript compartilhados
│   ├── config/
│   │   ├── eslint/             # Configs ESLint compartilhadas
│   │   ├── tsconfig/           # tsconfig base
│   │   └── prettier/           # Config Prettier
│   └── utils/                  # Funções utilitárias (formatação, validação)
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── Dockerfile.*
├── turbo.json
├── package.json                # Root workspace
└── .env.example
```

### Responsabilidades por Pacote

**`apps/web`**
- SPA React com Vite
- Roteamento com React Router v6
- Estado global: Zustand (auth, UI)
- Estado servidor: React Query v5
- Estilização: Tailwind CSS

**`apps/api`**
- NestJS modular (um módulo por domínio)
- Guards JWT globais com rotas públicas anotadas
- WebSocket gateway isolado (`ChatGateway`)
- Upload de mídia com Multer
- Validação com `class-validator` + `class-transformer`

**`packages/types`**
- DTOs espelhados (request/response)
- Enums compartilhados (`PostType`, `UserRole`, `MessageStatus`)
- Interfaces de entidade (sem dependência de ORM)

**`packages/ui`**
- Componentes atômicos: `Button`, `Input`, `Avatar`, `Card`, `Modal`, `Spinner`
- Sem lógica de negócio, sem chamadas de API
- Exporta apenas componentes puros com props tipadas

**`packages/utils`**
- `formatDate`, `formatCurrency`, `truncateText`
- `slugify`, `generateInitials`
- Validadores puros (sem framework)

---

## 3. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                      Browser / PWA                       │
│                   apps/web (React + Vite)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │   Feed   │  │Classif.  │  │Empresas  │  │  Chat  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │              │              │             │WS     │
└───────┼──────────────┼──────────────┼─────────────┼──────┘
        │  REST/JSON   │              │             │Socket.io
┌───────▼──────────────▼──────────────▼─────────────▼──────┐
│                   apps/api (NestJS)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐   │
│  │PostModule│  │ClassifMod│  │CompanyMod│  │ChatMod │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘   │
│       └──────────────┴──────────────┴─────────────┘       │
│                         PrismaService                      │
└───────────────────────────────┬───────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     PostgreSQL 15        │
                    └─────────────────────────┘
```

### Organização por Módulos (DDD leve)

Cada módulo NestJS encapsula:
```
modules/
└── post/
    ├── post.module.ts
    ├── post.controller.ts
    ├── post.service.ts
    ├── post.repository.ts      # Abstração sobre Prisma
    ├── dto/
    │   ├── create-post.dto.ts
    │   └── post-response.dto.ts
    └── guards/                 # Guards específicos do módulo
```

### Comunicação Frontend ↔ Backend

- **REST:** todas as operações CRUD
- **WebSocket (Socket.io):** eventos de chat em tempo real
- **Autenticação:** Bearer JWT em todos os endpoints REST; handshake WS com token no header

---

## 4. Modelagem do Banco de Dados (Prisma)

```prisma
// packages/types/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────

enum UserRole {
  USER
  BUSINESS_OWNER
  ADMIN
}

enum PostType {
  SOCIAL
  CLASSIFIED
  BUSINESS
}

enum ClassifiedStatus {
  ACTIVE
  SOLD
  PAUSED
  EXPIRED
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
}

enum MediaType {
  IMAGE
  VIDEO
}

// ─── User & Profile ──────────────────────────────────────

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  phone        String?   @unique
  passwordHash String
  role         UserRole  @default(USER)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  profile      Profile?
  company      Company?
  posts        Post[]
  classifieds  Classified[]
  sentMessages     Message[]       @relation("SentMessages")
  conversations    ConversationParticipant[]
  mediaUploads     Media[]

  @@index([email])
  @@index([phone])
}

model Profile {
  id          String   @id @default(cuid())
  userId      String   @unique
  displayName String
  bio         String?
  avatarUrl   String?
  city        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─── Company ─────────────────────────────────────────────

model Company {
  id          String   @id @default(cuid())
  ownerId     String   @unique
  name        String
  slug        String   @unique
  description String?
  logoUrl     String?
  coverUrl    String?
  phone       String?
  address     String?
  city        String?
  category    String?
  isVerified  Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner    User      @relation(fields: [ownerId], references: [id])
  posts    Post[]
  products Product[]

  @@index([slug])
  @@index([city])
}

// ─── Post (Feed unificado) ───────────────────────────────

model Post {
  id          String   @id @default(cuid())
  authorId    String
  companyId   String?
  type        PostType @default(SOCIAL)
  content     String?
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  author     User       @relation(fields: [authorId], references: [id])
  company    Company?   @relation(fields: [companyId], references: [id])
  classified Classified?
  media      Media[]

  @@index([authorId])
  @@index([type])
  @@index([createdAt(sort: Desc)])
}

// ─── Classified ──────────────────────────────────────────

model Classified {
  id          String           @id @default(cuid())
  postId      String           @unique
  authorId    String
  title       String
  description String
  price       Decimal?         @db.Decimal(10, 2)
  isFree      Boolean          @default(false)
  status      ClassifiedStatus @default(ACTIVE)
  categoryId  String?
  city        String?
  expiresAt   DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  post     Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  author   User      @relation(fields: [authorId], references: [id])
  category Category? @relation(fields: [categoryId], references: [id])

  @@index([authorId])
  @@index([status])
  @@index([categoryId])
  @@index([city])
}

// ─── Product (Catálogo de Empresa) ───────────────────────

model Product {
  id          String   @id @default(cuid())
  companyId   String
  name        String
  description String?
  price       Decimal? @db.Decimal(10, 2)
  imageUrl    String?
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company Company @relation(fields: [companyId], references: [id])

  @@index([companyId])
}

// ─── Category ────────────────────────────────────────────

model Category {
  id         String  @id @default(cuid())
  name       String  @unique
  slug       String  @unique
  iconName   String?
  parentId   String?

  parent     Category?    @relation("SubCategories", fields: [parentId], references: [id])
  children   Category[]   @relation("SubCategories")
  classifieds Classified[]

  @@index([slug])
}

// ─── Media ───────────────────────────────────────────────

model Media {
  id        String    @id @default(cuid())
  postId    String?
  uploaderId String
  url       String
  type      MediaType @default(IMAGE)
  mimeType  String?
  sizeBytes Int?
  width     Int?
  height    Int?
  createdAt DateTime  @default(now())

  post     Post? @relation(fields: [postId], references: [id], onDelete: SetNull)
  uploader User  @relation(fields: [uploaderId], references: [id])

  @@index([postId])
  @@index([uploaderId])
}

// ─── Chat ────────────────────────────────────────────────

model Conversation {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  participants ConversationParticipant[]
  messages     Message[]

  @@index([updatedAt(sort: Desc)])
}

model ConversationParticipant {
  id             String   @id @default(cuid())
  conversationId String
  userId         String
  joinedAt       DateTime @default(now())
  lastReadAt     DateTime?

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id])

  @@unique([conversationId, userId])
  @@index([userId])
}

model Message {
  id             String        @id @default(cuid())
  conversationId String
  senderId       String
  content        String
  status         MessageStatus @default(SENT)
  createdAt      DateTime      @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User         @relation("SentMessages", fields: [senderId], references: [id])

  @@index([conversationId])
  @@index([createdAt])
}
```

---

## 5. Sistema de Feed

### Estrutura do Feed Unificado

O feed é uma query única na tabela `Post` que retorna itens de todos os tipos (`SOCIAL`, `CLASSIFIED`, `BUSINESS`) ordenados por `createdAt DESC`.

```typescript
// post.service.ts — getFeed()
async getFeed(page: number, limit: number) {
  return this.prisma.post.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      author: { include: { profile: true } },
      company: true,
      classified: { include: { category: true } },
      media: true,
    },
  });
}
```

### Tipos de Post no Feed

| Tipo | Origem | Card no Frontend |
|---|---|---|
| `SOCIAL` | Usuário comum | Avatar + texto + mídia |
| `CLASSIFIED` | Usuário — anúncio | Thumb + título + preço |
| `BUSINESS` | Empresa | Logo + conteúdo + badge empresa |

### Estratégia de Ordenação

- **Fase 1:** Cronológica reversa simples (`createdAt DESC`)
- **Fase 2:** Score composto: `score = (likes * 2 + comments) / (hoursAge ^ 1.5)` — implementado via view materializada ou campo `trendingScore` atualizado por job
- Sem algoritmo de IA ou ML nas primeiras fases

### Paginação

Cursor-based para performance:

```typescript
// GET /posts/feed?cursor=<last_post_id>&limit=20
where: {
  createdAt: { lt: cursorPost.createdAt },
  isPublished: true,
}
```

---

## 6. API (Backend)

Base URL: `/api/v1`

Autenticação: `Authorization: Bearer <jwt_token>` (exceto rotas marcadas como públicas)

### 6.1 Auth

```
POST   /auth/register        — Criar conta
POST   /auth/login           — Login, retorna { accessToken, refreshToken }
POST   /auth/refresh         — Renovar token
POST   /auth/logout          — Invalidar refresh token
```

**POST /auth/register**
```json
// Request
{
  "email": "user@email.com",
  "password": "Min8chars",
  "displayName": "João Silva",
  "phone": "+5544999999999"
}

// Response 201
{
  "accessToken": "eyJ...",
  "user": { "id": "...", "email": "...", "role": "USER" }
}
```

### 6.2 Users

```
GET    /users/me             — Perfil autenticado
PATCH  /users/me             — Atualizar perfil
POST   /users/me/avatar      — Upload avatar (multipart/form-data)
GET    /users/:id            — Perfil público (sem dados sensíveis)
```

### 6.3 Posts (Feed)

```
POST   /posts                — Criar post
GET    /posts/feed           — Feed paginado (?cursor=&limit=20)
GET    /posts/:id            — Detalhe do post
DELETE /posts/:id            — Deletar (owner ou admin)
```

**POST /posts** (Social)
```json
{
  "type": "SOCIAL",
  "content": "Boa tarde Palmital! ☀️",
  "mediaIds": ["media_id_1", "media_id_2"]
}
```

**POST /posts** (Classified — cria Post + Classified atomicamente)
```json
{
  "type": "CLASSIFIED",
  "content": "Vendo bicicleta seminova",
  "classified": {
    "title": "Bicicleta Caloi aro 26",
    "description": "Muito conservada, pouco uso",
    "price": 350.00,
    "categoryId": "cat_veiculos_id",
    "city": "Palmital"
  },
  "mediaIds": ["media_id_1"]
}
```

### 6.4 Classifieds

```
GET    /classifieds          — Lista (?category=&city=&status=ACTIVE&cursor=)
GET    /classifieds/:id      — Detalhe
PATCH  /classifieds/:id      — Atualizar (owner)
PATCH  /classifieds/:id/status — Alterar status { status: "SOLD" }
DELETE /classifieds/:id      — Remover (owner ou admin)
```

### 6.5 Companies

```
POST   /companies            — Criar empresa (role deve ser USER, upgrada para BUSINESS_OWNER)
GET    /companies            — Lista (?city=&category=&cursor=)
GET    /companies/:slug      — Perfil público da empresa
PATCH  /companies/:slug      — Atualizar (owner)
POST   /companies/:slug/logo — Upload logo
GET    /companies/:slug/products — Catálogo
POST   /companies/:slug/products — Adicionar produto (owner)
PATCH  /companies/:slug/products/:id — Editar produto
DELETE /companies/:slug/products/:id — Remover produto
```

### 6.6 Media

```
POST   /media/upload         — Upload de arquivo, retorna { id, url }
DELETE /media/:id            — Remover (owner)
```

Upload retorna `mediaId` antes da criação do post — o frontend faz upload da mídia primeiro, depois cria o post com os IDs.

### 6.7 Chat

```
GET    /chat/conversations            — Lista de conversas do usuário
POST   /chat/conversations            — Iniciar conversa { recipientId }
GET    /chat/conversations/:id        — Detalhe + últimas mensagens
GET    /chat/conversations/:id/messages — Histórico paginado (?cursor=)
```

Envio de mensagem **exclusivamente via WebSocket** (ver Seção 7).

### Padrão de Resposta de Erro

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Must be a valid email" }
  ]
}
```

---

## 7. Sistema de Chat (Realtime)

### Conexão WebSocket

```typescript
// Cliente
import { io } from 'socket.io-client';

const socket = io('wss://api.palmital.digital', {
  auth: { token: accessToken },
  transports: ['websocket'],
});
```

### Eventos

#### Cliente → Servidor

| Evento | Payload | Descrição |
|---|---|---|
| `join_conversation` | `{ conversationId }` | Entrar na sala da conversa |
| `leave_conversation` | `{ conversationId }` | Sair da sala |
| `send_message` | `{ conversationId, content }` | Enviar mensagem |
| `mark_read` | `{ conversationId }` | Marcar mensagens como lidas |
| `typing_start` | `{ conversationId }` | Indicador de digitação |
| `typing_stop` | `{ conversationId }` | Parar indicador |

#### Servidor → Cliente

| Evento | Payload | Descrição |
|---|---|---|
| `new_message` | `Message` | Nova mensagem recebida |
| `message_status` | `{ messageId, status }` | Confirmação de entrega/leitura |
| `user_typing` | `{ userId, conversationId }` | Alguém digitando |
| `user_stopped_typing` | `{ userId, conversationId }` | Parou de digitar |

### Implementação Gateway (NestJS)

```typescript
// chat.gateway.ts
@WebSocketGateway({ namespace: '/chat', cors: true })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    const user = await this.authService.validateWsToken(
      client.handshake.auth.token,
    );
    if (!user) return client.disconnect();
    client.data.userId = user.id;
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const message = await this.chatService.saveMessage({
      conversationId: dto.conversationId,
      senderId: client.data.userId,
      content: dto.content,
    });

    this.server
      .to(`conversation_${dto.conversationId}`)
      .emit('new_message', message);

    return message;
  }

  @SubscribeMessage('join_conversation')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinConversationDto,
  ) {
    await this.chatService.assertParticipant(
      dto.conversationId,
      client.data.userId,
    );
    client.join(`conversation_${dto.conversationId}`);
  }
}
```

### Persistência

Toda mensagem enviada via WebSocket é salva no PostgreSQL antes de ser emitida para os participantes. Em caso de falha no banco, o servidor emite um evento `message_error` para o remetente.

---

## 8. Frontend (Mobile First)

### Estrutura de Páginas

```
apps/web/src/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── feed/
│   │   └── FeedPage.tsx
│   ├── classifieds/
│   │   ├── ClassifiedsPage.tsx
│   │   └── ClassifiedDetailPage.tsx
│   ├── companies/
│   │   ├── CompaniesPage.tsx
│   │   └── CompanyProfilePage.tsx
│   ├── chat/
│   │   ├── ConversationsPage.tsx
│   │   └── ChatPage.tsx
│   ├── profile/
│   │   └── ProfilePage.tsx
│   └── create/
│       └── CreatePostPage.tsx
├── components/
│   ├── feed/
│   │   ├── FeedCard.tsx            # Genérico — decide qual sub-card renderizar
│   │   ├── SocialCard.tsx
│   │   ├── ClassifiedCard.tsx
│   │   └── BusinessCard.tsx
│   ├── chat/
│   │   ├── ConversationList.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   └── TopBar.tsx
│   └── shared/
│       ├── InfiniteList.tsx        # Scroll infinito genérico
│       ├── ImageUploader.tsx
│       └── ConfirmDialog.tsx
├── hooks/
│   ├── useFeed.ts
│   ├── useChat.ts
│   └── useUpload.ts
├── store/
│   ├── authStore.ts               # Zustand: token, user
│   └── uiStore.ts                 # Zustand: modais, toasts
├── services/
│   ├── api.ts                     # Instância Axios com interceptors JWT
│   └── socket.ts                  # Singleton Socket.io
└── router.tsx
```

### Estratégia de Estado

| Categoria | Ferramenta | Uso |
|---|---|---|
| Dados de servidor | React Query v5 | Feed, Classifieds, Companies, Perfil |
| Auth global | Zustand | Token JWT, dados do usuário logado |
| UI global | Zustand | Toast, modal aberto, loading global |
| Chat realtime | Socket.io + React Query | Mensagens são inseridas no cache do RQ via `queryClient.setQueryData` |

### React Query Keys

```typescript
export const queryKeys = {
  feed: (cursor?: string) => ['feed', cursor] as const,
  classifieds: (filters: ClassifiedFilters) => ['classifieds', filters] as const,
  classified: (id: string) => ['classified', id] as const,
  company: (slug: string) => ['company', slug] as const,
  conversations: () => ['conversations'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
};
```

### Roteamento

```typescript
// router.tsx
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <AuthGuard><AppLayout /></AuthGuard>,
    children: [
      { index: true, element: <FeedPage /> },
      { path: '/classifieds', element: <ClassifiedsPage /> },
      { path: '/classifieds/:id', element: <ClassifiedDetailPage /> },
      { path: '/companies/:slug', element: <CompanyProfilePage /> },
      { path: '/chat', element: <ConversationsPage /> },
      { path: '/chat/:conversationId', element: <ChatPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/create', element: <CreatePostPage /> },
    ],
  },
]);
```

### Layout Mobile First

- Bottom Navigation: Feed | Classificados | Criar | Chat | Perfil
- Top Bar: Logo + Notificações
- Breakpoints: base (375px) → sm (640px) → md (768px+)

---

## 9. Docker e Ambiente

### Estrutura de Arquivos Docker

```
docker/
├── docker-compose.yml           # Produção / staging
├── docker-compose.dev.yml       # Desenvolvimento local
├── Dockerfile.api               # Build NestJS
└── Dockerfile.web               # Build Vite (nginx serve)
```

### `docker-compose.dev.yml`

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: palmital
      POSTGRES_PASSWORD: palmital_dev
      POSTGRES_DB: palmital_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U palmital']
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
      target: development
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - '3001:3001'
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://palmital:palmital_dev@postgres:5432/palmital_db
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      UPLOAD_DIR: /uploads
    volumes:
      - ../apps/api:/app/apps/api
      - ../packages:/app/packages
      - uploads_data:/uploads
    command: pnpm --filter api dev

  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.web
      target: development
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - '3000:3000'
    environment:
      VITE_API_URL: http://localhost:3001/api/v1
      VITE_WS_URL: ws://localhost:3001
    volumes:
      - ../apps/web:/app/apps/web
      - ../packages:/app/packages
    command: pnpm --filter web dev

volumes:
  postgres_data:
  uploads_data:
```

### `Dockerfile.api`

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

FROM base AS development
RUN pnpm install
RUN pnpm --filter api prisma generate
EXPOSE 3001
CMD ["pnpm", "--filter", "api", "dev"]

FROM base AS build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json .
RUN npm install --production
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### `Dockerfile.web`

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

FROM base AS development
RUN pnpm install
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "dev"]

FROM base AS build
ARG VITE_API_URL
ARG VITE_WS_URL
RUN pnpm install --frozen-lockfile
RUN pnpm --filter web build

FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `.env.example`

```env
# Banco de Dados
DATABASE_URL=postgresql://palmital:palmital_dev@localhost:5432/palmital_db

# JWT
JWT_SECRET=change_this_secret_min_32_chars
JWT_REFRESH_SECRET=change_this_refresh_secret_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# App
NODE_ENV=development
PORT=3001
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# Frontend
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001
```

### Setup Local (Primeiros Passos)

```bash
# 1. Clonar e instalar
git clone https://github.com/fernandinhomartins40/palmitaldigital
cd palmitaldigital
pnpm install

# 2. Configurar variáveis
cp .env.example .env
# editar .env com valores reais

# 3. Subir banco + serviços
docker compose -f docker/docker-compose.dev.yml up -d postgres

# 4. Rodar migrations
pnpm --filter api prisma migrate dev --name init

# 5. Seed inicial (categorias, admin)
pnpm --filter api prisma db seed

# 6. Iniciar tudo em desenvolvimento
pnpm dev
```

---

## 10. Pipeline de Desenvolvimento

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalEnv": ["NODE_ENV", "DATABASE_URL"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "db:generate": {
      "cache": false,
      "outputs": ["node_modules/.prisma/**"]
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

### Scripts Root `package.json`

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "db:migrate": "pnpm --filter api prisma migrate dev",
    "db:generate": "pnpm --filter api prisma generate",
    "db:seed": "pnpm --filter api prisma db seed",
    "db:studio": "pnpm --filter api prisma studio",
    "docker:dev": "docker compose -f docker/docker-compose.dev.yml up",
    "docker:down": "docker compose -f docker/docker-compose.dev.yml down"
  }
}
```

### Padrão de Commits (Conventional Commits)

```
feat(feed): add cursor-based pagination to feed endpoint
fix(auth): correct JWT expiration check on refresh
chore(deps): update prisma to 5.x
refactor(chat): extract message persistence to repository layer
test(classifieds): add integration test for status update
docs: update API section in IMPLEMENTATION_PLAN
```

Scopes disponíveis: `feed`, `auth`, `classifieds`, `companies`, `chat`, `media`, `ui`, `db`, `docker`, `deps`

---

## 11. Roadmap Técnico por Fase

### Fase 1 — MVP (Em andamento)

**Objetivo:** Produto funcional com as funcionalidades essenciais

| Entrega | Descrição | Prioridade |
|---|---|---|
| Setup monorepo | Turborepo + pnpm workspaces + tsconfigs | P0 |
| Docker dev | postgres + api + web rodando com hot reload | P0 |
| Auth | Registro, login, JWT refresh | P0 |
| Schema Prisma | Migração inicial com User, Post, Classified, Chat | P0 |
| Feed básico | Listagem e criação de posts sociais | P0 |
| Upload de mídia | Endpoint de upload local, vinculação ao post | P1 |
| Classificados | CRUD completo + filtros básicos | P1 |
| Chat | WebSocket gateway + persistência + UI | P1 |
| Perfil de usuário | Edição, avatar | P2 |
| Deploy inicial | VPS com docker compose em produção | P2 |

### Fase 2 — Empresas e Catálogo

**Objetivo:** Monetização e tração com empresas locais

| Entrega | Descrição |
|---|---|
| Módulo Company | CRUD completo, perfil público, slug único |
| Catálogo de Produtos | Listagem com imagem e preço |
| Posts de Empresa | Tipo `BUSINESS` no feed |
| Destaque pago | Flag `isFeatured` em classifieds/empresas (manual inicialmente) |
| Verificação | Badge de empresa verificada (manual pelo admin) |
| Notificações push | PWA push notifications (novo chat, resposta) |
| Busca global | Full-text search no PostgreSQL (`tsvector`) |

### Fase 3 — Serviços

**Objetivo:** Plataforma de serviços locais

| Entrega | Descrição |
|---|---|
| Módulo de Serviços | Cadastro de prestadores de serviço |
| Pedidos/Delivery | Fluxo de solicitação e confirmação |
| Corridas | Solicitação de transporte local |
| Agendamentos | Sistema de reserva com slot de horário |
| Pagamento | Integração com Pix / gateway de pagamento |
| Dashboard analítico | Métricas para empresas e admin |

---

## 12. Boas Práticas

### Organização de Código

- **Um arquivo por responsabilidade:** nenhum arquivo de serviço com mais de 300 linhas
- **DTOs explícitos:** nunca retornar entidades Prisma diretamente — mapear para DTO de resposta
- **Repositório abstrai Prisma:** serviços chamam repositório, não `this.prisma` diretamente
- **Erros tipados:** usar exceptions do NestJS (`NotFoundException`, `ForbiddenException`) — nunca `throw new Error()`

### Segurança

- Senhas com bcrypt (rounds: 12 em produção, 4 em teste)
- JWT com expiração curta (15min access, 30d refresh)
- Rate limiting em `/auth/*` com `@nestjs/throttler`
- Validação de tipo de arquivo em upload (whitelist: `image/jpeg`, `image/png`, `image/webp`)
- Sanitização de `content` de posts (strip HTML)
- Guards verificam ownership antes de `PATCH`/`DELETE`

### Padrão de Branches

```
main           — produção (protegida, só merge via PR)
develop        — integração
feat/<scope>   — nova feature
fix/<scope>    — bugfix
chore/<scope>  — manutenção sem impacto funcional
```

### Versionamento de API

- Prefixo `/api/v1` desde o início
- Quando uma breaking change for necessária, criar `/api/v2` e deprecar v1 com header `Sunset`

### Escalabilidade

- **Horizontal:** a API é stateless (JWT), escalável com múltiplas réplicas
- **WebSocket:** quando necessário escalar, adicionar Redis Adapter ao Socket.io (`@socket.io/redis-adapter`)
- **Storage:** abstração `StorageService` desde o início — local em dev/staging, S3-compatible (MinIO) em produção
- **Database:** pool de conexões via `DATABASE_URL` com parâmetros `?connection_limit=10&pool_timeout=20`
- **Cache:** Redis para sessões de refresh token e rate limiting quando necessário

### Monitoramento (futuro imediato)

- Logs estruturados com `winston` (JSON em produção)
- Health check endpoint: `GET /health` retorna status do DB
- Métricas básicas com `@nestjs/terminus`

---

*Documento gerado em 2026-04-18. Atualizar a cada mudança arquitetural significativa.*
