from django.contrib import admin
from .models import User, MembershipPlan, MembershipApplication, HealthDocument

@admin.register(MembershipPlan)
class MembershipPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'duration', 'is_active']
    fields       = ['name', 'description', 'price', 'duration', 'is_active']

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'is_active']

@admin.register(MembershipApplication)
class MembershipApplicationAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'submitted_at']

@admin.register(HealthDocument)
class HealthDocumentAdmin(admin.ModelAdmin):
    list_display = ['application', 'uploaded_at']

# Register your models here.
