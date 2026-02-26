# Timetrack (Habit Tracker)

App en Expo/React Native para seguimiento de hábitos con foco en progreso continuo:
- sin streaks,
- con comparación entre objetivo y resultado real,
- y cálculo de índices en frontend.

## Stack

- Expo
- React Native
- TypeScript
- Supabase (persistencia remota)

## Desarrollo local

1. Instalar dependencias:

```bash
npm install
```

2. Levantar la app:

```bash
npx expo start
```

## Configuración de Supabase

1. Crear las tablas ejecutando:
- [docs/supabase.sql](/Users/matiasretamozo/Desktop/proyectos/identity/app/docs/supabase.sql)

2. Definir variables de entorno:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

3. Reiniciar Expo para que tome las variables.

## Comportamiento de datos

- La app opera en modo Supabase-only.
- Si Supabase no está configurado o la red falla, no hay persistencia local.
- Si la base está vacía, la app inicia vacía (sin datos seed).

Los cálculos de porcentaje, índice y curvas permanecen en frontend para conservar flexibilidad en cambios de hábitos y lectura de resultados reales.

### Índice 100D

- El índice toma siempre la ventana móvil de los últimos 100 días, desde hoy hacia atrás.
- Cada actualización de hábito o entry refresca el estado en UI y recalcula las estadísticas en tiempo real en frontend.
