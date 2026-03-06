import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import TaskAssignment
from .tasks import send_assignment_notification

logger = logging.getLogger(__name__)

@receiver(post_save, sender=TaskAssignment)
def trigger_assignment_notification(sender, instance, created, **kwargs):
    """Sends an email notification when a new assignment is created."""
    if created:
        try:
            send_assignment_notification(str(instance.id))
        except Exception as exc:
            logger.warning("Could not send assignment notification: %s", exc)
