from django.contrib import admin
from .models import User, MembershipPlan

admin.site.register(User)
admin.site.register(MembershipPlan)

# Register your models here.
