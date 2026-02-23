# 📋 Requerimientos del Proyecto — Stward Task

Este documento detalla todas las dependencias y el entorno necesario para que la aplicación funcione correctamente en desarrollo y producción.

---

## 🛠️ Requerimientos del Sistema
- **Node.js:** v18.0 o superior (Recomendado v20+)
- **Python:** v3.10 o superior
- **PostgreSQL:** v14 o superior (Base de datos principal)
- **Redis:** v6 o superior (Cola de tareas y caché)

---

## 🐍 Backend (Django + Ninja)
Ubicación: `/backend`

El archivo principal de dependencias es `backend/requirements.txt`.

### Principales librerías:
- **Django 5.1:** Framework base.
- **Django Ninja:** Para la API REST de alto rendimiento.
- **Psycopg2-binary:** Driver para PostgreSQL.
- **Celery & Redis:** Gestión de tareas asíncronas y notificaciones.
- **PyJWT:** Para la autenticación segura basada en tokens.
- **Gunicorn:** Servidor de aplicaciones para producción.

**Instalación:**
```bash
pip install -r backend/requirements.txt
```

---

## 🎨 Frontend (Next.js + Tailwind)
Ubicación: `/frontend`

Las dependencias se gestionan a través de `frontend/package.json`.

### Principales librerías:
- **Next.js 14:** React framework con App Router.
- **Tailwind CSS:** Sistema de estilos.
- **Lucide React:** Iconografía.
- **Recharts:** Dashboard y gráficas interactivas.
- **Radix UI:** Componentes de accesibilidad (Checkbox, Progress, etc.).
- **TanStack Query:** Gestión de estado y caché de servidor.
- **Zustand:** Gestión de estado global de la UI.

**Instalación:**
```bash
cd frontend
npm install
```

---

## 🚀 Entorno (Variables de Entorno)
Crea un archivo `.env` en las carpetas correspondientes con los siguientes valores base:

### Backend (`/backend/.env`)
```env
SECRET_KEY=tu_clave_secreta_aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
POSTGRES_DB=stward_db
POSTGRES_USER=stward_user
POSTGRES_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Frontend (`/frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## ✅ Verificación Final
Para confirmar que todo está listo, puedes ejecutar los builds de validación:

- **Backend:** `python manage.py check`
- **Frontend:** `npm run build` (en la carpeta frontend)
