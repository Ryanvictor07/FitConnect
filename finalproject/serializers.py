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


class AdminLoginSerializer(serializers.Serializer):
   email    = serializers.EmailField()
   password = serializers.CharField(write_only=True)


   def validate(self, data):
       user = authenticate(username=data['email'], password=data['password'])
       if not user:
           raise serializers.ValidationError('Invalid email or password.')
       if not user.is_active:
           raise serializers.ValidationError('Account is disabled.')
       if user.role != 'admin':
           raise serializers.ValidationError('Access denied. Admin accounts only.')
       return user




class AdminUserSerializer(serializers.ModelSerializer):
   class Meta:
       model            = User
       fields           = ['id', 'email', 'username', 'first_name', 'last_name',
                            'phone', 'role', 'is_active', 'created_at']
       read_only_fields = ['id', 'email', 'created_at']




class AdminApplicationSerializer(serializers.ModelSerializer):
   documents  = HealthDocumentSerializer(many=True, read_only=True)
   plan_name  = serializers.CharField(source='plan.name', read_only=True)
   user_email = serializers.CharField(source='user.email', read_only=True)
   user_name  = serializers.SerializerMethodField()


   class Meta:
       model            = MembershipApplication
       fields           = ['id', 'user', 'user_email', 'user_name', 'plan',
                            'plan_name', 'status', 'rejection_reason',
                            'submitted_at', 'reviewed_at', 'documents']
       read_only_fields = ['id', 'user', 'submitted_at']


   def get_user_name(self, obj):
       return f"{obj.user.first_name} {obj.user.last_name}".strip()




class AdminReviewApplicationSerializer(serializers.Serializer):
   action           = serializers.ChoiceField(choices=['approve', 'reject'])
   rejection_reason = serializers.CharField(required=False, allow_blank=True)


   def validate(self, data):
       if data['action'] == 'reject' and not data.get('rejection_reason'):
           raise serializers.ValidationError(
               {'rejection_reason': 'A reason is required when rejecting an application.'}
           )
       return data




class AdminMembershipPlanSerializer(serializers.ModelSerializer):
   class Meta:
       model            = MembershipPlan
       fields           = ['id', 'name', 'description', 'price', 'duration',
                            'is_active', 'created_at']
       read_only_fields = ['id', 'created_at']




class AdminPersonalTrainerSerializer(serializers.ModelSerializer):
   class Meta:
       model            = PersonalTrainer
       fields           = ['id', 'name', 'specialty', 'experience',
                            'is_available', 'created_at']
       read_only_fields = ['id', 'created_at']