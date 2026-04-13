from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, MembershipPlan, MembershipApplication, HealthDocument, PersonalTrainer, TrainerRequest


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ['email', 'username', 'first_name', 'last_name',
                  'phone', 'address', 'birthdate', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name',
                  'phone', 'address', 'birthdate', 'role', 'created_at']
        read_only_fields = ['id', 'email', 'role', 'created_at']


class MembershipPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MembershipPlan
        fields = ['id', 'name', 'description', 'price', 'duration', 'is_active']


class HealthDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = HealthDocument
        fields = ['id', 'file', 'uploaded_at']


class MembershipApplicationSerializer(serializers.ModelSerializer):
    documents = HealthDocumentSerializer(many=True, read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model  = MembershipApplication
        fields = ['id', 'user', 'plan', 'plan_name', 'status',
                  'rejection_reason', 'submitted_at', 'reviewed_at', 'documents']
        read_only_fields = ['id', 'user', 'status', 'rejection_reason',
                            'submitted_at', 'reviewed_at']


class SubmitApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MembershipApplication
        fields = ['plan']


class PersonalTrainerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PersonalTrainer
        fields = ['id', 'name', 'specialty', 'experience', 'is_available']


class TrainerRequestSerializer(serializers.ModelSerializer):
    trainer_name = serializers.CharField(source='trainer.name', read_only=True)

    class Meta:
        model  = TrainerRequest
        fields = ['id', 'user', 'trainer', 'trainer_name', 'application', 'status', 'requested_at']
        read_only_fields = ['id', 'user', 'status', 'requested_at']