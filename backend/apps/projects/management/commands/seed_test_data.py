import random
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.accounts.models import User
from apps.projects.models import Workspace, Board, Column, Task, ColumnStatus
from apps.projects.tests.factories import WorkspaceFactory, BoardFactory, ColumnFactory, TaskFactory
from apps.accounts.tests.factories import UserFactory

class Command(BaseCommand):
    help = 'Genera datos de prueba para la aplicación'

    def handle(self, *args, **kwargs):
        self.stdout.write('Iniciando el seeding de datos...')

        with transaction.atomic():
            # 1. Crear Superusuario si no existe
            admin_email = 'admin@test.com'
            if not User.objects.filter(email=admin_email).exists():
                User.objects.create_superuser(
                    email=admin_email,
                    username=admin_email,
                    password='testpass123',
                    first_name='Admin',
                    last_name='Stward'
                )
                self.stdout.write(self.style.SUCCESS(f'Superusuario creado: {admin_email}'))
            else:
                self.stdout.write(f'El superusuario {admin_email} ya existe.')

            # 2. Crear Usuarios con Roles
            roles = list(User.UserRole)
            test_users = []
            
            # Asegurar 'user@test.com' como desarrollador
            user_email = 'user@test.com'
            user = User.objects.filter(email=user_email).first()
            if not user:
                user = UserFactory(
                    email=user_email,
                    username=user_email,
                    first_name='Usuario',
                    last_name='Prueba',
                    role=User.UserRole.DEVELOPER
                )
                user.set_password('testpass123')
                user.save()
            test_users.append(user)

            # Generar 20 usuarios adicionales
            self.stdout.write('Cargando/Generando 20 usuarios adicionales...')
            for i in range(20):
                email = f'user{i+1}@example.com'
                u = User.objects.filter(email=email).first()
                if not u:
                    u = UserFactory(
                        email=email,
                        username=email,
                        role=random.choice(roles)
                    )
                    u.set_password('testpass123')
                    u.save()
                test_users.append(u)
            
            self.stdout.write(self.style.SUCCESS(f'Total de usuarios de prueba: {len(test_users)}'))

            # 3. Crear Workspace de Prueba
            workspace_name = "Espacio de Prueba"
            workspace = Workspace.objects.filter(name=workspace_name).first()
            if not workspace:
                workspace = WorkspaceFactory(
                    name=workspace_name,
                    owner=test_users[0],
                    description="Espacio de trabajo generado para pruebas de funcionalidad."
                )
                self.stdout.write(self.style.SUCCESS(f'Workspace creado: {workspace_name}'))
            
            # Asignar todos los usuarios al workspace
            for u in test_users:
                if not workspace.members.filter(id=u.id).exists():
                    workspace.members.add(u)
            self.stdout.write('Todos los usuarios han sido añadidos al workspace.')

            # 4. Crear Tablero de Prueba
            board_name = "Sprint Actual"
            board = Board.objects.filter(name=board_name, workspace=workspace).first()
            if not board:
                board = BoardFactory(
                    name=board_name,
                    workspace=workspace,
                    description="Tablero principal para el seguimiento de tareas del Sprint."
                )
                self.stdout.write(self.style.SUCCESS(f'Tablero creado: {board_name}'))
            else:
                self.stdout.write(f'El tablero {board_name} ya existe.')

            # 5. Asegurar Columnas Estándar
            column_specs = [
                ("Pendiente", 0, ColumnStatus.PENDING),
                ("En Progreso", 1, ColumnStatus.IN_PROGRESS),
                ("Completado", 2, ColumnStatus.COMPLETED),
            ]
            
            columns = []
            for name, order, status in column_specs:
                col, created = Column.objects.get_or_create(
                    board=board,
                    name=name,
                    defaults={'order': order, 'status': status}
                )
                columns.append(col)
                if created:
                    self.stdout.write(f'Columna creada: {name}')

            # 6. Generar Tareas Masivas
            self.stdout.write('Generando ~100 tareas para pruebas completas...')
            from datetime import timedelta
            from django.utils import timezone
            from apps.projects.models import Priority, TaskAssignment

            # Eliminar tareas existentes para limpieza si el usuario quiere "proceder" con sistema lleno
            Task.objects.filter(column__board=board).delete()
            
            task_templates = [
                "Revisar {feature}", "Implementar {feature}", "Testear {feature}",
                "Documentar {feature}", "Corregir {feature}", "Optimizar {feature}"
            ]
            features = [
                "Autenticación", "Dashboard", "Gantt", "Calendario", "API",
                "Frontend", "Base de datos", "Notificaciones", "Reportes",
                "Exportación", "Importación", "Integración", "Mobile UI",
                "Seguridad", "Performance", "Caché", "Logs", "Facturación"
            ]

            priorities = list(Priority)
            now = timezone.now().date()

            for i in range(110):
                title = f"{random.choice(task_templates).format(feature=random.choice(features))} #{i+1}"
                
                # Fechas para Gantt
                start_days = random.randint(-15, 15)
                duration = random.randint(2, 10)
                start_date = now + timedelta(days=start_days)
                end_date = start_date + timedelta(days=duration)

                task = TaskFactory(
                    title=title,
                    description=f"Descripción extendida para la tarea de prueba {title}. Útil para probar el scroll y la vista detallada.",
                    column=random.choice(columns),
                    order=i,
                    priority=random.choice(priorities),
                    progress=random.randint(0, 100),
                    start_date=start_date,
                    end_date=end_date,
                )

                # Asignaciones (Main assignee + Multi-assignment)
                assignee = random.choice(test_users)
                task.assignee = assignee
                task.save()

                # Añadir 1 o 2 colaboradores más vía TaskAssignment
                collaborators = random.sample(test_users, k=random.randint(1, 2))
                for colab in collaborators:
                    if colab != assignee:
                        TaskAssignment.objects.get_or_create(
                            task=task,
                            user=colab,
                            defaults={'individual_progress': random.randint(0, 100)}
                        )

            self.stdout.write(self.style.SUCCESS('Se han generado 110 tareas con asignaciones, fechas y progreso.'))

        self.stdout.write(self.style.SUCCESS('Seeding completado con éxito.'))
