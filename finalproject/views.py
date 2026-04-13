

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import MembershipPlan, MembershipApplication, HealthDocument, PersonalTrainer, TrainerRequest
from .serializers import (RegisterSerializer, LoginSerializer,
                          UserProfileSerializer, MembershipPlanSerializer,
                          MembershipApplicationSerializer, SubmitApplicationSerializer, PersonalTrainerSerializer, TrainerRequestSerializer)


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