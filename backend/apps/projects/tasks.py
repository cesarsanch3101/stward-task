import logging

from celery import shared_task
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from .models import Task, TaskAssignment

logger = logging.getLogger(__name__)

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


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_task_moved_email(self, task_id, old_column_name, new_column_name, mover_email):
    """Sends an email notification when a task is moved to another column."""
    try:
        task = (
            Task.objects.select_related(
                "column", "column__board", "assignee", "created_by"
            )
            .prefetch_related("assignments__user")
            .get(id=task_id)
        )

        # Collect unique recipients (exclude the person who moved the task)
        recipients = set()
        for assignment in task.assignments.all():
            if assignment.user.email != mover_email:
                recipients.add(assignment.user.email)
        if task.assignee and task.assignee.email != mover_email:
            recipients.add(task.assignee.email)
        if task.created_by and task.created_by.email != mover_email:
            recipients.add(task.created_by.email)

        if not recipients:
            return

        inbound_domain = getattr(settings, "INBOUND_EMAIL_DOMAIN", "")
        reply_to = f"task-{task.id}@{inbound_domain}" if inbound_domain else None

        frontend_url = getattr(settings, "FRONTEND_URL", "").rstrip("/")
        task_url = f"{frontend_url}/boards/{task.column.board.id}" if frontend_url else ""

        context = {
            "task": task,
            "old_column": old_column_name,
            "new_column": new_column_name,
            "progress": task.progress,
            "board_name": task.column.board.name,
            "task_url": task_url,
        }
        html_body = render_to_string("projects/email/task_moved.html", context)
        subject = f"[{task.column.board.name}] Tarea movida: {task.title}"

        for recipient in recipients:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=f'"{task.title}" movida de {old_column_name} a {new_column_name} ({task.progress}%).',
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient],
                reply_to=[reply_to] if reply_to else [],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)

    except Task.DoesNotExist:
        pass
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task
def check_overdue_tasks():
    """
    Daily job: finds tasks past their end_date that are not in a COMPLETED or
    DELAYED column and moves them to the DELAYED column of their board.
    Runs via celery-beat every day at 00:05.
    """
    from django.utils import timezone
    from django.db import transaction
    from .models import Board, Column, ColumnStatus

    today = timezone.now().date()
    moved_count = 0

    for board in Board.objects.prefetch_related("columns"):
        delayed_col = board.columns.filter(status=ColumnStatus.DELAYED).first()
        if not delayed_col:
            continue  # Board has no DELAYED column — skip

        overdue_tasks = (
            Task.objects.filter(column__board=board, end_date__lt=today)
            .exclude(column__status__in=[ColumnStatus.DELAYED, ColumnStatus.COMPLETED])
        )

        if not overdue_tasks.exists():
            continue

        with transaction.atomic():
            count = overdue_tasks.count()
            overdue_tasks.update(column=delayed_col)
            moved_count += count
            logger.info(
                "check_overdue_tasks: moved %d tasks to DELAYED in board %s",
                count,
                board.id,
            )

    logger.info("check_overdue_tasks finished: total moved=%d", moved_count)
    return moved_count
