# Plan de Trabajo – Bookly (v2)
SvelteKit 2 · Svelte 5 · Prisma · PostgreSQL · Docker · Tailwind CSS 4 · TypeScript · Nodemailer

> **Objetivo**: Tener **Bookly** corriendo end‑to‑end (formulario → DB → email → admin) en minutos; luego cerrar calidad (lint, tests, SEO/A11y) y dejar listo para deploy.

---

## 1) ¿Qué tiene que hacer el sistema? (Alcance funcional)

### Landing inteligente
- Formulario de contacto con **validación en cliente y servidor** (errores accesibles, loading, éxito).
- **Guarda** los envíos en **PostgreSQL** vía **Prisma**.
- **Notifica** al admin por email (SMTP; si no hay SMTP real, usa **Ethereal** de prueba y muestra URL de preview en consola).
- Optimización **SEO/Performance**: metadatos, Open Graph, `robots.txt`, `sitemap.xml`, buen puntaje Lighthouse.
- **Accesibilidad**: labels, `aria-*`, estados de foco y contraste correcto.

### Panel `/admin`
- **Login** protegido por contraseña (`ADMIN_PASSWORD` en `.env`) con cookie httpOnly.
- **Tabla de contactos** con **búsqueda** (name/email/message), **filtros** (`status`), **ordenamiento** (fecha/nombre/email).
- **Exportar CSV** de contactos.
- (Opcional corto) **Paginación** y edición de `status`/`tags`.

### Arquitectura y calidad
- Código modular con **TypeScript estricto**, ESLint + Prettier, estructura clara.
- **Prisma** con `Contact` y `AdminSession`.
- **CSRF**, sanitización de entradas y headers de seguridad.
- Tests **unitarios (Vitest)** y un **E2E (Playwright)**.

### Deploy
- Instrucciones para **Vercel** (adapter‑vercel), **Fly.io** (adapter‑node) o **Railway**.
---

## 2) Requisitos previos
- Node.js 20+, npm
- Docker Desktop (opcional pero recomendado)
- Editor con ESLint + Prettier (VSCode)
- (Prod) Cuenta de DB gestionada (Neon/Supabase/Railway) y SMTP real

---

## 3) Variables de entorno (.env)

Usá como base (local/Docker con servicio `db` y app en puerto **3001**):

```dotenv
# DB
DATABASE_URL="postgresql://postgres:postgres@db:5432/bookly?schema=public"

# Admin
ADMIN_PASSWORD="cambiame-fuerte"
ADMIN_EMAIL="admin@example.com"

# Seguridad
CSRF_SECRET="clave-super-secreta"
ORIGIN="http://localhost:3001"

# SMTP (vacío => Ethereal de prueba)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
NODE_ENV="development"
```

En producción: cambiá `ADMIN_PASSWORD`, `CSRF_SECRET`, `DATABASE_URL`, `ORIGIN` y configura SMTP real.

## 4) Puesta en marcha (paso a paso)
### 4.1. Clonar e instalar
```bash
git clone <URL_DEL_REPO> bookly && cd bookly
cp .env.example .env   # o pegá el bloque de arriba y ajustá
npm install
```
### 4.2. Prisma (cliente + esquema + seed)
Ejecutá dentro del contenedor app si usás Docker; o en host si corrés sin Docker.
```bash
# Generar cliente
npx prisma generate
# Sincronizar esquema con la DB
npx prisma db push
# Sembrar datos de ejemplo
npx tsx prisma/seed.ts   # o npm run prisma:seed si lo tenés en scripts
```
### 4.3. Ejecutar la app (puerto 3001)
Modo desarrollo (host):
```bash
npm run dev -- --port 3001
# http://localhost:3001
```
Producción local (host):
```bash
npm run build
npm run preview -- --port 3001   # o npm run start si definiste "start": "PORT=3001 node build"
```
Docker (si ya tenés tu compose):
```bash
docker compose up -d
# Prisma dentro del contenedor:
docker compose exec app sh -lc "npx prisma generate && npx prisma db push && npx tsx prisma/seed.ts"
```
### 4.4. Smoke test
- Salud: http://localhost:3001/api/health → { "ok": true }
- Landing: http://localhost:3001/ (enviá el formulario)
- Logs del servidor: debería aparecer Preview URL de Ethereal.
- Admin: http://localhost:3001/admin (login con ADMIN_PASSWORD).
- Export CSV: http://localhost:3001/admin/contacts/export

## 5) Aceptación por funcionalidad (checks rápidos)
### 5.1 Landing + Form
- Validación cliente/servidor correcta; mensajes accesibles; loading visible.
- Envíos se persisten en Contact.
- Llega email al admin (o Preview URL si Ethereal).
- Lighthouse ≥ 90 (Perf/SEO/A11y/Best Practices).
- robots.txt y sitemap.xml sirven contenido correcto.

### 5.2 Panel Admin
- Login crea cookie httpOnly y redirige a /admin/contacts.
- Búsqueda por nombre/email/mensaje (insensible a mayúsculas).
- Filtros por status (NEW/REVIEWED/REPLIED).
- Ordenamiento por fecha/nombre/email (asc/desc).
- Export CSV descarga contacts.csv con headers y fechas ISO.

### 5.3 Seguridad
- CSRF activo: POST sin token → 403.
- Sanitización en servidor para name y message.
- Headers: X-Frame-Options=DENY, NoSniff, Referrer-Policy.
- Cookies seguras (secure en prod) y sameSite=lax.

## 6) Calidad y pruebas
### 6.1 Lint/Formato/TS
```bash
npm run lint
npm run format
# TS strict: true sin any silenciosos.
```
### 6.2 Tests
Unit (Vitest): utils (csv, validaciones, etc.).
```bash
npm run test
```
E2E (Playwright): flujo de envío de formulario.
```bash
npx playwright install
npm run test:e2e
```
Si tus tests usan URL fija, asegurate que apunten a http://localhost:3001 o usa BASE_URL en .env.test.

## 7) Deploy
### 7.1 Vercel
- Usa @sveltejs/adapter-vercel y commitea.
- Conecta repo en Vercel y define envs (DATABASE_URL, ADMIN_PASSWORD, CSRF_SECRET, ADMIN_EMAIL, SMTP_*, ORIGIN=https://tu-dominio).
- DB gestionada (Neon/Supabase/Railway).
- Build: prisma generate y (si usás migraciones) prisma migrate deploy.

### 7.2 Fly.io (Node server propio en 3001 o 3000)
- fly launch (app + Postgres opcional).
- fly secrets set con las envs.
- Release command para prisma generate + migrate deploy.
- Health checks y escala.

### 7.3 Railway
- Crea proyecto y añade PostgreSQL.
- Deploy del repo; DATABASE_URL se inyecta.
- Seteá el resto de variables; probá /api/health.

## 8) Solución de problemas (rápido)
- "Port 3000 is already in use": usá --port 3001 o PORT=3001 en start.
- "Cannot find module '/app/build'": faltó npm run build antes de start (adapter‑node).
- "module is not defined" en dev SSR: corré npm run preview/start (build) o asegura ESM correcto y evita incompatibilidades de CJS.
- Dentro del contenedor "docker: not found": los comandos docker compose se ejecutan desde host. Dentro del contenedor corré npm/npx directamente.
- "prisma: not found": faltan dependencias en el contenedor → npm install dentro de app.
- 403 CSRF: revisá ORIGIN y que el token/encabezado viajen desde el submit normal.
- No llega email: configura SMTP; sin SMTP, usá la Preview URL de Ethereal que aparece en logs.
- Playwright falla: npx playwright install y corré con la URL correcta.

## 9) Roadmap inmediato (mejoras rápidas)
- Paginación en /admin/contacts con take/skip y controles UI.
- Acción inline para cambiar status y añadir tags.
- Rate limiting del POST del formulario (Redis).
- Email de confirmación al usuario.
- CI/CD con GitHub Actions (lint + tests).

## 10) Definition of Done (DoD)
- Formulario: validación/CSRF/sanitización + persistencia + email.
- Admin: login + tabla con búsqueda/filtro/orden + export CSV.
- SEO/A11y ok; Lighthouse ≥ 90.
- Código: TS estricto, ESLint/Prettier sin issues relevantes.
- Tests: al menos 1 unit + 1 E2E verdes.
- .env.example y README actualizados.
- Instrucciones de deploy verificadas (1 proveedor).

Listo. Con esto, Bookly queda claro: qué hace, cómo arrancarlo y cómo comprobar que todo funciona.
- [x] Confirmar versiones de `svelte`, `@sveltejs/kit`, `tailwindcss` y `prisma` (actualizar si aplica).
- [x] Revisar `svelte.config.js` (adapter Node por defecto, cambiar para Vercel si corresponde).
- [x] Verificar `vite.config.ts` y `tailwind.config.ts` (paths correctos).
- [x] Ejecutar `npm run lint` y `npm run format` para baseline de estilo.

### 3.2 Base de datos y Prisma
- [x] Ajustar `DATABASE_URL` en `.env` para local y/o Docker.
- [x] `npm run prisma:generate` (cliente preparado).
- [x] `npm run prisma:push` (sin migraciones, usa db push para ejemplo).
- [x] `npm run prisma:seed` (datos semilla `Contact`).

### 3.3 Formulario de Landing
- [x] Validación **cliente** (inputs con errores visibles, `aria-*`, focus).
- [x] Validación **servidor** (Zod en acción del form, `fail(400)` con mapa de errores).
- [x] **Sanitizar** `name` y `message` (DOMPurify del lado servidor).
- [x] **CSRF**: Confirmar cookie firmada + header `x-csrf-token` en submit.
- [x] **Email**: Recibir notificación al admin; si Ethereal, copiar **Preview URL** de consola.
- [x] Guardado en DB y mensaje de éxito con reset del form.

### 3.4 Panel Admin
- [ ] Login con `ADMIN_PASSWORD` (cookie httpOnly + `sameSite=lax` + `secure` en prod).
- [ ] Tabla de contactos:  
  - [ ] **Búsqueda** por `name/email/message` (insensitive).  
  - [ ] **Filtros** por `status` (NEW/REVIEWED/REPLIED).  
  - [ ] **Ordenamiento** por `createdAt/name/email` asc/desc.  
  - [ ] **Paginación** (opcional, `take`/`skip` si crece).
- [ ] **Export CSV** (`/admin/contacts/export`) con headers correctos.
- [ ] (Opcional) Acciones inline: cambiar `status`, añadir tags.

### 3.5 SEO y Accesibilidad
- [ ] `<title>` y `<meta name="description">` adecuados.
- [ ] Open Graph y Twitter Card (imagen en `/static/og-image.jpg`). 
- [ ] `robots.txt` y `sitemap.xml` servidos correctamente.
- [ ] **Accesibilidad**: labels, `aria-invalid`, `aria-describedby`, focus visible, contraste.
- [ ] **Performance**: pocas dependencias, preconnect fuentes, evitar JS innecesario.

### 3.6 Seguridad básica
- [ ] CSRF activo y funcionando en acciones POST.
- [ ] Sanitización de entradas de usuario (servidor).
- [ ] Validación estricta con Zod (longitudes, email).
- [ ] Headers de seguridad en `hooks.server.ts` (X-Frame-Options, NoSniff, Referrer-Policy).
- [ ] Cookies seguras en producción (https).
- [ ] (Recomendado) **Rate limiting** para el form (p.ej., Redis + sliding window).

### 3.7 Calidad de código
- [ ] ESLint (sin warnings relevantes en CI).
- [ ] Prettier (formato consistente).
- [ ] TypeScript `strict: true` (sin `any` silenciosos).
- [ ] Componentes desacoplados y utils puras (CSV, validation, email).

### 3.8 Tests
- **Unit (Vitest)**  
  - [ ] Utils `toCSV` y cualquier lógica pura.  
- **E2E (Playwright)**  
  - [ ] Flujo básico del formulario (fill + submit + feedback).  
  - [ ] (Opcional) Login admin y ver tabla.  

```bash
npm run test       # unit
npm run test:e2e   # e2e
```

---

## 4) Experiencia de desarrollo (DX)
- [ ] `npm run dev:docker` levanta **db + app** y corre Prisma seed automáticamente.
- [ ] Hot reload con volúmenes montados en Docker.
- [ ] `.env.example` completo y claro (DB, Admin, CSRF, ORIGIN, SMTP).
- [ ] `README.md` con pasos de setup, desarrollo, tests y deploy.

---

## 5) Deploy

### 5.1 Vercel
1. Cambiar adapter a `@sveltejs/adapter-vercel` **o** mantener Node si usás Serverless Functions custom.  
2. Conectar repo a Vercel.  
3. Variables en panel: `DATABASE_URL`, `ADMIN_PASSWORD`, `CSRF_SECRET`, `ADMIN_EMAIL`, `SMTP_*`.  
4. Post-build: `prisma generate` y `prisma migrate deploy` (si usás migraciones).  
5. DB gestionada (Neon/Supabase/Railway).  
6. Verificar `ORIGIN` con dominio final para cookies seguras.

### 5.2 Fly.io
1. `fly launch` (app Node + Postgres).  
2. `fly secrets set` con todas las envs.  
3. Release command para `prisma generate` y migraciones.  
4. Health checks y escala 0→1 (opc).

### 5.3 Railway (muy simple)
1. Crear proyecto > **Add PostgreSQL**.  
2. Deploy del repo (auto).  
3. `DATABASE_URL` se inyecta; setear el resto de variables.  
4. Ver logs y probar `/api/health`.

---

## 6) Post‑deploy (smoke & hardening)
- [ ] Probar formulario real con SMTP productivo.
- [ ] Confirmar cookies `secure` y `sameSite=lax` en producción.
- [ ] Revisar reporte Lighthouse (Perf/SEO/A11y/Best Practices ≥ 90).
- [ ] Configurar dominio y SSL (si aplica al proveedor).
- [ ] Agregar observabilidad básica: logs estructurados y avisos de error.

---

## 7) Roadmap sugerido (sprint corto)
- [ ] **Paginación** y **edición** de contactos en admin.
- [ ] **Rate limiting** en POST del form.
- [ ] **ReCaptcha** (invisible o checkbox) si recibís spam.
- [ ] **Email de confirmación** al usuario (doble notificación).
- [ ] **Tags automáticos** por idioma o keywords.
- [ ] **CI/CD** con GitHub Actions (lint, test, build, deploy).

---

## 8) Comandos útiles (resumen)
```bash
# Setup local
cp .env.example .env
npm i
npm run prisma:generate && npm run prisma:push && npm run prisma:seed
npm run dev

# Con Docker
npm run dev:docker

# Lint, formato y tests
npm run lint
npm run format
npm run test
npm run test:e2e
```

---

## 9) Checklist de “Definition of Done” (DoD)
- [ ] Formulario funcional con validación, sanitización y CSRF.
- [ ] Contacto guardado en DB y email enviado al admin.
- [ ] Admin con login por contraseña (env) y tabla con búsqueda/filtros/orden.
- [ ] Exportación CSV disponible.
- [ ] SEO listo (metas, OG, robots, sitemap) y Lighthouse ≥ 90.
- [ ] ESLint + Prettier sin issues críticos; TS strict OK.
- [ ] Tests unit + e2e mínimos en verde.
- [ ] README completo y `.env.example` actualizado.
- [ ] Instrucciones de deploy verificadas (al menos un proveedor).

---

**Hecho.** Cuando marqué todo esto, Bookly no sólo “anda”: está **presentable, mantenible y listo para crecer**.
