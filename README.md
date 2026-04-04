# Cimento SaaS — API

API REST multi-tenant para gerenciamento de entregas de cimento e logística de frota. Construída com **NestJS**, **TypeORM** e **PostgreSQL + PostGIS**.

---

## Propósito

A API serve como backend de uma plataforma SaaS voltada para empresas de transporte e entrega de cimento. O sistema calcula rotas seguras para caminhões de carga pesada via **GraphHopper**, levando em conta restrições de peso, tipo de veículo e minimização de riscos de acidentes.

Cada empresa (tenant) pode gerenciar:

- Sua frota de caminhões
- Seus motoristas e administradores
- Pedidos de entrega (jobs)
- Viagens com roteamento automático e rastreamento GPS em tempo real

---

## Stack

| Tecnologia | Uso |
|---|---|
| NestJS | Framework principal |
| TypeORM | ORM |
| PostgreSQL | Banco de dados relacional |
| PostGIS | Dados geográficos (pontos, rotas) |
| GraphHopper API | Cálculo de rotas seguras para veículos pesados |
| Socket.IO | Rastreamento em tempo real via WebSocket |
| Bcrypt | Hash de senhas |
| Nodemailer | Envio de e-mails (verificação) |
| OpenCage API | Geocodificação de endereços |

---

## Estrutura de Tabelas

### `tenants`
Empresas que utilizam a plataforma. É a entidade raiz — todos os outros dados pertencem a um tenant.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `name` | varchar | Nome da empresa |
| `cnpj` | varchar (unique) | CNPJ da empresa |
| `phone` | varchar | Telefone |
| `email` | varchar | E-mail de contato |
| `address_street` | varchar | Logradouro |
| `address_number` | varchar | Número |
| `address_city` | varchar | Cidade |
| `address_state` | varchar | Estado |
| `address_zip` | varchar | CEP |
| `address_country` | varchar | País |
| `origin_point` | geometry (Point, SRID 4326) | Localização da empresa (GPS) |
| `is_active` | boolean | Tenant ativo ou não |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

---

### `users`
Funcionários do tenant. Podem ser administradores ou motoristas.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `tenant_id` | UUID (FK → tenants) | Empresa do usuário |
| `name` | varchar | Nome completo |
| `email` | varchar | E-mail |
| `password_hash` | varchar | Senha hasheada (bcrypt) — `select: false` |
| `role` | enum | `MASTER`, `ADMIN`, `USER`, `DRIVER` |
| `email_verified` | boolean | E-mail verificado |
| `email_verification_token` | varchar | Token de verificação — `select: false` |
| `photo` | varchar | URL da foto |
| `is_active` | boolean | Usuário ativo ou não |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

> Index composto único em `(tenant_id, email)` — e-mail único por empresa.

---

### `trucks`
Veículos da frota do tenant.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `tenant_id` | UUID (FK → tenants) | Empresa do caminhão |
| `plate` | varchar | Placa do veículo |
| `truck_type` | varchar | Tipo (ex: basculante, betoneira) |
| `gh_profile` | varchar | Perfil de roteamento GraphHopper (ex: `truck`, `small_truck`) |
| `max_weight_kg` | integer | Capacidade máxima em kg |
| `status` | enum | `AVAILABLE`, `ON_TRIP`, `IN_MAINTENANCE` |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

> Index composto único em `(tenant_id, plate)` — placa única por empresa.

---

### `jobs`
Pedidos de entrega com origem e destino geográfico.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `tenant_id` | UUID (FK → tenants) | Empresa responsável |
| `customer_name` | varchar | Nome do cliente |
| `customer_phone` | varchar | Telefone do cliente |
| `address_street` | varchar | Logradouro de entrega |
| `address_number` | varchar | Número |
| `address_city` | varchar | Cidade |
| `address_state` | varchar | Estado |
| `address_zip` | varchar | CEP |
| `address_country` | varchar | País |
| `origin_point` | geometry (Point, SRID 4326) | Ponto de origem (GPS) |
| `delivery_point` | geometry (Point, SRID 4326) | Ponto de entrega (GPS) |
| `volume_m3` | numeric | Volume em metros cúbicos |
| `scheduled_at` | timestamp | Data/hora agendada |
| `status` | enum | `PENDING`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED` |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

---

### `trips`
Execução real de um job. Liga motorista, caminhão e pedido. A rota é calculada automaticamente pelo GraphHopper no momento da criação.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `tenant_id` | UUID (FK → tenants) | Empresa responsável |
| `job_id` | UUID (FK → jobs) | Job sendo executado |
| `truck_id` | UUID (FK → trucks) | Caminhão utilizado |
| `driver_id` | UUID (FK → users) | Motorista responsável |
| `route` | geometry (LineString, SRID 4326) | Rota calculada pelo GraphHopper |
| `current_location` | geometry (Point, SRID 4326) | Localização atual em tempo real |
| `last_location_update` | timestamp | Última atualização de localização |
| `estimated_arrival` | timestamp | ETA calculado pelo GraphHopper |
| `distance_m` | numeric | Distância total em metros (GraphHopper) |
| `duration_s` | integer | Duração estimada em segundos (GraphHopper) |
| `start_time` | timestamp | Início da viagem |
| `end_time` | timestamp | Fim da viagem |
| `public_tracking_token` | varchar (unique) | Token para rastreamento público sem autenticação |
| `status` | enum | `PLANNED`, `STARTED`, `COMPLETED`, `CANCELED` |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

---

## Arquitetura de Módulos

```
src/
├── main.ts                  # Entry point da aplicação
├── app/                     # Módulo raiz (bootstrap, config global)
├── auth/                    # Autenticação JWT, guards, decorators
├── common/                  # DTOs, enums e tipos compartilhados
├── tenants/                 # Gestão de empresas (multi-tenancy)
├── users/                   # Gestão de usuários (admin e motoristas)
├── trucks/                  # Gestão da frota de caminhões
├── jobs/                    # Pedidos de entrega
├── trips/                   # Viagens (execução dos jobs)
├── tracking/                # Rastreamento GPS em tempo real (WebSocket)
├── graphhopper/             # Integração com GraphHopper API (roteamento)
├── geocoding/               # Geocodificação via OpenCage API
└── email/                   # Envio de e-mails (Nodemailer)
```

---

## Relacionamento entre Tabelas

```
tenants (raiz)
  ├── 1:N → users         (cascade delete)
  ├── 1:N → trucks        (cascade delete)
  └── 1:N → jobs          (cascade delete)
               └── 1:N → trips (restrict delete)
                     ├── N:1 → jobs    (restrict)
                     ├── N:1 → trucks  (restrict)
                     └── N:1 → users   (restrict)
```

> `cascade delete`: ao deletar o tenant, todos os dados relacionados são removidos.
> `restrict delete`: não é possível deletar um job, truck ou driver enquanto houver trips vinculadas.

---

## Fluxo de Uso

```
1. Tenant se registra         →  POST /api/tenants/register
2. Admin verifica e-mail      →  GET  /api/users/verify-email?token=...
3. Admin cadastra motoristas  →  POST /api/users
4. Admin cadastra caminhões   →  POST /api/trucks  (incluindo gh_profile)
5. Admin cria pedido          →  POST /api/jobs    (com coordenadas GPS)
6. Admin cria viagem          →  POST /api/trips/create
                                   └── GraphHopper calcula rota automaticamente
7. Motorista envia localização →  POST /api/tracking
8. Cliente rastreia entrega   →  GET  /api/trips/track/:token  (sem autenticação)
                                   ou WebSocket (Socket.IO)
```

---

## Endpoints

Base URL: `/api`

### Autenticação
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/login` | Pública | Login — retorna tokens (mobile) ou seta cookies (web) |
| `POST` | `/auth/refresh` | JWT | Renova access e refresh tokens |
| `POST` | `/auth/logout` | JWT | Limpa cookies de sessão |

### Tenants
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/tenants/register` | Registra empresa e cria admin inicial |
| `POST` | `/tenants` | Cria tenant |
| `GET` | `/tenants` | Lista tenants |
| `GET` | `/tenants/:id` | Busca tenant por ID |
| `PATCH` | `/tenants/:id` | Atualiza tenant |
| `DELETE` | `/tenants/:id` | Remove tenant e todos os dados |

### Usuários
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/users` | Cria usuário |
| `GET` | `/users` | Lista usuários do tenant |
| `GET` | `/users/:id` | Busca usuário por ID |
| `PATCH` | `/users/:id` | Atualiza usuário |
| `DELETE` | `/users/:id` | Remove usuário |
| `GET` | `/users/verify-email` | Verifica e-mail via token |

### Caminhões
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/trucks` | Cadastra caminhão |
| `GET` | `/trucks` | Lista caminhões do tenant |
| `GET` | `/trucks/:id` | Busca caminhão por ID |
| `PATCH` | `/trucks/:id` | Atualiza caminhão |
| `DELETE` | `/trucks/:id` | Remove caminhão |

### Pedidos (Jobs)
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/jobs` | Cria pedido de entrega |
| `GET` | `/jobs` | Lista pedidos do tenant |
| `GET` | `/jobs/:id` | Busca pedido por ID |
| `PATCH` | `/jobs/:id` | Atualiza pedido |
| `DELETE` | `/jobs/:id` | Remove pedido |

### Viagens (Trips)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/trips/create` | ADMIN, USER | Cria viagem e calcula rota via GraphHopper |
| `GET` | `/trips/all` | ADMIN, USER, DRIVER | Lista viagens do tenant |
| `GET` | `/trips/trip/:id` | ADMIN, USER, DRIVER | Busca viagem por ID |
| `GET` | `/trips/track/:token` | Pública | Rastreamento público sem autenticação |
| `PATCH` | `/trips/trip/:id` | ADMIN, USER, DRIVER | Atualiza localização ou status |
| `DELETE` | `/trips/trip/:id` | ADMIN | Remove viagem |

### Rastreamento
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/tracking` | Envia atualização de localização GPS |

### WebSocket (Socket.IO)
| Evento | Direção | Payload | Descrição |
|---|---|---|---|
| `join` | Cliente → Server | `{ token: string }` | Entra na sala de rastreamento |
| `location` | Server → Cliente | `{ lat, lng, updatedAt }` | Localização atualizada em tempo real |

---

## Configuração e Execução

```bash
# Instalar dependências
pnpm install

# Desenvolvimento (watch mode)
pnpm run start:dev

# Produção
pnpm run start:prod
```

> O banco deve ter a extensão **PostGIS** habilitada: `CREATE EXTENSION postgis;`

### Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `PORT` | Porta da aplicação (padrão: `4001`) |
| `DB_HOST` | Host do PostgreSQL |
| `DB_PORT` | Porta do PostgreSQL |
| `DB_USERNAME` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `DB_DATABASE` | Nome do banco |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT |
| `JWT_TTL` | Expiração do access token em segundos (padrão: `900`) |
| `JWT_REFRESH_TTL` | Expiração do refresh token em segundos (padrão: `86400`) |
| `FRONTEND_URL` | URL do frontend (CORS) |
| `GRAPHHOPPER_BASE_URL` | Base URL da API GraphHopper (padrão: `https://graphhopper.com/api/1`) |
| `GRAPHHOPPER_API_KEY` | Chave da API GraphHopper |
| `OPENCAGE_API_URL` | URL da API OpenCage |
| `OPENCAGE_API_KEY` | Chave da API OpenCage |
| `EMAIL_HOST` | Host SMTP |
| `EMAIL_USER` | Usuário SMTP |
| `EMAIL_PASS` | Senha SMTP |
| `EMAIL_FROM` | Remetente dos e-mails |

---

## Testes

```bash
# Unitários
pnpm run test

# Arquivo específico
pnpm run test -- src/trips/trips.service.spec.ts

# E2E
pnpm run test:e2e

# Cobertura
pnpm run test:cov
```
