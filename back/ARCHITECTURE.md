# Arquitectura en Capas - Grupo5 Usuarios

## 📋 Descripción

Implementación de una arquitectura en capas siguiendo las mejores prácticas de desarrollo de software, separando responsabilidades y facilitando el mantenimiento y testing.

## 🏗️ Estructura de Capas

### 1. **Capa de Presentación** (`src/presentation/`)
- **Responsabilidad**: Manejo de peticiones HTTP y respuestas
- **Componentes**:
  - `controllers/` - Controladores que manejan las rutas API
  - `middleware/` - Middleware de autenticación y validación
  - `dto/` - Data Transfer Objects para entrada/salida

### 2. **Capa de Aplicación** (`src/application/`)
- **Responsabilidad**: Lógica de negocio y casos de uso
- **Componentes**:
  - `services/` - Servicios que implementan la lógica de negocio
  - `use-cases/` - Casos de uso específicos
  - `interfaces/` - Interfaces de servicios

### 3. **Capa de Dominio** (`src/domain/`)
- **Responsabilidad**: Entidades de negocio y reglas del dominio
- **Componentes**:
  - `entities/` - Entidades de negocio
  - `repositories/` - Interfaces de repositorios
  - `services/` - Interfaces de servicios de dominio
  - `value-objects/` - Objetos de valor

### 4. **Capa de Infraestructura** (`src/infrastructure/`)
- **Responsabilidad**: Implementaciones técnicas y acceso a datos
- **Componentes**:
  - `repositories/` - Implementaciones de repositorios
  - `database/` - Configuración de base de datos
  - `auth/` - Servicios de autenticación
  - `validation/` - Servicios de validación
  - `di/` - Inyección de dependencias

### 5. **Capa de Datos** (`src/data/`)
- **Responsabilidad**: Acceso directo a datos
- **Componentes**:
  - `models/` - Modelos de datos
  - `migrations/` - Migraciones de base de datos

## 🔄 Flujo de Datos

```
HTTP Request → Presentation → Application → Domain → Infrastructure → Database
                ↓              ↓           ↓           ↓
HTTP Response ← Presentation ← Application ← Domain ← Infrastructure ← Database
```

## 📁 Estructura de Archivos

```
src/
├── presentation/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   └── middleware/
│       └── auth.middleware.ts
├── application/
│   └── services/
│       ├── auth.service.impl.ts
│       └── user.service.impl.ts
├── domain/
│   ├── entities/
│   │   └── user.entity.ts
│   ├── repositories/
│   │   └── user.repository.interface.ts
│   └── services/
│       ├── auth.service.interface.ts
│       └── user.service.interface.ts
├── infrastructure/
│   ├── repositories/
│   │   └── user.repository.impl.ts
│   ├── database/
│   │   └── prisma.client.ts
│   ├── auth/
│   │   └── jwt.service.ts
│   ├── validation/
│   │   └── validation.service.ts
│   └── di/
│       └── container.ts
├── types/
│   └── common.types.ts
└── data/
    └── models/
        └── user.model.ts
```

## 🎯 Principios Aplicados

### 1. **Separación de Responsabilidades**
- Cada capa tiene una responsabilidad específica
- Las capas superiores dependen de las inferiores
- No hay dependencias circulares

### 2. **Inversión de Dependencias**
- Las capas de dominio no dependen de infraestructura
- Se usan interfaces para desacoplar implementaciones
- Inyección de dependencias para resolver dependencias

### 3. **Principio de Responsabilidad Única**
- Cada clase tiene una sola razón para cambiar
- Responsabilidades bien definidas y acotadas

### 4. **Abierto/Cerrado**
- Abierto para extensión, cerrado para modificación
- Nuevas funcionalidades se agregan sin modificar código existente

## 🔧 Implementación

### Entidades de Dominio

```typescript
// src/domain/entities/user.entity.ts
export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly rol: UserRole,
    // ... otros campos
  ) {}

  // Métodos de negocio
  isAdmin(): boolean {
    return this.rol === 'admin';
  }

  canAccessResource(resourceUserId: string): boolean {
    return this.isAdmin() || this.id === resourceUserId;
  }
}
```

### Interfaces de Repositorio

```typescript
// src/domain/repositories/user.repository.interface.ts
export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(userData: CreateUserDto): Promise<UserEntity>;
  // ... otros métodos
}
```

### Servicios de Aplicación

```typescript
// src/application/services/user.service.impl.ts
export class UserServiceImpl implements UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(userData: CreateUserDto): Promise<UserEntity> {
    // Lógica de negocio
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Usuario ya existe');
    }
    
    return await this.userRepository.create(userData);
  }
}
```

### Controladores de Presentación

```typescript
// src/presentation/controllers/user.controller.ts
export class UserController {
  constructor(private userService: UserService) {}

  async createUser(request: NextRequest): Promise<NextResponse> {
    const body = await request.json();
    const newUser = await this.userService.createUser(body);
    
    return NextResponse.json({
      success: true,
      data: newUser.toPlainObject()
    });
  }
}
```

### Inyección de Dependencias

```typescript
// src/infrastructure/di/container.ts
export class DIContainer {
  private initializeDependencies(): void {
    // Repositorios
    this.dependencies.set('UserRepository', new UserRepositoryImpl());
    
    // Servicios
    this.dependencies.set('UserService', new UserServiceImpl(
      this.dependencies.get('UserRepository')
    ));
    
    // Controladores
    this.dependencies.set('UserController', new UserController(
      this.dependencies.get('UserService')
    ));
  }
}
```

## 🚀 Beneficios

### 1. **Mantenibilidad**
- Código organizado y fácil de entender
- Cambios localizados en capas específicas
- Fácil identificación de responsabilidades

### 2. **Testabilidad**
- Cada capa se puede testear independientemente
- Uso de mocks y stubs para aislar dependencias
- Tests unitarios y de integración más efectivos

### 3. **Escalabilidad**
- Fácil agregar nuevas funcionalidades
- Reutilización de componentes
- Separación clara de concerns

### 4. **Flexibilidad**
- Cambios en implementación sin afectar lógica de negocio
- Intercambio de tecnologías en capas específicas
- Configuración centralizada

## 🔄 Flujo de una Petición

1. **HTTP Request** llega al controlador
2. **Controller** valida entrada y delega al servicio
3. **Service** ejecuta lógica de negocio usando entidades
4. **Repository** accede a datos a través de infraestructura
5. **Database** retorna datos
6. **Response** se construye y retorna al cliente

## 📊 Ventajas vs. Arquitectura Monolítica

| Aspecto | Arquitectura en Capas | Monolítica |
|---------|----------------------|------------|
| **Mantenimiento** | ✅ Fácil | ❌ Complejo |
| **Testing** | ✅ Aislado | ❌ Acoplado |
| **Escalabilidad** | ✅ Horizontal | ❌ Limitada |
| **Reutilización** | ✅ Alta | ❌ Baja |
| **Flexibilidad** | ✅ Alta | ❌ Baja |

## 🎯 Próximos Pasos

1. **Implementar más entidades** de dominio
2. **Agregar casos de uso** específicos
3. **Implementar tests** para cada capa
4. **Agregar logging** y monitoreo
5. **Implementar cache** en capa de infraestructura

## 📚 Referencias

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)
