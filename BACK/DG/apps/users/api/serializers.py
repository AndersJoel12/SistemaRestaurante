from rest_framework import serializers
from apps.users.models import User

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
        
        #instance.username = validated_data.get('username', instance.username)
        #instance.email = validated_data.get('email', instance.email)
        #instance.name = validated_data.get('name', instance.name)
        #instance.last_name = validated_data.get('last_name', instance.last_name)
        #instance.is_active = validated_data.get('is_active', instance.is_active)
        #instance.is_staff = validated_data.get('is_staff', instance.is_staff)
        
        if password:
            user.set_password(password)
            user.save()
            
        return instance
