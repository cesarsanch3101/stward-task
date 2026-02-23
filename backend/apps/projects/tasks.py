from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import TaskAssignment

@shared_task
def send_assignment_notification(assignment_id):
    """Sends an email notification to the assigned user."""
    try:
        assignment = TaskAssignment.objects.select_related('task', 'task__column__board', 'user').get(id=assignment_id)
        task = assignment.task
        user = assignment.user
        
        subject = f"Nueva tarea asignada: {task.title}"
        # We can expand this with HTML templates later
        message = (
            f"Hola {user.first_name or user.email},\n\n"
            f"Te han asignado a la tarea '{task.title}' en el tablero '{task.column.board.name}'.\n\n"
            f"Color asignado: {assignment.user_color}\n\n"
            f"¡Buen trabajo!"
        )
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except TaskAssignment.DoesNotExist:
        pass
    except Exception as e:
        # In production this should be logged properly
        print(f"Error sending email: {e}")
