from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "first_name", "last_name", "role", "is_staff")
    ordering = ("email",)
    
    # Add role to the forms
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Información Adicional", {"fields": ("role",)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Información Adicional", {"fields": ("role",)}),
    )
