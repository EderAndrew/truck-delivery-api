# Cimento SaaS — API

API REST multi-tenant para gerenciamento de entregas de cimento e logística de frota. Construída com **NestJS**, **TypeORM** e **PostgreSQL + PostGIS**.

---

## Propósito

A API serve como backend de uma plataforma SaaS voltada para empresas de transporte e entrega de cimento. Cada empresa (tenant) pode gerenciar:

- Sua frota de caminhões
- Seus motoristas e administradores
- Pedidos de entrega (jobs)
- Viagens em andamento com rastreamento GPS em tempo real

---

## Stack

| Tecnologia | Uso |
|---|---|
| NestJS | Framework principal |
| TypeORM | ORM |
| PostgreSQL | Banco de dados relacional |
| PostGIS | Dados geográficos (pontos, rotas) |
| Socket.IO | Rastreamento em tempo real via WebSocket |
| Bcrypt | Hash de senhas |
| Nodemailer | Envio de e-mails (verificação) |

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
| `password_hash` | varchar | Senha hasheada (bcrypt) |
| `role` | enum | `ADMIN` ou `DRIVER` |
| `email_verified` | boolean | E-mail verificado |
| `email_verification_token` | varchar | Token de verificação |
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
| `gh_profile` | varchar | Perfil de rota/GeoHub |
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
| `origin_point` | geometry (Point, SRID 4326) | Ponto de origem (GPS) |
| `delivery_point` | geometry (Point, SRID 4326) | Ponto de entrega (GPS) |
| `volume_m3` | numeric | Volume em metros cúbicos |
| `scheduled_at` | timestamp | Data/hora agendada |
| `status` | enum | `PENDING`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED` |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

---

### `trips`
Execução real de um job. Liga motorista, caminhão e pedido, e registra o trajeto GPS.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `tenant_id` | UUID (FK → tenants) | Empresa responsável |
| `job_id` | UUID (FK → jobs) | Job sendo executado |
| `truck_id` | UUID (FK → trucks) | Caminhão utilizado |
| `driver_id` | UUID (FK → users) | Motorista responsável |
| `route` | geometry (LineString, SRID 4326) | Trajeto completo (GPS) |
| `current_location` | geometry (Point, SRID 4326) | Localização atual em tempo real |
| `last_location_update` | timestamp | Última atualização de localização |
| `estimated_arrival` | timestamp | ETA estimado |
| `distance_m` | numeric | Distância total em metros |
| `duration_s` | integer | Duração estimada em segundos |
| `start_time` | timestamp | Início da viagem |
| `end_time` | timestamp | Fim da viagem |
| `public_tracking_token` | varchar (unique) | Token público para rastreamento sem autenticação |
| `status` | enum | `PLANNED`, `STARTED`, `COMPLETED`, `CANCELED` |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

---

## Arquitetura de Módulos

O projeto segue a arquitetura modular do NestJS. Cada módulo possui seu próprio controller, service, entities e DTOs.

```
src/
├── main.ts                  # Entry point da aplicação
├── app/                     # Módulo raiz (bootstrap, config global)
├── auth/                    # Autenticação e autorização
│   ├── config/              # Configuração do JWT
│   ├── decorators/          # @CurrentUser, @Roles, @Public, @GetUser
│   ├── dto/                 # LoginDto
│   └── interfaces/          # JwtPayload
├── common/                  # Código compartilhado entre módulos
│   ├── dto/                 # GeoPointDto
│   ├── enums/               # JobStatus, TruckStatus, TripStatus, Role
│   └── types/               # Tipos geoespaciais e de usuário
├── tenants/                 # Gestão de empresas (multi-tenancy)
├── users/                   # Gestão de usuários (admin e motoristas)
├── trucks/                  # Gestão da frota de caminhões
├── jobs/                    # Pedidos de entrega
├── trips/                   # Viagens (execução dos jobs)
├── tracking/                # Rastreamento GPS em tempo real (WebSocket)
├── email/                   # Serviço de envio de e-mails (Nodemailer)
├── geocoding/               # Conversão de endereços em coordenadas
└── types/                   # Extensões de tipos globais (express.d.ts)
```

### Padrões por módulo

Cada módulo de domínio (`tenants`, `users`, `trucks`, `jobs`, `trips`) segue a mesma estrutura:

| Arquivo | Responsabilidade |
|---|---|
| `*.module.ts` | Configuração do módulo NestJS |
| `*.controller.ts` | Rotas HTTP (endpoints) |
| `*.service.ts` | Regras de negócio |
| `entities/*.entity.ts` | Modelo de banco de dados (TypeORM) |
| `dto/create-*.dto.ts` | Schema de criação (validação com class-validator) |
| `dto/update-*.dto.ts` | Schema de atualização |

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
1. Tenant se registra  →  POST /tenants/register
2. Admin verifica e-mail  →  GET /users/verify-email?token=...
3. Admin cadastra motoristas  →  POST /users
4. Admin cadastra caminhões  →  POST /trucks
5. Admin cria pedido de entrega  →  POST /jobs  (com coordenadas GPS)
6. Admin cria viagem  →  POST /trips  (vincula job + truck + driver)
7. Motorista envia localização  →  POST /tracking
8. Clientes rastreiam em tempo real  →  WebSocket ou GET /trips/track/:token
```

---

## Endpoints

### Tenants
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/tenants/register` | Registra empresa e cria admin |
| `POST` | `/tenants` | Cria tenant |
| `GET` | `/tenants` | Lista tenants |
| `GET` | `/tenants/:id` | Busca tenant por ID |
| `PATCH` | `/tenants/:id` | Atualiza tenant |
| `DELETE` | `/tenants/:id` | Remove tenant e todos os dados |

### Usuários
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/users` | Cria usuário (admin ou motorista) |
| `GET` | `/users` | Lista usuários (filtro: `?tenant_id=`) |
| `GET` | `/users/:id` | Busca usuário por ID |
| `PATCH` | `/users/:id` | Atualiza usuário |
| `DELETE` | `/users/:id` | Remove usuário |
| `GET` | `/users/verify-email` | Verifica e-mail via token |

### Caminhões
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/trucks` | Cadastra caminhão |
| `GET` | `/trucks` | Lista caminhões (filtro: `?tenant_id=`) |
| `GET` | `/trucks/:id` | Busca caminhão por ID |
| `PATCH` | `/trucks/:id` | Atualiza caminhão |
| `DELETE` | `/trucks/:id` | Remove caminhão |

### Pedidos (Jobs)
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/jobs` | Cria pedido de entrega |
| `GET` | `/jobs` | Lista pedidos (filtro: `?tenant_id=`) |
| `GET` | `/jobs/:id` | Busca pedido por ID |
| `PATCH` | `/jobs/:id` | Atualiza status do pedido |
| `DELETE` | `/jobs/:id` | Remove pedido |

### Viagens (Trips)
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/trips` | Cria viagem |
| `GET` | `/trips` | Lista viagens com relações (filtro: `?tenant_id=`) |
| `GET` | `/trips/:id` | Busca viagem por ID |
| `GET` | `/trips/track/:token` | Rastreamento público (sem auth) |
| `PATCH` | `/trips/:id` | Atualiza localização/status |
| `DELETE` | `/trips/:id` | Remove viagem |

### Rastreamento
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/tracking` | Envia atualização de localização GPS |

### WebSocket (Socket.IO)
| Evento | Direção | Descrição |
|---|---|---|
| `join` | Cliente → Server | Entra na sala de rastreamento de uma entrega |
| `location` | Server → Cliente | Emite localização `{ lat, lng }` em tempo real |

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

### Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `DB_HOST` | Host do PostgreSQL |
| `DB_PORT` | Porta do PostgreSQL |
| `DB_USERNAME` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `DB_DATABASE` | Nome do banco |
| `EMAIL_HOST` | Host SMTP |
| `EMAIL_USER` | Usuário SMTP |
| `EMAIL_PASS` | Senha SMTP |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT |
| `JWT_TTL` | Expiração do access token em segundos (padrão: `900`) |
| `JWT_REFRESH_TTL` | Expiração do refresh token em segundos (padrão: `86400`) |
| `PORT` | Porta da aplicação (padrão: `4001`) |
| `FRONTEND_URL` | URL do frontend (CORS) |

> O banco deve ter a extensão **PostGIS** habilitada: `CREATE EXTENSION postgis;`

---

## Testes

```bash
# Unitários
pnpm run test

# E2E
pnpm run test:e2e

# Cobertura
pnpm run test:cov
```
