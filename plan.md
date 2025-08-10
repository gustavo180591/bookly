# Plan de Trabajo – Bookly (SvelteKit 2 + Svelte 5 + Prisma + PostgreSQL + Docker + Tailwind 4)

> **Meta**: Clonar, configurar y tener **Bookly** funcionando en minutos; luego iterar con calidad de código, seguridad básica, tests y deploy productivo.

---

## 0) Requisitos previos
- Node.js 20+ y npm
- Docker Desktop (opcional pero recomendado)
- Cuenta en proveedor de DB gestionada (Neon / Supabase / Railway) para producción
- Editor con ESLint + Prettier (VSCode con extensiones)

---

## 1) Arranque del proyecto (local)
1. **Clonar repositorio**  
   ```bash
   git clone <URL_DEL_REPO> bookly && cd bookly
   ```
2. **Variables de entorno**  
   ```bash
   cp .env.example .env
   # Editar: ADMIN_PASSWORD, ADMIN_EMAIL, CSRF_SECRET, DATABASE_URL, ORIGIN y SMTP_*
   ```
3. **Instalar dependencias**  
   ```bash
   npm i
   ```
4. **Prisma** (generar cliente, empujar esquema y sembrar datos)  
   ```bash
   npm run prisma:generate
   npm run prisma:push
   npm run prisma:seed
   ```
5. **Levantar el entorno**  
   - **Modo normal**: `npm run dev`  
   - **Con Docker (app + DB)**: `npm run dev:docker`

**Listo:** Landing en `http://localhost:5173`, panel admin en `/admin`.

---

## 2) Estructura funcional (qué hace cada pieza)
- **Landing (`/`)**: Formulario con validación cliente/servidor, estados de carga, éxito/error.
- **Persistencia**: Prisma + PostgreSQL, modelo `Contact` y `AdminSession`.
- **Email**: Notificación a admin (Nodemailer). Si no configurás SMTP, usa Ethereal de prueba (link en consola).
- **Admin `/admin`**: Login por contraseña (`ADMIN_PASSWORD`).  
  Tabla de contactos con **búsqueda**, **filtros** y **ordenamiento**. Exportación **CSV**.
- **SEO/Perf**: Metadatos, Open Graph, `robots.txt`, `sitemap.xml`, prerender donde aplica, enfoque Lighthouse.
- **Seguridad**: CSRF cookie + header, sanitización, validación Zod, headers de seguridad, cookies seguras.

---

## 3) Paso a paso de desarrollo (checklist operativo)

### 3.1 Base del proyecto
- [x] Confirmar versiones de `svelte`, `@sveltejs/kit`, `tailwindcss` y `prisma` (actualizar si aplica).
- [ ] Revisar `svelte.config.js` (adapter Node por defecto, cambiar para Vercel si corresponde).
- [ ] Verificar `vite.config.ts` y `tailwind.config.ts` (paths correctos).
- [ ] Ejecutar `npm run lint` y `npm run format` para baseline de estilo.

### 3.2 Base de datos y Prisma
- [x] Ajustar `DATABASE_URL` en `.env` para local y/o Docker.
- [x] `npm run prisma:generate` (cliente preparado).
- [x] `npm run prisma:push` (sin migraciones, usa db push para ejemplo).
- [x] `npm run prisma:seed` (datos semilla `Contact`).

### 3.3 Formulario de Landing
- [ ] Validación **cliente** (inputs con errores visibles, `aria-*`, focus).
- [ ] Validación **servidor** (Zod en acción del form, `fail(400)` con mapa de errores).
- [ ] **Sanitizar** `name` y `message` (DOMPurify del lado servidor).
- [ ] **CSRF**: Confirmar cookie firmada + header `x-csrf-token` en submit.
- [ ] **Email**: Recibir notificación al admin; si Ethereal, copiar **Preview URL** de consola.
- [ ] Guardado en DB y mensaje de éxito con reset del form.

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
