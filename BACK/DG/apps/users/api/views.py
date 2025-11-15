from rest_framework import viewsets, status
from rest_framework.response import Response
#from rest_framework.permissions import IsAuthenticated, IsAdminUser
from apps.users.api.permissions import IsAdministrador, IsOwner
from apps.users.models import User
from apps.users.api.serializers import UserSerializer
from rest_framework import permissions

class EmpleadoViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True).all() 
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'create', 'destroy']:
            permission_classes = [IsAdministrador]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            permission_classes = [IsAdministrador | IsOwner]
        else:
            permission_classes = [permissions.IsAuthenticated]
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
        return Response({'message':'Empleado Deshabilitado exitosamente.'}, status=status.HTTP_200_OK)