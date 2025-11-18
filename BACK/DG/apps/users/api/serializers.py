from rest_framework import serializers
from apps.users.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['username'] = user.username
        token['rol'] = user.rol

        return token

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 
            'username', 
            'email', 
            'name', 
            'last_name', 
            'cedula', 
            'rol', 
            'is_active', 
            'is_staff', 
            'password'
        )

        extra_kwargs = {
            'password': {'write_only': True},
            'cedula': {'required': True},
            'is_active': {'required': False},
        }

        read_only_fields = ('id', 'is_staff')

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)        

        if password:
            user.set_password(password)
            user.save()
            
        return instance
