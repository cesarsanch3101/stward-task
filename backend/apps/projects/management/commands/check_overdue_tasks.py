from django.core.management.base import BaseCommand
from apps.projects.tasks import check_overdue_tasks


class Command(BaseCommand):
    help = "Move overdue tasks to the DELAYED column on every board."

    def handle(self, *args, **options):
        self.stdout.write("Running check_overdue_tasks...")
        try:
            moved = check_overdue_tasks()
            self.stdout.write(
                self.style.SUCCESS(f"Done — {moved} task(s) moved to DELAYED.")
            )
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Failed: {exc}"))
            raise SystemExit(1)
