# Despliegue en VPS con EasyPanel

## Arquitectura

```
Internet
   │
   ├── admin.mapadevalores.com ──┐
   └── test.mapadevalores.com  ──┤→ Traefik (EasyPanel) → contenedor :80
                                  │        SSL automático (Let's Encrypt)
                                  │
                              Next.js middleware
                              ├── /admin  (pantalla de administración)
                              └── /test   (formulario de evaluación)
```

- **Traefik** gestiona el SSL y enruta el tráfico externo (80/443) al contenedor interno (puerto 80).
- El **middleware de Next.js** (`src/middleware.ts`) lee el header `Host` y hace el rewrite interno por subdominio.

---

## Prerequisitos

1. DNS configurado en tu registrador de dominios:

   | Tipo | Nombre | Destino |
   |------|--------|---------|
   | A | `admin.mapadevalores.com` | IP del VPS |
   | A | `test.mapadevalores.com` | IP del VPS |

2. EasyPanel instalado en el VPS (`easypanel.io/docs/installation`).
3. Repositorio accesible desde EasyPanel (GitHub, GitLab, o Gitea self-hosted).

---

## Paso 1: Crear el proyecto

1. Iniciar sesión en EasyPanel → **Create Project**
2. Nombre: `hartman`

---

## Paso 2: Crear el servicio

1. Dentro del proyecto `hartman` → **Create Service** → **App**
2. Nombre: `web`
3. **Source** → GitHub → conectar repositorio → rama `main`
4. **Build method** → Dockerfile
5. **Dockerfile path**: `Dockerfile.nextjs`
6. Guardar

---

## Paso 3: Volumen para la base de datos SQLite

En la pestaña **Mounts** del servicio:

- **Add Mount** → Volume
- Name: `hartman-db`
- Mount path: `/data`

> El volumen `/data` persiste entre redeployments. La base de datos se almacena en `/data/db.sqlite`.

---

## Paso 4: Variables de entorno

En la pestaña **Environment**:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `file:/data/db.sqlite` |
| `ADMIN_PASSWORD` | tu contraseña segura |
| `NODE_ENV` | `production` |

---

## Paso 5: Dominios

En la pestaña **Domains**, añadir dos entradas:

| Domain | Port | HTTPS |
|--------|------|-------|
| `admin.mapadevalores.com` | `80` | ✅ (Let's Encrypt automático) |
| `test.mapadevalores.com` | `80` | ✅ |

---

## Paso 6: Deploy

1. Click **Deploy** en EasyPanel
2. **Build Logs** — la imagen tarda ~2-3 min en construirse
3. **Runtime Logs** — confirmar que aparece:
   ```
   Applied 1 migration: 20260219151427_init
   ```
4. El servidor arranca en el puerto 80

---

## Verificación

| Test | URL | Resultado esperado |
|------|-----|--------------------|
| Test público | `https://test.mapadevalores.com` | Formulario de evaluación |
| Admin | `https://admin.mapadevalores.com` | Pantalla de login |
| Envío de test | Completar formulario | Respuesta 200, registro guardado |
| Generación PDF/Word | Login en admin → generar informe | Descarga de ambos archivos |

### Comprobar la base de datos (terminal EasyPanel)

```bash
ls -la /data/
# Debe existir db.sqlite con datos tras el primer envío
```

---

## Redeployments

Cada push a `main` puede disparar un redeploy automático desde EasyPanel (configurar en **General** → **Auto Deploy**). El comando de arranque ejecuta `prisma migrate deploy` en cada inicio, por lo que las migraciones nuevas se aplican automáticamente sin intervención manual.

---

## Notas

- **Puerto 80 interno**: El contenedor escucha en el puerto 80. Traefik gestiona externamente los puertos 80 (redirect a HTTPS) y 443 (HTTPS).
- **SQLite en producción**: Válido para carga baja-media. El volumen `/data` garantiza persistencia. Si se necesita escalar horizontalmente en el futuro, migrar a PostgreSQL.
- **Sin email**: El servicio de email fue eliminado del proyecto. No se necesitan variables de Mailgun.
