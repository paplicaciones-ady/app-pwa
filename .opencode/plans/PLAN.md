# Plan: Microsoft Entra ID + Passkey + Offline

## Arquitectura

```
Tres piezas:
  Microsoft Entra ID  → identidad oficial (cloud)
  Passkey / WebAuthn   → prueba del usuario en el dispositivo
  Biometría            → desbloqueo de la passkey

Dos sesiones:
  Sesión Microsoft  → "Puedo hablar con Microsoft"
  Sesión Local      → "Este dispositivo reconoce al usuario"
```

---

## Fase 1 — Base de Datos (detalle)

### 1.1 Modificar `users`

#### `backend/src/users/user.entity.ts`

```typescript
// columnas actuales:
//   id             number  (PK, auto)
//   email          string  (unique)
//   passwordHash   string
//   createdAt      Date

// columnas nuevas:
@Column({ nullable: true, unique: true })
microsoftId?: string;       // oid de Microsoft Entra ID

@Column({ nullable: true })
name?: string;              // displayName de Microsoft

// passwordHash pasa a nullable:
@Column({ nullable: true })
passwordHash?: string;
```

| Columna | Cambio |
|---------|--------|
| `email` | Sin cambios — se llena con el email de Microsoft cuando el usuario se registra vía Entra ID |
| `passwordHash` | `nullable: true` — los usuarios creados vía Microsoft no tienen password |
| `microsoftId` | Nuevo, `VARCHAR`, `nullable`, `unique` — el `oid` del token de Microsoft |
| `name` | Nuevo, `VARCHAR`, `nullable` — `displayName` o `name` del token de Microsoft |

### 1.2 Nueva entidad `devices`

#### `backend/src/devices/device.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  deviceName!: string;

  @Column()
  deviceFingerprint!: string;

  @Column({ default: false })
  isTrusted!: boolean;

  @Column({ nullable: true })
  lastUsedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
```

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | SERIAL PK | |
| `userId` | INTEGER NOT NULL | FK → users.id |
| `deviceName` | VARCHAR NOT NULL | Nombre amigable |
| `deviceFingerprint` | VARCHAR NOT NULL | Hash SHA-256 de userAgent + language + screen |
| `isTrusted` | BOOLEAN DEFAULT false | |
| `lastUsedAt` | TIMESTAMP nullable | Se actualiza en cada autenticación |
| `createdAt` | TIMESTAMP DEFAULT now() | |

### 1.3 Modificar `passkey_credentials`

#### `backend/src/passkeys/passkey.entity.ts`

```typescript
// columna nueva:
@Column({ nullable: true })
deviceId?: number;

// relación opcional (sin bilateral):
@ManyToOne(() => Device, { nullable: true })
@JoinColumn({ name: 'deviceId' })
device?: Device;
```

- `deviceId` (FK → devices.id, nullable) — asocia la passkey al dispositivo donde se registró
- No se agrega referencia inversa en `Device`

### 1.4 Dependencias del módulo `DevicesModule`

#### `backend/src/devices/devices.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './device.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
```

Se registra en `app.module.ts`:
```typescript
imports: [
  DevicesModule,
  // ... otros módulos
],
```

### 1.5 Registrar `PasskeyCredential` con `TypeOrmModule` donde corresponda

Con `autoLoadEntities: true` en `app.module.ts`, TypeORM resuelve las relaciones automáticamente. No hace falta importar `Device` en `PasskeysModule`.

### 1.6 Modificar `UsersService`

#### `backend/src/users/users.service.ts`

```typescript
async findByMicrosoftId(microsoftId: string): Promise<User | null> {
  return this.usersRepository.findOne({ where: { microsoftId } });
}

async findOrCreateFromMicrosoft(
  microsoftId: string,
  email: string,
  name?: string,
): Promise<User> {
  const existing = await this.findByMicrosoftId(microsoftId);
  if (existing) return existing;

  const byEmail = await this.findByEmail(email);
  if (byEmail && !byEmail.microsoftId) {
    byEmail.microsoftId = microsoftId;
    byEmail.name = name ?? byEmail.name;
    return this.usersRepository.save(byEmail);
  }

  const user = this.usersRepository.create({
    email,
    microsoftId,
    name: name ?? email,
  });
  return this.usersRepository.save(user);
}
```

### 1.7 `init.sql` — PostgreSQL Docker

```sql
CREATE TABLE IF NOT EXISTS "devices" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    "deviceName" VARCHAR(255) NOT NULL,
    "deviceFingerprint" VARCHAR(255) NOT NULL,
    "isTrusted" BOOLEAN NOT NULL DEFAULT FALSE,
    "lastUsedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "microsoftId" VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS "name" VARCHAR(255),
    ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "passkey_credentials"
    ADD COLUMN IF NOT EXISTS "deviceId" INTEGER REFERENCES "devices"(id) ON DELETE SET NULL;
```

Nota: `synchronize: true` aplica los cambios de TypeORM automáticamente. El `init.sql` es solo para la primera inicialización del contenedor Docker.

### 1.8 Archivos involucrados (resumen)

| Archivo | Acción |
|---------|--------|
| `backend/src/users/user.entity.ts` | + `microsoftId`, + `name`, `passwordHash` → nullable |
| `backend/src/users/users.service.ts` | + `findByMicrosoftId()`, + `findOrCreateFromMicrosoft()` |
| `backend/src/devices/device.entity.ts` | **Nuevo** |
| `backend/src/devices/devices.service.ts` | **Nuevo** (CRUD básico) |
| `backend/src/devices/devices.controller.ts` | **Nuevo** (endpoints, sin guards aún) |
| `backend/src/devices/devices.module.ts` | **Nuevo** |
| `backend/src/passkeys/passkey.entity.ts` | + `deviceId`, + relación ManyToOne → Device |
| `backend/src/passkeys/passkeys.service.ts` | Actualizar `verifyRegistrationResponse` para guardar `deviceId` |
| `backend/src/app.module.ts` | + `DevicesModule` en imports |
| `bd/init.sql` | + tabla `devices`, + columnas nuevas |

### 1.9 Orden de implementación

```
1. Modificar user.entity.ts (microsoftId, name, passwordHash nullable)
2. Crear device.entity.ts
3. Crear devices.module.ts, devices.service.ts, devices.controller.ts (sin guards)
4. Modificar passkey.entity.ts (+ deviceId)
5. Registrar DevicesModule en app.module.ts
6. Agregar findByMicrosoftId() y findOrCreateFromMicrosoft() a UsersService
7. Modificar passkeys.service.ts: verifyRegistrationResponse acepta deviceId
8. Actualizar init.sql
9. Verificar con la BD (synchronize crea tablas/columnas)
```

---

## Fase 2 — Backend: Microsoft Entra ID (BFF Flow)

*Pendiente de detallar*

---

## Fase 3 — Backend: Devices & Passkeys

*Pendiente de detallar*

---

## Fase 4 — Frontend: Servicios y Estado

*Pendiente de detallar*

---

## Fase 5 — Frontend: UI Adaptativa

*Pendiente de detallar*

---

## Fase 6 — Frontend: Guards y Rutas

*Pendiente de detallar*

---

## Fase 7 — Offline Data (Service Worker)

*Pendiente de detallar*

---

## Fase 8 — Limpieza de Legacy

*Pendiente de detallar*
