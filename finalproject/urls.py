



from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
   RegisterView, LoginView, ProfileView, MembershipPlanListView, SubmitApplicationView,
   ApplicationStatusView, PersonalTrainerListView, TrainerRequestView,
   AdminLoginView, AdminDashboardView, AdminApplicationListView, AdminApplicationDetailView,
   AdminMembershipPlanListView, AdminMembershipPlanDetailView,
   AdminPersonalTrainerListView, AdminPersonalTrainerDetailView, UserProfileUpdateView
   # admin_login_page, admin_dashboard_page,
)




urlpatterns = [
   path('register/', RegisterView.as_view(), name='register'),
   path('login/',    LoginView.as_view(),    name='login'),
   path('profile/',  ProfileView.as_view(),  name='profile'),
   path('profile/update/', UserProfileUpdateView.as_view()),
   path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
   path('plans/',         MembershipPlanListView.as_view(), name='plans'),
   path('apply/',         SubmitApplicationView.as_view(),  name='apply'),
   path('application/status/', ApplicationStatusView.as_view(), name='application-status'),
   path('trainers/',           PersonalTrainerListView.as_view(), name='trainers'),
   path('trainers/request/',   TrainerRequestView.as_view(),      name='trainer-request'),


   # Admin
   # Admin pages
   # path('admin-login/', admin_login_page, name='admin-login-page'),
   # path('admin-dashboard/', admin_dashboard_page, name='admin-dashboard-page'),


   # Admin API
   path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
   path('admin/login/', AdminLoginView.as_view(), name='admin-login-api'),
   path('admin/applications/',  AdminApplicationListView.as_view(), name='admin-application-list'),
   path('admin/applications/<int:pk>/', AdminApplicationDetailView.as_view(), name='admin-application-detail'),
   path('admin/plans/', AdminMembershipPlanListView.as_view(), name='admin-plan-list'),
   path('admin/plans/<int:pk>/', AdminMembershipPlanDetailView.as_view(), name='admin-plan-detail'),
   path('admin/trainers/', AdminPersonalTrainerListView.as_view(), name='admin-trainer-list'),
   path('admin/trainers/<int:pk>/', AdminPersonalTrainerDetailView.as_view(), name='admin-trainer-detail'),
]










