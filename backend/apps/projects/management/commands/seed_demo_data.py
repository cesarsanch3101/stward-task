"""
Management command: seed_demo_data
Creates a realistic demo environment with named users, workspaces,
boards, tasks, comments and assignments to validate all system features.

Usage:
    docker compose exec backend python manage.py seed_demo_data
    docker compose exec backend python manage.py seed_demo_data --reset
"""
import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User
from apps.projects.models import (
    Board,
    Column,
    ColumnStatus,
    Notification,
    NotificationType,
    Task,
    TaskAssignment,
    TaskComment,
    CommentSource,
    Workspace,
)


# ─────────────────────────────────────────────────
# Demo dataset
# ─────────────────────────────────────────────────
USERS = [
    {
        "email": "carlos@stwards.com",
        "username": "carlos@stwards.com",
        "first_name": "Carlos",
        "last_name": "Martínez",
        "password": "demo123",
        "role": "developer",
    },
    {
        "email": "ana@stwards.com",
        "username": "ana@stwards.com",
        "first_name": "Ana",
        "last_name": "Rodríguez",
        "password": "demo123",
        "role": "developer",
    },
    {
        "email": "pedro@stwards.com",
        "username": "pedro@stwards.com",
        "first_name": "Pedro",
        "last_name": "López",
        "password": "demo123",
        "role": "manager",
    },
    {
        "email": "laura@stwards.com",
        "username": "laura@stwards.com",
        "first_name": "Laura",
        "last_name": "Chen",
        "password": "demo123",
        "role": "developer",
    },
]

COLORS = ["#0073ea", "#33d391", "#e2445c", "#ffcb00", "#00a9ff", "#9d50bb", "#ff758c"]

TODAY = date.today()

# Each workspace: name, description, boards[]
# Each board: name, tasks per column {pending, in_progress, delayed, completed}
WORKSPACES_DATA = [
    {
        "name": "Stward Plataforma",
        "description": "Desarrollo del producto principal de Stward Task",
        "boards": [
            {
                "name": "Sprint 5 — Core Features",
                "description": "Funcionalidades principales del Q1 2026",
                "tasks": {
                    "pending": [
                        {
                            "title": "Implementar autenticación OAuth con Google",
                            "description": "Permitir login con cuenta Google para simplificar el onboarding.",
                            "priority": "high",
                            "assignees": ["pedro", "carlos"],
                            "start": 3, "duration": 8,
                            "comments": [
                                ("pedro", "Revisé la documentación de Google OAuth 2.0, podemos usar la librería `python-social-auth`."),
                                ("carlos", "De acuerdo. Agrego al backlog técnico para esta semana."),
                            ],
                        },
                        {
                            "title": "Diseñar pantalla de onboarding",
                            "description": "Flujo de bienvenida para nuevos usuarios con tutorial interactivo.",
                            "priority": "medium",
                            "assignees": ["ana"],
                            "start": 5, "duration": 6,
                            "comments": [],
                        },
                        {
                            "title": "API de exportación a CSV/Excel",
                            "description": "Exportar tareas de un tablero en formato CSV y XLSX.",
                            "priority": "low",
                            "assignees": ["carlos"],
                            "start": 10, "duration": 5,
                            "comments": [],
                        },
                        {
                            "title": "Integración con Slack — notificaciones",
                            "description": "Enviar notificaciones a canales de Slack cuando una tarea se mueve.",
                            "priority": "medium",
                            "assignees": ["carlos", "laura"],
                            "start": 8, "duration": 7,
                            "comments": [
                                ("laura", "¿Usamos Incoming Webhooks o la API de bots? Los webhooks son más simples."),
                            ],
                        },
                    ],
                    "in_progress": [
                        {
                            "title": "Panel de administración de miembros",
                            "description": "Permitir al owner invitar, eliminar y cambiar roles de miembros del workspace.",
                            "priority": "high",
                            "assignees": ["pedro", "carlos"],
                            "individual_progress": [60, 45],
                            "start": -5, "duration": 10,
                            "comments": [
                                ("pedro", "Backend listo. Carlos está terminando el frontend del modal de invitación."),
                                ("carlos", "El formulario de invite está casi listo, falta el manejo de errores 409 (email ya existe)."),
                                ("pedro", "Perfecto, lo revisamos en la daily de mañana."),
                            ],
                        },
                        {
                            "title": "Sistema de etiquetas para tareas",
                            "description": "Tags de color con texto libre para categorizar tareas dentro de un tablero.",
                            "priority": "medium",
                            "assignees": ["ana", "laura"],
                            "individual_progress": [70, 30],
                            "start": -3, "duration": 7,
                            "comments": [
                                ("ana", "El diseño de los chips de colores está listo. Compartí el Figma en el canal."),
                                ("laura", "Revisé el diseño, se ve muy bien. Empiezo con los tests unitarios del modelo."),
                            ],
                        },
                        {
                            "title": "Modo offline con Service Worker",
                            "description": "Cachear datos básicos del tablero para que la app funcione sin conexión.",
                            "priority": "low",
                            "assignees": ["carlos"],
                            "individual_progress": [25],
                            "start": -2, "duration": 12,
                            "comments": [],
                        },
                    ],
                    "delayed": [
                        {
                            "title": "Migración a PostgreSQL 17",
                            "description": "Actualizar la base de datos a la versión 17 con mejoras de performance.",
                            "priority": "urgent",
                            "assignees": ["pedro", "carlos", "laura"],
                            "individual_progress": [20, 35, 10],
                            "start": -20, "duration": 15,
                            "comments": [
                                ("pedro", "Bloqueado por un bug en pgvector con PG17. Esperando el fix del upstream."),
                                ("carlos", "Abrí un issue en el repo de pgvector. Por ahora bloqueamos la migración."),
                                ("laura", "Actualicé el JIRA con el link al issue. ETA: próxima semana según el maintainer."),
                                ("pedro", "Gracias Laura. Escalamos prioridad a URGENTE."),
                            ],
                        },
                        {
                            "title": "Tests E2E — flujo de pagos",
                            "description": "Playwright tests para el flujo completo de suscripción y pago con Stripe.",
                            "priority": "high",
                            "assignees": ["laura"],
                            "individual_progress": [15],
                            "start": -10, "duration": 8,
                            "comments": [
                                ("laura", "El ambiente de Stripe sandbox tiene problemas intermitentes. Reporté al equipo de infra."),
                            ],
                        },
                    ],
                    "completed": [
                        {
                            "title": "Sistema de notificaciones in-app",
                            "description": "Campana en el sidebar con badge de no leídas y polling de 30 segundos.",
                            "priority": "high",
                            "assignees": ["carlos", "ana"],
                            "individual_progress": [100, 100],
                            "start": -25, "duration": 10,
                            "comments": [
                                ("carlos", "Backend completo: endpoints list, count, mark-read, mark-all-read."),
                                ("ana", "Componente NotificationBell integrado en el sidebar. Funciona el badge."),
                                ("pedro", "Revisado en staging. ✅ Todo funciona correctamente."),
                            ],
                        },
                        {
                            "title": "Dark mode con persistencia",
                            "description": "Toggle de tema claro/oscuro que persiste en localStorage.",
                            "priority": "medium",
                            "assignees": ["ana"],
                            "individual_progress": [100],
                            "start": -30, "duration": 4,
                            "comments": [
                                ("ana", "Implementado con next-themes. Persiste en localStorage y respeta prefers-color-scheme."),
                            ],
                        },
                        {
                            "title": "Paginación en listados de workspaces y boards",
                            "description": "PageNumberPagination con page_size=20 en endpoints /workspaces y /boards.",
                            "priority": "medium",
                            "assignees": ["carlos"],
                            "individual_progress": [100],
                            "start": -35, "duration": 3,
                            "comments": [],
                        },
                        {
                            "title": "CI/CD Pipeline con GitHub Actions",
                            "description": "Pipeline de 7 jobs: lint → test → build → E2E → SBOM → security scan.",
                            "priority": "high",
                            "assignees": ["pedro", "laura"],
                            "individual_progress": [100, 100],
                            "start": -40, "duration": 8,
                            "comments": [
                                ("pedro", "Pipeline completo. Kill switch activado si Grype detecta vulnerabilidad CRITICAL."),
                            ],
                        },
                    ],
                },
            },
            {
                "name": "Bugs & Hotfixes",
                "description": "Seguimiento de bugs reportados en producción",
                "tasks": {
                    "pending": [
                        {
                            "title": "[BUG] Gantt no muestra tareas sin end_date",
                            "description": "Las tareas que no tienen fecha fin no aparecen en la lista izquierda del Gantt.",
                            "priority": "medium",
                            "assignees": ["carlos"],
                            "start": 2, "duration": 3,
                            "comments": [
                                ("laura", "Confirmado en prod. El filtro excluye tasks con end_date=null incorrectamente."),
                            ],
                        },
                        {
                            "title": "[BUG] Tooltip en barra de progreso no aparece en Safari",
                            "description": "El hover del segmented progress bar no dispara el tooltip en Safari 17.",
                            "priority": "low",
                            "assignees": ["ana"],
                            "start": 4, "duration": 2,
                            "comments": [],
                        },
                    ],
                    "in_progress": [
                        {
                            "title": "[BUG] MultipleObjectsReturned al eliminar tablero",
                            "description": "Error 500 al eliminar un tablero cuando el user es owner Y member del workspace.",
                            "priority": "urgent",
                            "assignees": ["carlos", "pedro"],
                            "individual_progress": [90, 80],
                            "start": -1, "duration": 2,
                            "comments": [
                                ("carlos", "Encontré la causa: faltaba .distinct() en BoardService.get_or_404. Fix aplicado."),
                                ("pedro", "Verificado en local. Deployando a staging."),
                            ],
                        },
                    ],
                    "delayed": [],
                    "completed": [
                        {
                            "title": "[BUG] Task create falla con assignee_name=NULL",
                            "description": "IntegrityError al crear tarea si no se pasa assignee_name.",
                            "priority": "high",
                            "assignees": ["carlos"],
                            "individual_progress": [100],
                            "start": -15, "duration": 1,
                            "comments": [
                                ("carlos", "Fix: usar exclude_none=True en payload.dict() antes de crear la tarea."),
                            ],
                        },
                    ],
                },
            },
        ],
    },
    {
        "name": "Marketing & Diseño",
        "description": "Campañas de marketing y proyectos de diseño de marca",
        "boards": [
            {
                "name": "Campaña Q1 2026",
                "description": "Lanzamiento del nuevo plan de precios y campaña de adquisición",
                "tasks": {
                    "pending": [
                        {
                            "title": "Crear landing page para plan Enterprise",
                            "description": "Diseño y desarrollo de la landing dedicada al plan Enterprise con tabla de precios.",
                            "priority": "high",
                            "assignees": ["ana", "pedro"],
                            "start": 2, "duration": 10,
                            "comments": [],
                        },
                        {
                            "title": "Configurar campaña Google Ads — Remarketing",
                            "description": "Segmentar audiencias de usuarios que visitaron pricing pero no convirtieron.",
                            "priority": "medium",
                            "assignees": ["pedro"],
                            "start": 7, "duration": 5,
                            "comments": [
                                ("pedro", "Presupuesto aprobado: $1,500 USD/mes. Inicio en semana 2 de marzo."),
                            ],
                        },
                    ],
                    "in_progress": [
                        {
                            "title": "Redactar email sequence de onboarding (5 emails)",
                            "description": "Secuencia de bienvenida para nuevos usuarios: día 1, 3, 7, 14, 30.",
                            "priority": "high",
                            "assignees": ["pedro", "ana"],
                            "individual_progress": [55, 40],
                            "start": -4, "duration": 8,
                            "comments": [
                                ("pedro", "Emails día 1 y 3 redactados. Ana está diseñando los templates HTML."),
                                ("ana", "Templates listos para email 1 y 2. Comparto los diseños esta tarde."),
                            ],
                        },
                    ],
                    "delayed": [
                        {
                            "title": "Video demo para Product Hunt launch",
                            "description": "Video de 2 min mostrando las features principales de Stward Task.",
                            "priority": "urgent",
                            "assignees": ["ana", "pedro"],
                            "individual_progress": [30, 20],
                            "start": -14, "duration": 10,
                            "comments": [
                                ("ana", "El proveedor de video marketing no entregó el guión a tiempo. Buscando alternativa."),
                                ("pedro", "Aprobé un freelancer de backup. Nuevo deadline: 28 de febrero."),
                            ],
                        },
                    ],
                    "completed": [
                        {
                            "title": "Actualizar página de Precios con nuevos planes",
                            "description": "Reflejar los 3 nuevos planes (Free, Pro, Enterprise) con tabla comparativa.",
                            "priority": "high",
                            "assignees": ["ana"],
                            "individual_progress": [100],
                            "start": -20, "duration": 5,
                            "comments": [
                                ("ana", "Página actualizada y en producción. SEO optimizado con schema markup."),
                                ("pedro", "Revisado y aprobado. Gran trabajo! 🎉"),
                            ],
                        },
                        {
                            "title": "Brief de marca — Guía de estilo",
                            "description": "Documento con paleta de colores, tipografía, logos y tono de voz.",
                            "priority": "medium",
                            "assignees": ["ana"],
                            "individual_progress": [100],
                            "start": -30, "duration": 7,
                            "comments": [],
                        },
                    ],
                },
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Crea datos de demo realistas: usuarios, workspaces, boards, tareas, comentarios y asignaciones."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Elimina los datos de demo existentes antes de crearlos.",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self._reset()

        with transaction.atomic():
            admin = self._ensure_admin()
            users = self._create_users()
            all_users = {"admin": admin, **users}
            self._create_workspaces(admin, all_users)

        self.stdout.write(self.style.SUCCESS("\n✅ Demo data cargado correctamente.\n"))
        self.stdout.write("Usuarios disponibles:")
        self.stdout.write("  admin@stwards.com  / admin123  (admin)")
        for u in USERS:
            self.stdout.write(f"  {u['email']:<30} / demo123")

    # ─────────────────────────────────────────────────
    def _reset(self):
        self.stdout.write(self.style.WARNING("⚠ Eliminando datos de demo anteriores..."))
        emails = [u["email"] for u in USERS]
        demo_users = User.objects.filter(email__in=emails)
        ws_names = [w["name"] for w in WORKSPACES_DATA]
        # Delete workspaces created by demo users (cascades to boards/tasks)
        Workspace.all_objects.filter(name__in=ws_names).delete()
        demo_users.delete()
        self.stdout.write("  Datos eliminados.")

    # ─────────────────────────────────────────────────
    def _ensure_admin(self):
        admin, created = User.objects.get_or_create(
            email="admin@stwards.com",
            defaults={
                "username": "admin@stwards.com",
                "first_name": "Admin",
                "last_name": "Stward",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin.set_password("admin123")
            admin.save()
            self.stdout.write(f"  Creado: {admin.email}")
        else:
            self.stdout.write(f"  Existe: {admin.email}")
        return admin

    def _create_users(self):
        users = {}
        self.stdout.write("\nUsuarios:")
        for u in USERS:
            key = u["first_name"].lower()  # 'carlos', 'ana', 'pedro', 'laura'
            obj, created = User.objects.get_or_create(
                email=u["email"],
                defaults={
                    "username": u["username"],
                    "first_name": u["first_name"],
                    "last_name": u["last_name"],
                    "role": u["role"],
                },
            )
            if created:
                obj.set_password(u["password"])
                obj.save()
                self.stdout.write(f"  Creado: {obj.get_full_name()} <{obj.email}>")
            else:
                self.stdout.write(f"  Existe: {obj.get_full_name()} <{obj.email}>")
            users[key] = obj
        return users

    def _create_workspaces(self, admin, users):
        self.stdout.write("\nWorkspaces y tableros:")
        for ws_data in WORKSPACES_DATA:
            ws, created = Workspace.objects.get_or_create(
                name=ws_data["name"],
                defaults={"owner": admin, "description": ws_data["description"], "created_by": admin},
            )
            if created:
                self.stdout.write(f"\n  📁 Workspace: {ws.name}")
            else:
                self.stdout.write(f"\n  📁 Workspace (existente): {ws.name}")

            # Add all users as members
            for u in users.values():
                ws.members.add(u)

            for board_data in ws_data["boards"]:
                self._create_board(ws, board_data, admin, users)

    def _create_board(self, ws, board_data, admin, users):
        board, created = Board.objects.get_or_create(
            name=board_data["name"],
            workspace=ws,
            defaults={"description": board_data["description"], "created_by": admin},
        )
        if created:
            # Create 4 standard columns
            columns = self._create_columns(board, admin)
            self.stdout.write(f"    📋 Board: {board.name} (nuevo)")
        else:
            # Load existing columns
            columns = {
                "pending": Column.objects.filter(board=board, status=ColumnStatus.PENDING).first(),
                "in_progress": Column.objects.filter(board=board, status=ColumnStatus.IN_PROGRESS).first(),
                "delayed": Column.objects.filter(board=board, status=ColumnStatus.DELAYED).first(),
                "completed": Column.objects.filter(board=board, status=ColumnStatus.COMPLETED).first(),
            }
            self.stdout.write(f"    📋 Board: {board.name} (existente, omitiendo tareas)")
            return  # Don't duplicate tasks in existing boards

        tasks_data = board_data.get("tasks", {})
        total = 0
        for col_key, task_list in tasks_data.items():
            col = columns.get(col_key)
            if not col:
                continue
            for order, task_data in enumerate(task_list):
                self._create_task(col, task_data, order, admin, users)
                total += 1

        self.stdout.write(f"       {total} tareas creadas")

    def _create_columns(self, board, admin):
        specs = [
            ("Pendiente",   0, ColumnStatus.PENDING,     "#6B7280"),
            ("En Progreso", 1, ColumnStatus.IN_PROGRESS, "#3B82F6"),
            ("Retrasado",   2, ColumnStatus.DELAYED,     "#F97316"),
            ("Completado",  3, ColumnStatus.COMPLETED,   "#22C55E"),
        ]
        cols = {}
        keys = ["pending", "in_progress", "delayed", "completed"]
        for (name, order, status, color), key in zip(specs, keys):
            col = Column.objects.create(
                board=board, name=name, order=order,
                status=status, color=color, created_by=admin,
            )
            cols[key] = col
        return cols

    def _create_task(self, column, task_data, order, admin, users):
        # Compute progress from column position
        total_cols = Column.objects.filter(board=column.board).count()
        if column.status == ColumnStatus.COMPLETED:
            progress = 100
        elif total_cols > 1:
            progress = round((column.order / (total_cols - 1)) * 100)
        else:
            progress = 0

        # Dates
        start_offset = task_data.get("start", 0)
        duration = task_data.get("duration", 5)
        start_date = TODAY + timedelta(days=start_offset)
        end_date = start_date + timedelta(days=duration)

        task = Task.objects.create(
            title=task_data["title"],
            description=task_data.get("description", ""),
            column=column,
            order=order,
            priority=task_data.get("priority", "medium"),
            progress=progress,
            start_date=start_date,
            end_date=end_date,
            created_by=admin,
        )

        # Assignments with individual_progress
        assignee_keys = task_data.get("assignees", [])
        individual_progresses = task_data.get("individual_progress", [])
        for i, key in enumerate(assignee_keys):
            user = users.get(key)
            if not user:
                continue
            ind_progress = individual_progresses[i] if i < len(individual_progresses) else progress
            TaskAssignment.objects.get_or_create(
                task=task,
                user=user,
                defaults={
                    "individual_progress": ind_progress,
                    "user_color": COLORS[i % len(COLORS)],
                },
            )

        # Comments
        for author_key, content in task_data.get("comments", []):
            author = users.get(author_key) or admin
            TaskComment.objects.create(
                task=task,
                author=author,
                author_email=author.email,
                content=content,
                source=CommentSource.APP,
            )

        # Notifications for assignees (simulate system notifications)
        for key in assignee_keys:
            user = users.get(key)
            if user and column.status == ColumnStatus.IN_PROGRESS:
                Notification.objects.get_or_create(
                    user=user,
                    task=task,
                    type=NotificationType.ASSIGNED,
                    defaults={
                        "message": f'Te han asignado la tarea "{task.title}"',
                        "read": random.choice([True, False]),
                    },
                )
