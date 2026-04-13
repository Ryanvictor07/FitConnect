from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import ( RegisterView, LoginView, ProfileView, MembershipPlanListView, SubmitApplicationView,
                    ApplicationStatusView, PersonalTrainerListView, TrainerRequestView)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/',    LoginView.as_view(),    name='login'),
    path('profile/',  ProfileView.as_view(),  name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('plans/',         MembershipPlanListView.as_view(), name='plans'),
    path('apply/',         SubmitApplicationView.as_view(),  name='apply'),
    path('application/status/', ApplicationStatusView.as_view(), name='application-status'),
    path('trainers/',           PersonalTrainerListView.as_view(), name='trainers'),
    path('trainers/request/',   TrainerRequestView.as_view(),      name='trainer-request'),
]
