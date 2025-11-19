from rest_framework import viewsets, status
from rest_framework.response import Response
from apps.users.models import User
from apps.users.api.serializers import UserSerializer
from rest_framework import permissions

class EmpleadoViewSet(viewsets.ModelViewSet):
    # ✅ CORRECCIÓN: Usamos .all() para ver TODOS (activos e inactivos)
    # Agregamos .order_by('id') para que la lista no baile al editar
    queryset = User.objects.all().order_by('id') 
    
    serializer_class = UserSerializer
    
    def get_permissions(self):
        # Mantenemos tu lógica de permisos (aunque ahora es pública)
        if self.action in ['list', 'create', 'destroy']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Pequeña mejora de seguridad: verificar si el usuario está autenticado antes de comparar
        if request.user.is_authenticated and instance == request.user and request.user.is_staff:
            return Response(
                {'message': 'Un administrador no puede deshabilitar su propia cuenta.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lógica de Borrado Lógico (Soft Delete)
        instance.is_active = False
        instance.save()
        return Response({'message':'Empleado Deshabilitado (Borrado Lógico) exitosamente.'}, status=status.HTTP_200_OK)