# Hartman Web — Perfil de Valores Hartman

Aplicación Next.js para administrar y aplicar el test axiológico de Hartman. Genera informes PDF y Word a partir de los rankings de valores, y los entrega por email vía Mailgun.

## Rutas

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Landing con acceso a modo profesional y test online | Público |
| `/admin` | Formulario manual + descarga de informes PDF y Word | Protegido con contraseña |
| `/test` | Test online multi-paso para el evaluado | Público |

## Arquitectura

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── admin/page.tsx              # Modo profesional
│   ├── test/page.tsx               # Test online (wizard multi-paso)
│   └── api/
│       ├── admin/auth/route.ts     # Valida contraseña de admin
│       ├── generate/route.ts       # Genera PDF+Word y devuelve base64
│       └── iahrsubmit/route.ts     # Genera y envía informes por email
├── components/
│   ├── PasswordGate.tsx            # Protección con contraseña
│   ├── PersonalDataForm.tsx        # Datos personales del evaluado
│   └── WorldRankingForm.tsx        # Ranking de los 18 axiogramas por mundo
└── lib/hartman/
    ├── domain/                     # Axiogramas, mundos, dimensiones
    ├── generator/                  # PDF (TypeScript), Word, email
    ├── quick-test/                 # Tipos, mapeo de respuestas, esquemas
    └── world-calculator.ts         # Cálculo de valores axiológicos
```

## Flujo de datos

```
Respuestas (rankings 1-18 × 18 ítems × 2-3 mundos)
  → world-calculator  →  WorldValues por mundo
  → pdf-provider      →  PDF (TypeScript)
  → word-generator    →  .docx
  → email-service     →  Mailgun
```

## Configuración

Copia `.env.local.example` a `.env.local` y rellena los valores:

```bash
cp .env.local.example .env.local
```

| Variable | Descripción |
|----------|-------------|
| `ADMIN_PASSWORD` | Contraseña para acceder a `/admin` |
| `MAILGUN_API_KEY` | API key de Mailgun |
| `MAILGUN_DOMAIN` | Dominio de Mailgun |
| `MAILGUN_FROM_EMAIL` | Email remitente |
| `MAILGUN_FROM_NAME` | Nombre remitente |
| `MAILGUN_TO_EMAIL` | Email destinatario de los informes |

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # Vitest
npm run lint     # ESLint
npm run build    # Build de producción
```

## API endpoints

### `POST /api/admin/auth`
Valida la contraseña de administrador.
```json
{ "password": "..." }
```

### `POST /api/generate`
Genera PDF y Word y los devuelve como base64. Requiere contraseña.
```json
{
  "password": "...",
  "request": { "clave": "...", "edad": "...", "responses": [...] },
  "reportType": "COMPLETE",
  "wordType": "COMPLETE"
}
```
Respuesta: `{ "pdf": "<base64>", "word": "<base64>", "filename": "..." }`

### `POST /api/iahrsubmit`
Genera informes y los envía por email vía Mailgun.
```json
{
  "clave": "...", "edad": "...", "sexo": "...",
  "estadoCivil": "...", "hijos": "...", "profesión": "...",
  "metodoInput": "test-online",
  "responses": [1, 5, 3, ...]
}
```
`responses`: 36 valores (externo + interno) o 54 (+ sexual). Cada grupo de 18 usa los valores 1–18 sin repetir.
