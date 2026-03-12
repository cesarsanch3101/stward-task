from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0009_task_dependencies_task_parent"),
    ]

    operations = [
        migrations.AddField(
            model_name="taskcomment",
            name="attachment_filename",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="taskcomment",
            name="attachment_size",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
