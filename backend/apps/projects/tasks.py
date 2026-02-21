"""
Celery tasks — async email notifications.
"""

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_task_moved_email(self, task_id, old_column_name, new_column_name, moved_by_email):
    """Send email notification when a task changes column."""
    from apps.projects.models import Task

    try:
        task = Task.objects.select_related(
            "column__board", "assignee", "created_by"
        ).get(id=task_id)
    except Task.DoesNotExist:
        logger.warning("send_task_moved_email: task %s not found", task_id)
        return

    recipients = set()
    if task.assignee and task.assignee.email:
        recipients.add(task.assignee.email)
    if task.created_by and task.created_by.email:
        recipients.add(task.created_by.email)
    recipients.discard(moved_by_email)

    if not recipients:
        logger.info("send_task_moved_email: no recipients for task %s", task_id)
        return

    board = task.column.board
    reply_to = f"task-{task.id}@{settings.INBOUND_EMAIL_DOMAIN}"

    context = {
        "task": task,
        "old_column": old_column_name,
        "new_column": new_column_name,
        "board_name": board.name,
        "progress": task.progress,
        "task_url": f"{settings.FRONTEND_URL}/board/{board.id}",
    }

    html = render_to_string("projects/email/task_moved.html", context)
    subject = f"[Stward] {task.title} — {old_column_name} → {new_column_name}"

    for email in recipients:
        try:
            send_mail(
                subject=subject,
                message=f"{task.title}: {old_column_name} → {new_column_name} ({task.progress}%)",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html,
                fail_silently=False,
            )
            logger.info("Email sent to %s for task %s", email, task_id)
        except Exception as exc:
            logger.error("Failed to send email to %s: %s", email, exc)
            raise self.retry(exc=exc)
