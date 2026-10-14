# Titanlike

Roguelike por turnos inspirado en Ataque a los Titanes: cuatro sagas, mapa de rutas, los Nueve poderes, traiciones y música original sintetizada. Proyecto de uso personal y sin ánimo de lucro.

## Estructura

- `src/` código del juego, en el orden en que se concatena (`shell.html` + `01…10-*.js`).
- `build.mjs` genera `public/index.html` (versión con nube) o `dist/artifact.html` (`--artifact`, sin nube).
- `config.json` URL y clave publicable de Supabase (son públicas por diseño; la seguridad está en RLS).
- `scripts/sim.cjs` simulador de partidas para equilibrar dificultad: `npm run sim`.

## Backend (Supabase, proyecto `titanlike`)

- `profiles`: nombre visible del jugador.
- `progress`: sagas desbloqueadas, mejor marca, registro de los Nueve, finales. Solo se escribe con `sync_progress`, que nunca hace bajar los valores.
- `leaderboard`: vista de la clasificación, visible solo para jugadores con sesión.
- Bucket privado `player-images`: cada jugador guarda su paquete de imágenes en su carpeta `<uid>/pack.json`.

Las imágenes de personajes no forman parte del repositorio ni del despliegue: cada jugador importa su propio paquete.

## Acceso con Google (pendiente de configurar)

1. Google Cloud Console → APIs y servicios → Credenciales → Crear ID de cliente OAuth (aplicación web).
2. URI de redirección autorizada: `https://bogzrcrunmgvmisfumpw.supabase.co/auth/v1/callback`.
3. Supabase → Authentication → Sign In / Providers → Google: pegar Client ID y Client Secret y activarlo.
4. Supabase → Authentication → URL Configuration: Site URL = la URL de Vercel, y añadirla también en Redirect URLs.
