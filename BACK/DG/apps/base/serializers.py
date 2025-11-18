from rest_framework import serializers
from .models import BaseModel

class BaseModelSerializer(serializers.ModelSerializer):
    def update(self, instance, validated_data):
        if self.context['request'].user.is_authenticated:
            validated_data['updated_by'] = self.context['request'].user.username
        return super().update(instance, validated_data)