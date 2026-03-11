import logging

from celery import shared_task
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from .models import Task, TaskAssignment

logger = logging.getLogger(__name__)

@shared_task
def send_assignment_notification(assignment_id):
    """Sends an HTML email notification to the assigned user."""
    try:
        assignment = TaskAssignment.objects.select_related(
            'task', 'task__column__board', 'user'
        ).get(id=assignment_id)
        task = assignment.task
        user = assignment.user

        frontend_url = getattr(settings, "FRONTEND_URL", "").rstrip("/")
        task_url = f"{frontend_url}/board/{task.column.board.id}" if frontend_url else ""

        inbound_addr = getattr(settings, "INBOUND_EMAIL_ADDRESS", "")
        reply_to = None
        if inbound_addr and "@" in inbound_addr:
            local, domain = inbound_addr.split("@", 1)
            reply_to = f"{local}+task-{task.id}@{domain}"

        end_date_str = task.end_date.strftime("%d/%m/%Y") if task.end_date else None
        nombre = user.first_name or user.email

        subject = f"Nueva tarea asignada: {task.title}"
        plain_body = (
            f"Hola {nombre},\n\n"
            f"Te han asignado a la tarea '{task.title}' en el tablero '{task.column.board.name}'.\n\n"
        )
        if end_date_str:
            plain_body += f"Fecha límite: {end_date_str}\n\n"
        if task_url:
            plain_body += f"Ver tarea: {task_url}\n\n"
        plain_body += "¡Buen trabajo!"

        context = {
            "user": user,
            "task": task,
            "board_name": task.column.board.name,
            "task_url": task_url,
            "end_date": end_date_str,
        }
        html_body = render_to_string("projects/email/assignment_notification.html", context)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
            reply_to=[reply_to] if reply_to else [],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=True)

    except TaskAssignment.DoesNotExist:
        pass
    except Exception as exc:
        logger.warning("send_assignment_notification failed: %s", exc)


@shared_task
def send_task_moved_email(task_id, old_column_name, new_column_name, mover_email):
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

        # Build Reply-To using Cloudmailin plus-addressing:
        # cca91010c6927746fa43+task-{uuid}@cloudmailin.net
        inbound_addr = getattr(settings, "INBOUND_EMAIL_ADDRESS", "")
        if inbound_addr and "@" in inbound_addr:
            local, domain = inbound_addr.split("@", 1)
            reply_to = f"{local}+task-{task.id}@{domain}"
        else:
            reply_to = None

        frontend_url = getattr(settings, "FRONTEND_URL", "").rstrip("/")
        task_url = f"{frontend_url}/board/{task.column.board.id}" if frontend_url else ""

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
            msg.send(fail_silently=True)

    except Task.DoesNotExist:
        pass
    except Exception as exc:
        logger.warning("send_task_moved_email failed for task %s: %s", task_id, exc)


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
