from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from apps.users.models import User
from apps.users.api.serializers import UserSerializer
from rest_framework import permissions

class IsOwnerOrIsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        
        return obj == request.user


class EmpleadoViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.filter(is_active=True).all() 
    
    def get_permissions(self):

        if self.action in ['list', 'create']:
            permission_classes = [IsAdminUser] 
        else:
            permission_classes = [IsOwnerOrIsAdmin] 
            
        return [permission() for permission in permission_classes]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if instance == request.user and request.user.is_staff:
            return Response(
                {'message': 'Un administrador no puede deshabilitar su propia cuenta.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance.is_active = False
        instance.save()
        return Response({'message':'Empleado Deshabilitado (Borrado Lógico) exitosamente.'}, status=status.HTTP_200_OK)