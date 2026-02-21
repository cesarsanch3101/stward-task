"""
Webhook endpoints — unauthenticated, for external services.
"""

import hmac
import logging
import re

from ninja import Form, Router
from django.conf import settings

from apps.accounts.models import User

from .models import CommentSource, TaskComment
from .services import NotificationService

logger = logging.getLogger(__name__)

webhook_router = Router(auth=None, tags=["webhooks"])


@webhook_router.post("/inbound-email")
def inbound_email(
    request,
    sender: str = Form(...),
    to: str = Form(...),
    text: str = Form(""),
):
    """
    Receives inbound email from SendGrid Inbound Parse (or compatible).
    Extracts task UUID from the To address, creates a TaskComment.
    """
    # Verify webhook secret if configured
    secret = settings.INBOUND_EMAIL_SECRET
    if secret:
        provided = request.headers.get("X-Webhook-Secret", "")
        if not hmac.compare_digest(provided, secret):
            logger.warning("Inbound email: invalid webhook secret from %s", sender)
            return {"status": "error", "reason": "unauthorized"}

    # Extract task UUID from To address: task-{uuid}@reply.stwards.com
    match = re.search(r"task-([0-9a-f-]{36})", to)
    if not match:
        logger.warning("Inbound email: no task UUID in To: %s", to)
        return {"status": "ignored", "reason": "no task UUID in address"}

    task_id = match.group(1)

    from .models import Task

    try:
        task = Task.objects.select_related("assignee", "created_by").get(id=task_id)
    except Task.DoesNotExist:
        logger.warning("Inbound email: task %s not found", task_id)
        return {"status": "ignored", "reason": "task not found"}

    # Try to match sender to a User
    author = User.objects.filter(email=sender).first()

    # Strip email signature/quoted text (basic: take content before first "---" or "> ")
    clean_text = text.split("\n---")[0].split("\n> ")[0].strip()
    if not clean_text:
        logger.info("Inbound email: empty content after cleaning for task %s", task_id)
        return {"status": "ignored", "reason": "empty content"}

    comment = TaskComment.objects.create(
        task=task,
        author=author,
        author_email=sender,
        content=clean_text[:10000],
        source=CommentSource.EMAIL,
    )

    # Create in-app notification for task stakeholders
    if author:
        NotificationService.create_for_comment(comment, author)

    logger.info("Inbound email: comment created for task %s from %s", task_id, sender)
    return {"status": "ok", "comment_id": str(comment.id)}
