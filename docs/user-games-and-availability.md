## RFC: Gestión de juegos del usuario y disponibilidad semanal (backend)

### 1) Objetivo y alcance

- **Objetivo**: Permitir que cada usuario seleccione los juegos que juega y sus franjas horarias semanales de disponibilidad, de forma segura e idempotente. Preparar el diseño para futuras búsquedas por múltiples criterios (p. ej., juego + franja horaria) y futuras preferencias flexibles.
- **Alcance**:
  - Alta/baja de juegos por usuario vía `PUT`/`DELETE`.
  - Gestión de disponibilidad semanal (lunes-domingo) con franjas horarias.
  - Endpoint para obtener el catálogo de juegos para el cliente.
  - Seguridad: solo el propio usuario puede modificar su perfil.
  - Diseño extensible para futuras preferencias/atributos.
- **Fuera de alcance por ahora**: Endpoint específico `GET /api/games/:gameId/players`. En su lugar, se plantea un endpoint de búsqueda genérico (opcional, ver sección 9) para combinar filtros (juego + franja, etc.).

### 2) Estado actual (resumen)

- Prisma ya define `Game` y `GameProfile` (N:1 con `User`, clave única `user_id + game_id`).
- No existe aún un modelo de disponibilidad semanal.
- `UserProfile` ya incluye `timezone`, útil para disponibilidad.

### 3) Cambios en base de datos (Prisma)

#### 3.1) Reutilización y ajustes

- Reutilizar `Game` y `GameProfile` existentes.
- Añadir índices útiles en `GameProfile` para consultas comunes:

```prisma
model GameProfile {
  // ... existing fields ...

  @@unique([user_id, game_id])
  @@index([game_id])
  @@index([user_id])
  @@map("game_profiles")
}
```

#### 3.2) Nuevo modelo: ventanas de disponibilidad

- Se guarda por usuario y día de la semana, con inicio/fin en minutos desde medianoche. La disponibilidad es independiente de los juegos. La zona horaria se mantiene en `UserProfile.timezone`.

```prisma
model AvailabilityWindow {
  id            Int       @id @default(autoincrement()) @db.UnsignedInt
  user_id       Int       @db.UnsignedInt
  day_of_week   Int       // 0-6 (0=Lunes, 6=Domingo) — validado en servicio
  start_minute  Int       // 0..1439 — validado en servicio
  end_minute    Int       // 1..1440 y end > start — validado en servicio
  created_at    DateTime  @default(now()) @map("created_at")
  updated_at    DateTime  @default(now()) @updatedAt @map("updated_at")

  // Relaciones
  user          User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, day_of_week])
  @@map("availability_windows")
}
```

Notas:

- No se usan CHECK constraints por compatibilidad; se valida en la capa de aplicación.
- Las franjas no deben solaparse por `(user_id, day_of_week)`; se valida en servicio.

#### 3.3) Modelo opcional para extensibilidad: atributos flexibles

- Permite añadir preferencias futuras sin cambios de schema (p. ej., niveles de experiencia, plataformas, etc.). Valores en JSON.

```prisma
model UserAttribute {
  id         Int      @id @default(autoincrement()) @db.UnsignedInt
  user_id    Int      @db.UnsignedInt
  scope      String?  @db.VarChar(50)     // "profile" | "game" | "search" | etc.
  game_id    Int?     @db.UnsignedInt
  key        String   @db.VarChar(100)
  value      Json
  created_at DateTime @default(now()) @map("created_at")
  updated_at DateTime @default(now()) @updatedAt @map("updated_at")

  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  game       Game?    @relation(fields: [game_id], references: [id], onDelete: SetNull)

  @@unique([user_id, scope, key, game_id])
  @@index([user_id, scope, key])
  @@map("user_attributes")
}
```

### 4) Seed de juegos (catálogo)

- Mapear el catálogo del frontend 1:1:
  - `value -> code`
  - `titleKey -> name_code`
  - `asset -> image_filename`
- Ejemplo (añadir a `prisma/seed.js`):

```js
const games = [
  {
    code: 'cod',
    name_code: 'user-profile.games.list.cod.title',
    image_filename: 'cod-icon-500.png',
  },
  {
    code: 'csgo',
    name_code: 'user-profile.games.list.csgo.title',
    image_filename: 'csgo-icon-500.png',
  },
  {
    code: 'dota',
    name_code: 'user-profile.games.list.dota.title',
    image_filename: 'dota-icon-500.png',
  },
  { code: 'fc', name_code: 'user-profile.games.list.fc.title', image_filename: 'fc-icon-500.png' },
  {
    code: 'fortnite',
    name_code: 'user-profile.games.list.fortnite.title',
    image_filename: 'fortnite-icon-500.png',
  },
  {
    code: 'gta',
    name_code: 'user-profile.games.list.gta.title',
    image_filename: 'gta-icon-500.png',
  },
  {
    code: 'lol',
    name_code: 'user-profile.games.list.lol.title',
    image_filename: 'lol-icon-500.png',
  },
  {
    code: 'minecraft',
    name_code: 'user-profile.games.list.minecraft.title',
    image_filename: 'minecraft-icon-500.png',
  },
  {
    code: 'overwatch',
    name_code: 'user-profile.games.list.overwatch.title',
    image_filename: 'overwatch-icon-500.png',
  },
  {
    code: 'pubg',
    name_code: 'user-profile.games.list.pubg.title',
    image_filename: 'pubg-icon-500.png',
  },
  {
    code: 'roblox',
    name_code: 'user-profile.games.list.roblox.title',
    image_filename: 'roblox-icon-500.png',
  },
  {
    code: 'rocketleague',
    name_code: 'user-profile.games.list.rocketleague.title',
    image_filename: 'rocketleague-icon-500.png',
  },
  {
    code: 'rust',
    name_code: 'user-profile.games.list.rust.title',
    image_filename: 'rust-icon-500.png',
  },
  {
    code: 'tft',
    name_code: 'user-profile.games.list.tft.title',
    image_filename: 'tft-icon-500.png',
  },
  {
    code: 'valorant',
    name_code: 'user-profile.games.list.valorant.title',
    image_filename: 'valorant-icon-500.png',
  },
  {
    code: 'wow',
    name_code: 'user-profile.games.list.wow.title',
    image_filename: 'wow-icon-500.png',
  },
];

await prisma.game.createMany({ data: games, skipDuplicates: true });
```

Validaciones de integridad en seed:

- `code` es único; si hay cambios de catálogo, mantener compatibilidad hacia atrás cuando sea posible.
- Si el frontend usa `code` como clave, evitar cambios destructivos; en su lugar marcar juegos como deprecated (campo opcional futuro) y mantener `code` original.

### 5) Contratos de API (endpoints)

Todas las rutas de modificación están protegidas por `authenticate` y un middleware de "self" que impide editar perfiles ajenos.

#### 5.1) Juegos del usuario (toggle idempotente)

- PUT `/api/users/:id/games`
  - Body: `{ userId: number, gameId: number }`
  - Efecto: asegura que el juego queda seleccionado (crea `GameProfile` si no existe). Idempotente.
  - Respuesta 200:
    ```json
    { "gameId": 17, "selected": true, "profileIsActive": false }
    ```
    - `profileIsActive` refleja `user_profile.is_active` tras la operación.

- DELETE `/api/users/:id/games`
  - Body: `{ userId: number, gameId: number }`
  - Efecto: asegura que el juego queda deseleccionado (borra `GameProfile` si existe). Idempotente.
  - Respuesta 200:
    ```json
    { "gameId": 17, "selected": false, "profileIsActive": false }
    ```
    - `profileIsActive` se recalcula tras la operación. No se devuelve lista completa de juegos.

Notas de seguridad:

- Ignorar `body.userId` para la mutación efectiva y usar `req.user.id`/`req.params.id`. Validar coincidencia y rechazar si difiere.

#### 5.2) Disponibilidad semanal del usuario

- PUT `/api/users/:id/availability`
  - Body ejemplo (strings HH:mm):
    ```json
    {
      "userId": 12,
      "timezone": "Europe/Madrid",
      "windows": [
        { "dayOfWeek": 1, "start": "18:00", "end": "21:00" },
        { "dayOfWeek": 3, "start": "20:30", "end": "23:00" }
      ]
    }
    ```
  - Semántica: operación de reemplazo. El servicio valida y reemplaza todas las ventanas del usuario. Si `timezone` llega, actualizar `UserProfile.timezone`. Transacción: borrar existentes y crear las nuevas.
  - Respuesta 200: `{ timezone, availability: [ ...normalizadas... ] }` con tiempos en minutos o en `HH:mm`.

- GET `/api/users/:id/availability`
  - Respuesta 200: `{ timezone, availability: [ { dayOfWeek, start, end } ] }`.

#### 5.3) Catálogo de juegos

- GET `/api/games`
  - Respuesta 200: `{ games: [ { id, code, nameCode, imageFilename } ] }`.

#### 5.4) Perfil público del usuario

- GET `/api/users/:id/public`
  - Respuesta 200: `{ user: { id, username, ... }, games: [...], timezone: string|null, availability: [...] }`.
  - Siempre devuelve toda la información pública del perfil. El parámetro `includeAvailability` ha sido eliminado.

#### 5.5) Búsqueda (opcional, genérica y flexible)

- GET `/api/users/search?gameCode=lol&dayOfWeek=1&start=18:00&end=21:00`
  - Soporta añadir más filtros en el futuro (vía query params o JSON en POST `/api/users/search`).
  - Implementación recomendada más adelante (no requerida ahora).

#### 5.6) Catálogo de zonas horarias (TZDB)

- GET `/api/timezones`
  - Respuesta 200 (JSON generado exclusivamente desde TZDB; sin fallback a Intl):
    ```json
    {
      "version": "2025a",
      "lastUpdated": "2025-08-09T12:34:56.000Z",
      "source": "tzdb",
      "timezones": [
        {
          "id": "Europe/Madrid",
          "altName": "Central European Time",
          "countryCode": "ES",
          "countryName": "Spain",
          "continentCode": "EU",
          "continentName": "Europe",
          "group": ["Europe/Madrid"],
          "utcOffset": "+01:00",
          "isDST": true
        },
        {
          "id": "Asia/Tokyo",
          "altName": "Japan Standard Time",
          "countryCode": "JP",
          "countryName": "Japan",
          "continentCode": "AS",
          "continentName": "Asia",
          "group": ["Asia/Tokyo"],
          "utcOffset": "+09:00",
          "isDST": false
        }
      ]
    }
    ```
- Encabezados recomendados (producción): `Cache-Control: public, max-age=86400, must-revalidate`, `ETag`, `Last-Modified`.
- En desarrollo/local: `Cache-Control: no-store` para desactivar la caché y facilitar pruebas (actualización inmediata del JSON generado).
  - Posibles errores: 503 SERVICE_UNAVAILABLE (si el catálogo no está disponible).

### 6) Validación

- Zod schemas (en `validation.js`):
  - `addUserGameValidation`, `removeUserGameValidation`:
    - `params.id`: entero positivo.
    - `body.userId`: entero positivo, debe coincidir con `params.id`.
    - `body.gameId`: entero positivo.
  - `putAvailabilityValidation`:
    - `params.id`: entero positivo y self.
    - `body.timezone`: opcional, string válida IANA.
    - `body.windows[]` objetos con:
      - `dayOfWeek`: entero 0..6 (0=Lunes, 6=Domingo; documentar convención).
      - `start`, `end`: formato `HH:mm` (o `startMinute`, `endMinute` enteros 0..1440).
    - Reglas de negocio:
      - `start < end`.
      - Sin solape por `(userId, dayOfWeek)`.
      - Cotas: máximo N ventanas/día (p. ej., 12) para evitar abusos.

Ejemplos de validaciones (errores):

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Invalid availability payload",
  "details": [
    {
      "field": "windows[0].dayOfWeek",
      "code": "OUT_OF_RANGE",
      "message": "dayOfWeek must be between 0 and 6"
    },
    { "field": "windows[1].start", "code": "INVALID_FORMAT", "message": "Expected HH:mm" },
    {
      "field": "windows[2]",
      "code": "OVERLAP",
      "message": "Overlaps with another window for the same day"
    }
  ]
}
```

### 7) Seguridad y autorización

- Middleware `authenticate` existente.
- Añadir middleware `ensureSelfParam('id')`:
  - Compara `parseInt(req.params.id)` con `req.user.id`. Si difiere -> 403.
- Para robustez, en controladores/servicios ignorar `body.userId` o exigir coincidencia estricta.
- Rate limit: se aplica el general (ya configurado). No se requieren límites adicionales específicos ahora.

### 8) Capa de dominio y repositorios

Interfaces (domain):

```ts
// GameRepository
findAll(): Promise<Game[]>;
findById(gameId: string | number): Promise<Game | null>;
findByCode(code: string): Promise<Game | null>;

// GameProfileRepository
addUserGame(userId: string | number, gameId: string | number): Promise<void>; // idempotente
removeUserGame(userId: string | number, gameId: string | number): Promise<void>; // idempotente
getUserGames(userId: string | number): Promise<Game[]>;

// AvailabilityRepository
replaceUserAvailability(userId: string | number, windows: AvailabilityWindowInput[]): Promise<void>;
getUserAvailability(userId: string | number): Promise<AvailabilityWindowDto[]>;

// (Opcional) UserAttributeRepository
setAttribute(userId, key, value, scope?, gameId?): Promise<void>;
getAttributes(userId, scope?, gameId?): Promise<Record<string, unknown>>;
```

Implementaciones Prisma (infra):

- `PrismaGameRepository`: `game.findMany`, `findUnique({ code })`, etc.
- `PrismaGameProfileRepository`: `upsert` por `user_id + game_id`; `deleteMany` idempotente; `findMany` + `include: { game: true }`.
- `PrismaAvailabilityRepository`:
  - `replaceUserAvailability`: transacción `deleteMany({ user_id })` + `createMany(windows normalizadas)`.
  - `getUserAvailability`: `findMany({ where: { user_id }, orderBy: [{ day_of_week: 'asc' }, { start_minute: 'asc' }] })`.
- `PrismaUserAttributeRepository` (opcional): `upsert` por la `@@unique` compuesta.

Notas transaccionales:

- En `replaceUserAvailability`, usar `prisma.$transaction` para asegurar atomicidad (borrado + inserción). Si la validación de solapes se realiza en BD, lanzar error antes de `createMany`.

### 9) Servicios (aplicación)

- Extender `UserService` o crear `UserPreferencesService` con:
  - `addGameToUser(userId, gameId)` → valida existencia de usuario y juego; `upsert`; devuelve lista actual de juegos.
  - `removeGameFromUser(userId, gameId)` → valida; `deleteMany`; devuelve lista actual de juegos.
  - `putAvailability(userId, payload)` → normaliza a minutos, valida solapes/tiempos, transacción de reemplazo; devuelve disponibilidad actual.
  - `getAvailability(userId)` → devuelve disponibilidad actual.
  - `getPublicProfile(userId, { includeAvailability })` → datos públicos + juegos (+ disponibilidad opcional).

Validaciones en servicio:

- Normalización de `HH:mm` → minutos desde medianoche.
- Solape: ordenar por `start_minute` y comprobar `current.start < next.end` en cada día.
- `day_of_week` 0..6. Documentar convención (0=Lunes).

### 10) Controladores y rutas

- Rutas (añadir a `API_ROUTES`):
  - `USERS.ADD_GAME = '/api/users/:id/games'`
  - `USERS.REMOVE_GAME = '/api/users/:id/games'` (mismo path, método DELETE)
  - `USERS.PUT_AVAILABILITY = '/api/users/:id/availability'`
  - `USERS.GET_AVAILABILITY = '/api/users/:id/availability'`
  - `USERS.PUBLIC_PROFILE = '/api/users/:id/public'`
  - `GAMES.LIST = '/api/games'`

- Middlewares: `authenticate`, `ensureSelfParam('id')`, validaciones Zod por endpoint.

Ejemplos de middleware/rutas (esqueleto):

```js
// src/infrastructure/middleware/ensureSelf.js
import { createError } from '../../shared/utils/error.js';
import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

export const ensureSelfParam =
  (param = 'id') =>
  (req, _res, next) => {
    const pathId = parseInt(req.params[param], 10);
    const userId = parseInt(req.user?.id, 10);
    if (Number.isNaN(pathId) || Number.isNaN(userId) || pathId !== userId) {
      return next(
        createError({
          message: 'Forbidden',
          code: API_ERROR_CODES.AUTH_FORBIDDEN,
          status: HTTP_STATUS.FORBIDDEN,
          errorDetails: { type: 'business', details: [{ field: 'user', code: 'FORBIDDEN' }] },
        })
      );
    }
    next();
  };
```

```js
// src/infrastructure/routes/index.js (fragmento)
router.put(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.ADD_GAME}`,
  authenticate,
  ensureSelfParam('id'),
  addUserGameValidation,
  asyncHandler(userController.addGame.bind(userController))
);

router.delete(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.REMOVE_GAME}`,
  authenticate,
  ensureSelfParam('id'),
  removeUserGameValidation,
  asyncHandler(userController.removeGame.bind(userController))
);

router.put(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.PUT_AVAILABILITY}`,
  authenticate,
  ensureSelfParam('id'),
  putAvailabilityValidation,
  asyncHandler(userController.putAvailability.bind(userController))
);

router.get(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_AVAILABILITY}`,
  authenticate,
  ensureSelfParam('id'),
  asyncHandler(userController.getAvailability.bind(userController))
);

router.get(
  `${API_ROUTES.BASE}${API_ROUTES.GAMES.LIST}`,
  asyncHandler(gameController.listGames.bind(gameController))
);

router.get(
  `${API_ROUTES.BASE}${API_ROUTES.TIMEZONES}`,
  asyncHandler(async (_req, res) => {
    // servir JSON generado con cache headers
    const data = await timezoneCatalog.get();
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('ETag', data.etag);
    res.set('Last-Modified', data.lastModified);
    return res.apiSuccess({
      version: data.version,
      lastUpdated: data.lastUpdated,
      source: data.source,
      timezones: data.timezones,
    });
  })
);
```

### 11) Respuestas (formatos sugeridos y errores)

- `PUT /api/users/:id/games` y `DELETE /api/users/:id/games`:

  ```json
  { "gameId": 7, "selected": true, "profileIsActive": false }
  ```

  Posibles errores:
  - 400 VALIDATION_ERROR (gameId inválido)
  - 401 UNAUTHORIZED (sin token o token inválido)
  - 403 FORBIDDEN (no coincide `:id` con `req.user.id`)
  - 404 NOT_FOUND (usuario o juego no existe)
  - 409 CONFLICT (si aplicas regla de negocio adicional)
  - 500 DATABASE_ERROR (error inesperado de BD)

- `PUT/GET /api/users/:id/availability`:

  ```json
  {
    "timezone": "Europe/Madrid",
    "availability": [
      { "dayOfWeek": 1, "start": "18:00", "end": "21:00" },
      { "dayOfWeek": 3, "start": "20:30", "end": "23:00" }
    ]
  }
  ```

  Posibles errores:
  - 400 VALIDATION_ERROR (formato `HH:mm` inválido, `start >= end`, `dayOfWeek` fuera de rango, solapes)
  - 400 INVALID_TIMEZONE (si la IANA no es válida)
  - 401 UNAUTHORIZED (sin token o token inválido)
  - 403 FORBIDDEN (no coincide `:id` con `req.user.id`)
  - 500 DATABASE_ERROR (fallo al reemplazar transaccionalmente)

- `GET /api/games`:

  ```json
  {
    "games": [
      {
        "id": 1,
        "code": "cod",
        "nameCode": "user-profile.games.list.cod.title",
        "imageFilename": "cod-icon-500.png"
      }
    ]
  }
  ```

  Posibles errores:
  - 500 DATABASE_ERROR (fallo inesperado de BD)

- `GET /api/users/:id/public`:

  ```json
  {
    "user": { "id": 12, "username": "alice" },
    "games": [{ "id": 7, "code": "lol", "nameCode": "...", "imageFilename": "..." }],
    "timezone": "Europe/Madrid",
    "availability": [{ "dayOfWeek": 1, "start": "18:00", "end": "21:00" }]
  }
  ```

  Posibles errores:
  - 404 NOT_FOUND (usuario no existe)
  - 500 DATABASE_ERROR

### 12) Búsqueda futura (game + franja horaria, con zonas horarias)

- Endpoint propuesto (cuando se requiera):
  - `GET /api/users/search?gameCode=lol&dayOfWeek=1&start=18:00&end=21:00` (o `POST` con JSON para filtros complejos).
- Estrategia de consulta:
  - Resolver `gameCode` → `game.id`.
  - Obtener usuarios con `GameProfile(user_id, game_id)` para ese juego.
  - Elegir una semana de referencia (lunes 00:00 UTC) y, para cada usuario candidato, expandir sus ventanas locales a UTC usando su IANA para esa semana.
  - Filtrar por `AvailabilityWindow` (independiente de juego) según `day_of_week` y solape del intervalo [start,end) convertido a UTC.
  - Operador de solape: `NOT (end_minute <= query_start OR start_minute >= query_end)`.
  - Índices: `@@index([user_id, day_of_week])` en availability, y `@@index([game_id])` en `game_profiles`.

- Notas de DST:
  - En semanas con cambio horario, la conversión "hora local + IANA" → UTC puede producir horas inexistentes o repetidas. Definir política (ver sección 21): ajustar o rechazar.

### 13) Plan de implementación paso a paso

1. Prisma (schema):
   - Añadir modelo `AvailabilityWindow` y opcional `UserAttribute`.
   - Añadir índices en `GameProfile`.
2. Migraciones:
   - `npx prisma migrate dev -n add_availability_and_indexes`.
3. Seed:
   - Actualizar `prisma/seed.js` con el catálogo de juegos.
   - Ejecutar `node prisma/seed.js` (o script `npm run prisma:seed` si existe).
4. Repositorios (infra):
   - Crear `PrismaGameRepository`, `PrismaGameProfileRepository`, `PrismaAvailabilityRepository`.
5. Dominio (interfaces):
   - Definir interfaces mencionadas y alinear con implementación Prisma.
6. Servicios (aplicación):
   - Extender `UserService` o crear `UserPreferencesService` con métodos descritos.
7. Validaciones (Zod):
   - Añadir `addUserGameValidation`, `removeUserGameValidation`, `putAvailabilityValidation`.
8. Seguridad:
   - Crear middleware `ensureSelfParam('id')` y aplicarlo a rutas de modificación.
9. Controladores y rutas:
   - Registrar endpoints en `routes/index.js` y `apiRoutes.js`.
10. Tests:

- Unit: servicios/repositorios, validación de solapes, idempotencia.
- Integración: endpoints PUT/DELETE/PUT(GET) con auth y self.

### 14) Consideraciones de frontend

- El catálogo (`GET /api/games`) permite mapear `code` ↔ `id` en cliente.
- Para pintar botones activos:
  - `GET /api/users/:id/public` → lista de juegos del usuario.
- Toggle:
  - Activar → `PUT /api/users/:id/games`.
  - Desactivar → `DELETE /api/users/:id/games`.
- Disponibilidad:
  - UI de lunes a domingo mandatada a lista de ventanas. Enviar `PUT /api/users/:id/availability` con las ventanas vigentes (reemplazo total).

### 15) Extensiones futuras (ejemplos)

- Cambio de email del usuario:
  - `PUT /api/users/:id/email { newEmail }` → dispara verificación por correo. Autorizado solo para self. Patrón similar al flujo de verificación ya existente.
- Cambio de contraseña:
  - `PUT /api/users/:id/password { currentPassword, newPassword }` → verificar `currentPassword`, políticas de contraseña, registrar auditoría. Solo self.
- Atributos avanzados:
  - Usar `UserAttribute` para guardar preferencias adicionales sin migrar BD.

### 16) Criterios de aceptación

- Un usuario autenticado puede activar/desactivar juegos; la operación es idempotente y segura (solo su perfil).
- El catálogo de juegos está disponible vía API y sincronizado con el cliente.
- El usuario puede definir franjas por día; no se permiten solapes.
- `GET /api/users/:id/public` devuelve juegos (y disponibilidad si se solicita) para UI.
- Diseño preparado para búsqueda por juego + franja sin cambios estructurales futuros.

### 17) Notas de rendimiento

- Índices en `game_profiles(game_id)`, `game_profiles(user_id)`, `availability_windows(user_id, day_of_week)` y `availability_windows(game_id, day_of_week)` minimizan tiempos de búsqueda.
- Usar `createMany` para seeds y operaciones de reemplazo de disponibilidad.

### 18) Seguridad y cumplimiento

- JWT + `authenticate` obligatorios para modificaciones.
- `ensureSelfParam('id')` evita modificaciones entre usuarios.
- Validar entradas con Zod; sanitizar strings (zona horaria, etc.).

### 19) Anexos: utilidades recomendadas

- Conversión `HH:mm` ↔ minutos desde medianoche.
  ```ts
  export function hhmmToMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }
  export function minutesToHhmm(min: number): string {
    const h = Math.floor(min / 60)
      .toString()
      .padStart(2, '0');
    const m = (min % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }
  ```

---

Este documento sirve como base para la implementación. A medida que incorporemos nuevas capacidades (búsquedas, atributos adicionales, edición de email/contraseña), iremos ampliando las secciones correspondientes.

### 20) Mapeo UI TIMETABLE (frontend) → AvailabilityWindow (backend)

El cliente define una tabla semanal con 6 tramos fijos por día de 4h (00-04, 04-08, 08-12, 12-16, 16-20, 20-00), y claves de día `Mo, Tu, We, Th, Fr, Sa, Su`.

- Convención de días en backend (0..6):
  - 0 = Lunes (Mo)
  - 1 = Martes (Tu)
  - 2 = Miércoles (We)
  - 3 = Jueves (Th)
  - 4 = Viernes (Fr)
  - 5 = Sábado (Sa)
  - 6 = Domingo (Su)

- Tramos fijos (minutos desde medianoche):
  - 00:00-04:00 → 0..240
  - 04:00-08:00 → 240..480
  - 08:00-12:00 → 480..720
  - 12:00-16:00 → 720..960
  - 16:00-20:00 → 960..1200
  - 20:00-00:00 → 1200..1440

- Mapeo general: cada `DayTimeTableItem` con `active=true` se transforma en una `AvailabilityWindow` con `{ day_of_week, start_minute, end_minute }`. El campo `active` NO se persiste globalmente; la existencia de la ventana define la activación para ese usuario.

- Ejemplo de transformación (pseudocódigo):

  ```ts
  const DAY_MAP: Record<string, number> = { Mo: 0, Tu: 1, We: 2, Th: 3, Fr: 4, Sa: 5, Su: 6 };
  const SLOT_TO_RANGE: Record<string, [string, string]> = {
    '00': ['00:00', '04:00'],
    '01': ['04:00', '08:00'],
    '02': ['08:00', '12:00'],
    '03': ['12:00', '16:00'],
    '04': ['16:00', '20:00'],
    '05': ['20:00', '00:00'],
  };
  const toWindows = (timetable: DayTimeTable[]) => {
    const windows = [] as { dayOfWeek: number; start: string; end: string }[];
    for (const day of timetable) {
      const dayOfWeek = DAY_MAP[day.id];
      for (const item of day.times) {
        if (!item.active) continue;
        const slot = item.id.slice(-2); // 'Mo05' → '05'
        const [start, end] = SLOT_TO_RANGE[slot];
        windows.push({ dayOfWeek, start, end });
      }
    }
    return windows;
  };
  ```

- Payload `PUT /api/users/:id/availability` (ejemplo) derivado del `TIMETABLE`:

  ```json
  {
    "userId": 12,
    "timezone": "Europe/Madrid",
    "windows": [
      { "dayOfWeek": 0, "start": "16:00", "end": "20:00" },
      { "dayOfWeek": 0, "start": "20:00", "end": "00:00" },
      { "dayOfWeek": 2, "start": "20:00", "end": "00:00" }
    ]
  }
  ```

- Normalización en backend:
  - `00:00` de fin se interpreta como `1440` minutos (fin de día) para la validación `start < end`.
  - Se prohíben solapes por `(userId, dayOfWeek)`.
  - Si `timezone` no se envía, se usará `UserProfile.timezone` si existe.

### 21) Manejo profesional de zonas horarias (IANA y DST)

- Zona horaria del usuario:
  - Guardar como identificador IANA en `UserProfile.timezone` (p. ej., `Europe/Madrid`, `Asia/Tokyo`).
  - No usar offsets fijos (+01:00) ni abreviaturas (CET/JST).

- Timestamps puntuales (no recurrentes):
  - Persistir en UTC (ISO 8601). Convertir a la zona del usuario al mostrar.

- Ventanas recurrentes de disponibilidad:
  - Persistir como “hora local de pared” (`dayOfWeek`, `start`, `end`) asociada a la IANA del usuario.
  - Convertir a UTC solo al usar (búsqueda/ejecución), con librerías que incluyan tzdata y reglas DST.

- Librerías recomendadas en Node.js:
  - `Temporal` (cuando esté disponible) o `@js-temporal/polyfill`.
  - `luxon` (estable y ampliamente usada) con zonas IANA.

- Políticas de cambio horario (DST):
  - Hora inexistente (salto hacia delante): rechazar con VALIDATION_ERROR o ajustar al siguiente instante válido (documentar decisión).
  - Hora ambigua (repetida en caída hacia atrás): elegir la primera instancia o requerir confirmación; documentar.
  - Mantener `tzdata` actualizado en el entorno (por ejemplo, instalar `tzdata` en la imagen Docker base).

- Ejemplo de expansión (Luxon) de una ventana local a UTC para una semana de referencia:

```ts
import { DateTime } from 'luxon';

export function expandWindowToUtc(
  win: { dayOfWeek: number; start: string; end: string },
  weekStartIsoUtc: string,
  userIana: string
) {
  const weekStartUtc = DateTime.fromISO(weekStartIsoUtc, { zone: 'utc' });
  const dayLocal = weekStartUtc.plus({ days: win.dayOfWeek }).setZone(userIana);
  const [sh, sm] = win.start.split(':').map(Number);
  const [eh, em] = win.end.split(':').map(Number);

  let startLocal = dayLocal.set({ hour: sh, minute: sm, second: 0, millisecond: 0 });
  let endLocal =
    eh === 0 && em === 0
      ? dayLocal.plus({ days: 1 }).startOf('day')
      : dayLocal.set({ hour: eh, minute: em, second: 0, millisecond: 0 });

  if (!startLocal.isValid) throw new Error(`INVALID_LOCAL_TIME_START: ${win.start}`);
  if (!endLocal.isValid) throw new Error(`INVALID_LOCAL_TIME_END: ${win.end}`);

  return { startUtc: startLocal.toUTC().toISO(), endUtc: endLocal.toUTC().toISO() };
}
```

- Ejemplos de errores estandarizados:
  - `INVALID_TIMEZONE`: IANA desconocida.
  - `INVALID_LOCAL_TIME_START/END`: hora local inexistente por DST.
  - `AMBIGUOUS_LOCAL_TIME`: si se decide exigir desambiguación explícita en horas repetidas.

### 22) Estrategia para mantener y servir el catálogo de timezones actualizado

Objetivo: exponer `GET /api/timezones` siempre con datos actualizados y consistentes (fuente única TZDB), evitando persistir en BD una copia que quede desfasada.

Componentes:

- `timezone-source`: fuente de datos única: `@vvo/tzdb`.

- `timezone-builder` (script Node):
  - Recolecta zonas desde TZDB (`getTimeZones`).
  - Enriquecimiento: `altName`, `countryCode`, `countryName`, `continentCode`, `continentName`, `group`, `utcOffset`, `isDST`.
  - Produce `timezones.json` con estructura:
    ```json
    {
      "version": "<tzdb-version>",
      "lastUpdated": "<ISO>",
      "source": "tzdb",
      "timezones": [
        { "id": "Region/City", "altName": "...", "countryCode": "..", "countryName": "..", "continentCode": "..", "continentName": "..", "group": ["aliases"], "utcOffset": "+HH:MM", "isDST": true|false }
      ]
    }
    ```

- `timezone-regenerator` (tarea programada):
  - Periodicidad sugerida: al desplegar.
  - Pasos:
    1. Ejecutar `timezone-builder` en entorno CI/imagen Docker.
    2. Guardar el JSON en `src/infrastructure/assets/timezones.json` o carpeta estática `public/`.
    3. Exponer endpoint `GET /api/timezones` que lea y devuelva el JSON (con cache HTTP y ETag).

- `endpoint /api/timezones`:
  - Lazy-load en memoria al primer request; refresco en caliente si detecta nueva versión (opcional).
  - Cabeceras: `Cache-Control: public, max-age=86400`, `ETag`, `Last-Modified`.
  - Respuestas de error: 503 si el JSON no está disponible.

Validación en backend:

- Al recibir un `timezone` del usuario, validar que `id` existe en el `timezones.json` (o con `luxon/Temporal` si se desea verificación adicional en runtime).
- Persistir únicamente el string IANA.

Ejemplos:

- Generación (CLI):

  ```bash
  npm run build:timezones
  ```

- Estructura de `build-timezones.js` (esqueleto):

  ```js
  import { writeFileSync } from 'fs';
  import { DateTime } from 'luxon';
  import { getTimeZones } from '@vvo/tzdb';

  function build(outPath) {
    const now = DateTime.utc();
    const tzdb = getTimeZones({ includeUtc: false });
    const data = {
      version: process.env.TZDB_VERSION || 'unknown',
      lastUpdated: now.toISO(),
      source: 'tzdb',
      timezones: tzdb.map((z) => {
        const dt = now.setZone(z.name);
        return {
          id: z.name,
          altName:
            z.alternativeName || z.abbreviation || dt.offsetNameLong || dt.offsetNameShort || null,
          countryCode: z.countryCode || null,
          countryName: z.countryName || '',
          continentCode: z.continentCode || '',
          continentName: z.continentName || '',
          group: Array.isArray(z.group) && z.group.length ? z.group : [z.name],
          utcOffset: dt.toFormat('ZZ'),
          isDST: typeof dt.isInDST === 'boolean' ? dt.isInDST : null,
        };
      }),
    };
    writeFileSync(outPath, JSON.stringify(data, null, 2));
  }

  build('src/infrastructure/assets/timezones.json');
  ```

Notas:

- Si necesitas nombres localizados, añádelos en el build desde CLDR.
- No persistas la lista en BD; usa JSON versionado/caché y renueva con la tarea programada.
