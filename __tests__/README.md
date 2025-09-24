# Frontend Unit Tests

Esta carpeta contiene las pruebas unitarias para los componentes, hooks, contextos y utilidades del frontend de la aplicación.

## Estructura

```
__tests__/
├── __mocks__/          # Mocks globales para archivos estáticos
├── components/         # Tests para componentes React
│   ├── auth/          # Tests para componentes de autenticación
│   └── ui/            # Tests para componentes de UI
├── contexts/          # Tests para contextos de React
├── hooks/             # Tests para hooks personalizados
├── lib/               # Tests para utilidades y funciones auxiliares
└── README.md          # Este archivo
```

## Tecnologías Utilizadas

- **Jest**: Framework de testing
- **React Testing Library**: Para testing de componentes React
- **@testing-library/user-event**: Para simulación de interacciones de usuario
- **@testing-library/jest-dom**: Matchers adicionales para Jest

## Scripts Disponibles

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch (se re-ejecutan al cambiar archivos)
npm run test:watch

# Ejecutar pruebas con reporte de coverage
npm run test:coverage
```

## Configuración

### Jest Configuration (`jest.config.js`)

- **Environment**: jsdom para simular el DOM del navegador
- **Setup**: `jest.setup.js` para configuración global
- **Coverage**: Configurado para medir cobertura de código
- **Module Mapping**: Configurado para resolver rutas con `@/`

### Setup File (`jest.setup.js`)

- Importa `@testing-library/jest-dom` para matchers adicionales
- Mockea Next.js router y navegación
- Mockea localStorage, fetch y window.location
- Configuración de mocks globales

## Tests Incluidos

### Componentes

#### UI Components (`components/ui/`)
- **Button**: Tests para variantes, tamaños, estados y eventos
- Incluye tests para el sistema de variantes con `class-variance-authority`

#### Auth Components (`components/auth/`)
- **PermissionGate**: Tests para control de acceso basado en permisos y roles
- **RequirePermission, RequireRole, RequireAdmin**: Tests para componentes especializados

### Hooks

#### Permissions (`hooks/use-permissions.test.tsx`)
- Tests para verificación de permisos individuales y múltiples
- Tests para verificación de roles
- Tests para funciones de acceso a recursos
- Tests para funciones de gestión de usuarios

#### Mobile Detection (`hooks/use-mobile.test.tsx`)
- Tests para detección de dispositivos móviles
- Tests para breakpoints responsivos
- Tests para listeners de media queries

### Contextos

#### Auth Context (`contexts/auth-context.test.tsx`)
- Tests para inicialización y validación de tokens
- Tests para login y logout
- Tests para manejo de errores
- Tests para refresh de usuario y tokens

### Utilidades

#### Utils (`lib/utils.test.ts`)
- Tests para función `cn` (className merging)
- Tests para manejo de clases condicionales y conflictos de Tailwind

#### Validations (`lib/validations.test.ts`)
- Tests para schemas de validación de usuarios
- Tests para validación de login, cambio de contraseña, etc.
- Tests para casos edge y validaciones de formato

#### Countries (`lib/countries.test.ts`)
- Tests para estructura y formato de datos de países
- Tests para unicidad y completitud de datos
- Tests para funcionalidad de búsqueda

## Mocks

### File Mock (`__mocks__/fileMock.js`)
Mock para archivos estáticos (imágenes, etc.) que retorna un string stub.

### Global Mocks (en `jest.setup.js`)
- **Next.js Router**: Mock completo del sistema de navegación
- **localStorage**: Mock con métodos get/set/remove/clear
- **fetch**: Mock global para peticiones HTTP
- **window.location**: Mock para navegación y URLs

## Patrones de Testing

### Componentes React
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('should handle user interactions', async () => {
  const user = userEvent.setup()
  render(<Component />)
  
  const button = screen.getByRole('button')
  await user.click(button)
  
  expect(/* assertion */).toBe(true)
})
```

### Hooks
```typescript
import { renderHook } from '@testing-library/react'

it('should return expected values', () => {
  const { result } = renderHook(() => useCustomHook())
  
  expect(result.current.value).toBe(expected)
})
```

### Contextos
```typescript
const TestComponent = () => {
  const context = useContext(MyContext)
  return <div>{context.value}</div>
}

const renderWithProvider = (children) => {
  return render(
    <MyProvider>{children}</MyProvider>
  )
}
```

## Coverage

Los tests están configurados para medir cobertura de:
- Componentes en `components/` (excepto `components/ui/` que son de shadcn/ui)
- Hooks en `hooks/`
- Contextos en `contexts/`
- Utilidades en `lib/`

## Notas Importantes

1. **Solo Frontend**: Estos tests están configurados para ignorar el backend (`/back/` y `/app/api/`)
2. **Mocks Automáticos**: Next.js router, localStorage y fetch están mockeados globalmente
3. **Limpieza**: Los mocks se limpian automáticamente después de cada test
4. **TypeScript**: Todos los tests están escritos en TypeScript con tipado completo

## Agregar Nuevos Tests

Para agregar nuevos tests:

1. Crear archivo con extensión `.test.ts` o `.test.tsx`
2. Seguir la estructura de carpetas existente
3. Importar las utilidades necesarias de `@testing-library`
4. Mockear dependencias según sea necesario
5. Escribir tests descriptivos con casos positivos y negativos

## Comandos Útiles

```bash
# Ejecutar tests específicos
npm test -- --testNamePattern="Button"
npm test -- --testPathPattern="hooks"

# Ejecutar tests con output detallado
npm test -- --verbose

# Ejecutar tests sin cache
npm test -- --no-cache

# Generar reporte de coverage en HTML
npm run test:coverage
open coverage/lcov-report/index.html
```
