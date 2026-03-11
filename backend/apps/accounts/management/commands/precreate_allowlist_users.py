from django.core.management.base import BaseCommand
from apps.accounts.models import User, AllowedEmail


class Command(BaseCommand):
    help = "Pre-crea cuentas de usuario para todas las entradas pendientes de la allowlist"

    def handle(self, *args, **options):
        entries = AllowedEmail.objects.filter(email__isnull=False, used_at__isnull=True)
        self.stdout.write(f"Entradas pendientes encontradas: {entries.count()}")

        created_count = 0
        skipped_count = 0

        for entry in entries:
            email = entry.email
            try:
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": email,
                        "role": entry.role,
                        "is_active": True,
                    },
                )
                if created:
                    if entry.name:
                        parts = entry.name.strip().split(" ", 1)
                        user.first_name = parts[0]
                        user.last_name = parts[1] if len(parts) > 1 else ""
                        user.save(update_fields=["first_name", "last_name"])
                    self.stdout.write(f"  Creado: {email} ({entry.role})")
                    created_count += 1
                else:
                    skipped_count += 1
            except Exception as e:
                self.stderr.write(f"  Error en {email}: {e}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Listo: {created_count} creados, {skipped_count} ya existian"
            )
        )
