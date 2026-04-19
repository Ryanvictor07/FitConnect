



# Create your views here.


from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import MembershipPlan, MembershipApplication, HealthDocument, PersonalTrainer, TrainerRequest
from .serializers import (
    RegisterSerializer, LoginSerializer, UserProfileSerializer,
    MembershipPlanSerializer, MembershipApplicationSerializer,
    SubmitApplicationSerializer, PersonalTrainerSerializer,
    TrainerRequestSerializer, AdminLoginSerializer,
    AdminApplicationSerializer, AdminReviewApplicationSerializer,
    AdminMembershipPlanSerializer, AdminPersonalTrainerSerializer,
)

class RegisterView(APIView):
   permission_classes = [AllowAny]


   def post(self, request):
       serializer = RegisterSerializer(data=request.data)
       if serializer.is_valid():
           user = serializer.save()
           refresh = RefreshToken.for_user(user)
           return Response({
               'message': 'Registration successful.',
               'access':  str(refresh.access_token),
               'refresh': str(refresh),
           }, status=status.HTTP_201_CREATED)
       return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class LoginView(APIView):
   permission_classes = [AllowAny]


   def post(self, request):
       serializer = LoginSerializer(data=request.data)
       if serializer.is_valid():
           user = serializer.validated_data
           refresh = RefreshToken.for_user(user)
           return Response({
               'message': 'Login successful.',
               'access':  str(refresh.access_token),
               'refresh': str(refresh),
               'role':    user.role,
               'user':    UserProfileSerializer(user).data,
           })
       return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class ProfileView(APIView):
   permission_classes = [IsAuthenticated]


   def get(self, request):
       serializer = UserProfileSerializer(request.user)
       return Response(serializer.data)


   def put(self, request):
       serializer = UserProfileSerializer(
           request.user, data=request.data, partial=True
       )
       if serializer.is_valid():
           serializer.save()
           return Response(serializer.data)
       return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class MembershipPlanListView(APIView):
   permission_classes = [IsAuthenticated]


   def get(self, request):
       plans = MembershipPlan.objects.filter(is_active=True)
       serializer = MembershipPlanSerializer(plans, many=True)
       return Response(serializer.data)


class SubmitApplicationView(APIView):
   permission_classes = [IsAuthenticated]


   def post(self, request):
       if MembershipApplication.objects.filter(
           user=request.user, status='pending'
       ).exists():
           return Response(
               {'error': 'You already have a pending application.'},
               status=status.HTTP_400_BAD_REQUEST
           )
       serializer = SubmitApplicationSerializer(data=request.data)
       if serializer.is_valid():
           application = serializer.save(user=request.user)
           files = request.FILES.getlist('documents')
           for f in files:
               HealthDocument.objects.create(application=application, file=f)
           return Response(
               MembershipApplicationSerializer(application).data,
               status=status.HTTP_201_CREATED
           )
       return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class ApplicationStatusView(APIView):
   permission_classes = [IsAuthenticated]


   def get(self, request):
       application = MembershipApplication.objects.filter(
           user=request.user
       ).order_by('-submitted_at').first()
       if not application:
           return Response(
               {'message': 'No application found.'},
               status=status.HTTP_404_NOT_FOUND
           )
       serializer = MembershipApplicationSerializer(application)
       return Response(serializer.data)


class PersonalTrainerListView(APIView):
   permission_classes = [IsAuthenticated]


   def get(self, request):
       trainers = PersonalTrainer.objects.filter(is_available=True)
       serializer = PersonalTrainerSerializer(trainers, many=True)
       return Response(serializer.data)




class TrainerRequestView(APIView):
   permission_classes = [IsAuthenticated]


   def post(self, request):
       application = MembershipApplication.objects.filter(
           user=request.user
       ).order_by('-submitted_at').first()
       if not application:
           return Response(
               {'error': 'You need to submit a membership application first.'},
               status=status.HTTP_400_BAD_REQUEST
           )
       if TrainerRequest.objects.filter(user=request.user).exists():
           return Response(
               {'error': 'You already have a trainer request.'},
               status=status.HTTP_400_BAD_REQUEST
           )
       serializer = TrainerRequestSerializer(data=request.data)
       if serializer.is_valid():
           serializer.save(user=request.user, application=application)
           return Response(serializer.data, status=status.HTTP_201_CREATED)
       return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IsAdminUser(IsAuthenticated):
   """Allows access only to users whose role == 'admin'."""
   def has_permission(self, request, view):
       return (
           super().has_permission(request, view)
           and request.user.role == 'admin'
       )








@method_decorator(csrf_exempt, name='dispatch')
class AdminLoginView(APIView):
   permission_classes = [AllowAny]
   authentication_classes = []  # ✅ IMPORTANT


   def post(self, request):
       serializer = AdminLoginSerializer(data=request.data)
       if serializer.is_valid():
           user = serializer.validated_data
           refresh = RefreshToken.for_user(user)
           return Response({
               'message': 'Admin login successful.',
               'access': str(refresh.access_token),
               'refresh': str(refresh),
               'role': user.role,
               'user': UserProfileSerializer(user).data,
           })
       return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)








class AdminDashboardView(APIView):
   permission_classes = [IsAdminUser]


   def get(self, request):
       from django.contrib.auth import get_user_model
       User = get_user_model()
       return Response({
           'total_users':        User.objects.filter(role='user').count(),
           'total_plans':        MembershipPlan.objects.count(),
           'active_plans':       MembershipPlan.objects.filter(is_active=True).count(),
           'total_trainers':     PersonalTrainer.objects.count(),
           'available_trainers': PersonalTrainer.objects.filter(is_available=True).count(),
           'applications': {
               'pending':  MembershipApplication.objects.filter(status='pending').count(),
               'approved': MembershipApplication.objects.filter(status='approved').count(),
               'rejected': MembershipApplication.objects.filter(status='rejected').count(),
               'total':    MembershipApplication.objects.count(),
           },
       })




class AdminApplicationListView(APIView):
   permission_classes = [IsAdminUser]


   def get(self, request):
       """
       GET /api/users/admin/applications/
       Optional query param: ?status=pending|approved|rejected
       """
       qs = MembershipApplication.objects.select_related(
           'user', 'plan'
       ).prefetch_related('documents').order_by('-submitted_at')


       status_filter = request.query_params.get('status')
       if status_filter:
           qs = qs.filter(status=status_filter)


       serializer = AdminApplicationSerializer(qs, many=True)
       return Response(serializer.data)




class AdminApplicationDetailView(APIView):
   permission_classes = [IsAdminUser]


   def _get_object(self, pk):
       try:
           return MembershipApplication.objects.select_related(
               'user', 'plan'
           ).prefetch_related('documents').get(pk=pk)
       except MembershipApplication.DoesNotExist:
           return None


   def get(self, request, pk):
       """GET /api/users/admin/applications/<pk>/"""
       application = self._get_object(pk)
       if not application:
           return Response(
               {'error': 'Application not found.'},
               status=status.HTTP_404_NOT_FOUND
           )
       return Response(AdminApplicationSerializer(application).data)


   def post(self, request, pk):
       """
       POST /api/users/admin/applications/<pk>/review/
       Body: { "action": "approve"|"reject", "rejection_reason": "..." }
       """
       application = self._get_object(pk)
       if not application:
           return Response(
               {'error': 'Application not found.'},
               status=status.HTTP_404_NOT_FOUND
           )
       if application.status != 'pending':
           return Response(
               {'error': f'Application is already {application.status}.'},
               status=status.HTTP_400_BAD_REQUEST
           )
       serializer = AdminReviewApplicationSerializer(data=request.data)
       if serializer.is_valid():
           action = serializer.validated_data['action']
           if action == 'approve':
               application.status      = 'approved'
               application.reviewed_at = timezone.now()
           else:
               application.status           = 'rejected'
               application.rejection_reason = serializer.validated_data.get(
                   'rejection_reason', ''
               )
               application.reviewed_at = timezone.now()
           application.save()
           return Response({
               'message':     f'Application {action}d successfully.',
               'application': AdminApplicationSerializer(application).data,
           })
       return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

   def delete(self, request, pk):
       application = self._get_object(pk)
       if not application:
           return Response(
               {'error': 'Application not found.'},
               status=status.HTTP_404_NOT_FOUND
           )
       if application.status != 'rejected':
           return Response(
               {'error': 'Only rejected applications can be deleted.'},
               status=status.HTTP_400_BAD_REQUEST
           )
       application.delete()
       return Response({'message': 'Application deleted successfully.'})




class AdminMembershipPlanListView(APIView):
   permission_classes = [IsAdminUser]


   def get(self, request):
       """GET /api/users/admin/plans/  – returns ALL plans (active + inactive)"""
       plans      = MembershipPlan.objects.all().order_by('-created_at')
       serializer = AdminMembershipPlanSerializer(plans, many=True)
       return Response(serializer.data)


   def post(self, request):
       """POST /api/users/admin/plans/"""
       serializer = AdminMembershipPlanSerializer(data=request.data)
       if serializer.is_valid():
           plan = serializer.save()
           return Response(
               AdminMembershipPlanSerializer(plan).data,
               status=status.HTTP_201_CREATED
           )
       return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class AdminMembershipPlanDetailView(APIView):
   permission_classes = [IsAdminUser]


   def _get_object(self, pk):
       try:
           return MembershipPlan.objects.get(pk=pk)
       except MembershipPlan.DoesNotExist:
           return None


   def get(self, request, pk):
       plan = self._get_object(pk)
       if not plan:
           return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
       return Response(AdminMembershipPlanSerializer(plan).data)


   def put(self, request, pk):
       plan = self._get_object(pk)
       if not plan:
           return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
       serializer = AdminMembershipPlanSerializer(plan, data=request.data, partial=True)
       if serializer.is_valid():
           serializer.save()
           return Response(serializer.data)
       return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


   def delete(self, request, pk):
       """Soft-delete: sets is_active = False instead of removing the record."""
       plan = self._get_object(pk)
       if not plan:
           return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
       plan.is_active = False
       plan.save()
       return Response({'message': 'Plan deactivated successfully.'})


class AdminPersonalTrainerListView(APIView):
   permission_classes = [IsAdminUser]


   def get(self, request):
       """GET /api/users/admin/trainers/  – returns ALL trainers"""
       trainers   = PersonalTrainer.objects.all().order_by('-created_at')
       serializer = AdminPersonalTrainerSerializer(trainers, many=True)
       return Response(serializer.data)


   def post(self, request):
       """POST /api/users/admin/trainers/"""
       serializer = AdminPersonalTrainerSerializer(data=request.data)
       if serializer.is_valid():
           trainer = serializer.save()
           return Response(
               AdminPersonalTrainerSerializer(trainer).data,
               status=status.HTTP_201_CREATED
           )
       return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class AdminPersonalTrainerDetailView(APIView):
   permission_classes = [IsAdminUser]


   def _get_object(self, pk):
       try:
           return PersonalTrainer.objects.get(pk=pk)
       except PersonalTrainer.DoesNotExist:
           return None


   def get(self, request, pk):
       trainer = self._get_object(pk)
       if not trainer:
           return Response({'error': 'Trainer not found.'}, status=status.HTTP_404_NOT_FOUND)
       return Response(AdminPersonalTrainerSerializer(trainer).data)


   def put(self, request, pk):
       trainer = self._get_object(pk)
       if not trainer:
           return Response({'error': 'Trainer not found.'}, status=status.HTTP_404_NOT_FOUND)
       serializer = AdminPersonalTrainerSerializer(trainer, data=request.data, partial=True)
       if serializer.is_valid():
           serializer.save()
           return Response(serializer.data)
       return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


   def delete(self, request, pk):
       """Hard-delete: permanently removes the trainer record."""
       trainer = self._get_object(pk)
       if not trainer:
           return Response({'error': 'Trainer not found.'}, status=status.HTTP_404_NOT_FOUND)
       trainer.delete()
       return Response({'message': 'Trainer deleted successfully.'})




def admin_login_page(request):
       return render(request, 'admin_login.html')


def admin_dashboard_page(request):
       return render(request, 'admin_dashboard.html')




