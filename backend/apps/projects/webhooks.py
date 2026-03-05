"""
Webhook endpoints — unauthenticated, for external services.
"""

import hmac
import json as _json
import logging
import re

from ninja import Router
from django.conf import settings

from apps.accounts.models import User

from .models import CommentSource, TaskComment
from .services import NotificationService

logger = logging.getLogger(__name__)

webhook_router = Router(auth=None, tags=["webhooks"])


@webhook_router.post("/inbound-email")
def inbound_email(request):
    """
    Receives inbound email from Cloudmailin (JSON Original format).
    Verifies token via ?token= query param.
    Extracts task UUID from the To address, creates a TaskComment.

    Cloudmailin JSON payload structure:
      {
        "envelope": {"from": "...", "to": "task-{uuid}@reply.stwards.com"},
        "plain": "full plain text body",
        "reply_plain": "reply text stripped of quoted content"
      }
    """
    # Verify token from URL query param (?token=...) or fallback header
    secret = getattr(settings, "INBOUND_EMAIL_SECRET", "")
    if secret:
        token = request.GET.get("token", "") or request.headers.get("X-Webhook-Secret", "")
        if not hmac.compare_digest(token, secret):
            logger.warning("Inbound email: invalid webhook token")
            return {"status": "error", "reason": "unauthorized"}

    # Parse JSON body
    try:
        data = _json.loads(request.body)
    except (_json.JSONDecodeError, Exception):
        logger.warning("Inbound email: invalid JSON payload")
        return {"status": "error", "reason": "invalid payload"}

    envelope = data.get("envelope", {})
    sender = envelope.get("from", "").strip()
    to = envelope.get("to", "").strip()

    # Prefer reply_plain (Cloudmailin strips quoted text automatically)
    text = (data.get("reply_plain") or data.get("plain") or "").strip()

    if not sender or not to:
        logger.warning("Inbound email: missing sender or to fields")
        return {"status": "ignored", "reason": "missing fields"}

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

    # Try to match sender to a registered User
    author = User.objects.filter(email=sender).first()

    # Basic cleanup if reply_plain wasn't available
    clean_text = text.split("\n---")[0].split("\n> ")[0].strip()
    if not clean_text:
        logger.info("Inbound email: empty content for task %s", task_id)
        return {"status": "ignored", "reason": "empty content"}

    comment = TaskComment.objects.create(
        task=task,
        author=author,
        author_email=sender,
        content=clean_text[:10000],
        source=CommentSource.EMAIL,
    )

    if author:
        NotificationService.create_for_comment(comment, author)

    logger.info("Inbound email: comment created for task %s from %s", task_id, sender)
    return {"status": "ok", "comment_id": str(comment.id)}
