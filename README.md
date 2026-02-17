# Stward Task

Aplicación de gestión de tareas estilo Kanban con tableros, columnas y tarjetas arrastrables.

## Stack

| Capa      | Tecnología                          |
|-----------|-------------------------------------|
| Frontend  | Next.js 14, React 18, Tailwind CSS, shadcn/ui, dnd-kit |
| Backend   | Django 5.1, Django Ninja (REST API) |
| Base de datos | PostgreSQL 16                   |
| Infra     | Docker Compose                      |

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose)
- Git

> No necesitas instalar Node.js, Python ni PostgreSQL localmente: todo corre en contenedores.

## Instalación rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/stward-task.git
cd stward-task

# 2. Crear archivo de variables de entorno
cp .env.example .env
# (Opcional) Edita .env para cambiar contraseñas

# 3. Levantar todos los servicios
docker compose up --build -d

# 4. Aplicar migraciones de Django
docker compose exec backend python manage.py migrate

# 5. (Opcional) Crear superusuario
docker compose exec backend python manage.py createsuperuser
```

## Acceso

| Servicio        | URL                          |
|-----------------|------------------------------|
| Frontend        | http://localhost:3000         |
| Backend API     | http://localhost:8000/api/    |
| Django Admin    | http://localhost:8000/admin/  |

## Puertos utilizados

| Servicio   | Puerto host | Puerto contenedor |
|------------|-------------|-------------------|
| Frontend   | 3000        | 3000              |
| Backend    | 8000        | 8000              |
| PostgreSQL | 5435        | 5432              |

## Estructura del proyecto

```
stward-task/
├── backend/                # Django + Django Ninja API
│   ├── apps/
│   │   ├── accounts/       # Modelo de usuario personalizado
│   │   └── projects/       # Boards, Columns, Tasks
│   ├── config/             # Settings, URLs, WSGI/ASGI
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # Next.js 14 + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── app/            # Pages (App Router)
│   │   ├── components/     # UI components (board, sidebar)
│   │   └── lib/            # API client, types, utils
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (borra la base de datos)
docker compose down -v

# Reconstruir después de cambios en Dockerfile o dependencias
docker compose up --build -d

# Crear nuevas migraciones tras cambiar modelos
docker compose exec backend python manage.py makemigrations

# Acceder al shell de Django
docker compose exec backend python manage.py shell
```

## Variables de entorno

Copia `.env.example` a `.env` y ajusta según necesidad:

| Variable            | Descripción                     | Default                        |
|---------------------|---------------------------------|--------------------------------|
| `POSTGRES_DB`       | Nombre de la base de datos      | `stward_db`                    |
| `POSTGRES_USER`     | Usuario de PostgreSQL           | `stward_user`                  |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL        | `changeme_in_production`       |
| `SECRET_KEY`        | Secret key de Django            | `replace-me-with-a-real-secret-key` |
| `DJANGO_DEBUG`      | Modo debug                      | `True`                         |
| `ALLOWED_HOSTS`     | Hosts permitidos (CSV)          | `localhost,127.0.0.1,0.0.0.0` |
