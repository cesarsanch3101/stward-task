# Settings split: base → dev/prod
# DJANGO_SETTINGS_MODULE should point to config.settings.development or config.settings.production
# Default: development (for backwards compat with docker-compose)

import os

env = os.environ.get("DJANGO_ENV", "development")

if env == "production":
    from .production import *  # noqa: F401, F403
elif env == "synology":
    from .synology import *  # noqa: F401, F403
else:
    from .development import *  # noqa: F401, F403
