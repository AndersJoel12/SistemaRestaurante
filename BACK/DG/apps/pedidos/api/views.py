from rest_framework import viewsets, status, permissions
from apps.pedidos.models import Mesa, Pedido, ProductoPedido
from .serializers import MesaSerializer, PedidoSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.api.permissions import IsAdministrador, IsMesero, IsCocina, IsOwner

class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all().order_by('numero') 
    serializer_class = MesaSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['list', 'retrieve', 'update', 'partial_update']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    queryset = Pedido.objects.all().order_by('-fecha', '-hora')


    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['list', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    
    @action(detail=True, methods=['patch'], permission_classes=[IsCocina])
    def marcar_listo(self, request, pk=None):
        pedido = self.get_object()
        if pedido.estado_pedido != 'EN_ESPERA':
            return Response(
                {'message': 'Solo se pueden marcar como listo los pedidos en estado EN_ESPERA.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        pedido.estado_pedido = 'PREPARADO'
        pedido.save()
        return Response({'message': 'Pedido marcado como PREPARADO.'}, status=status.HTTP_200_OK)
    
class ProductoPedidoViewSet(viewsets.ModelViewSet):
    queryset = ProductoPedido.objects.all().order_by('id')#Editar despues
    serializer_class = ProductoPedido

    def get_permissions(self):
        if self.action == 'create':
            permissions_classes = [permissions.AllowAny]
        elif self.action in ['list', 'retrieve']:
            permissions_classes = [permissions.AllowAny]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permissions_classes = [permissions.AllowAny]
        else:
            permissions_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permissions_classes]
        
    def partial_update(self, request, *args, **kwargs):
        if request.user.rol == 'Administrador':
            return super().partial_update(request, *args, **kwargs)

        elif request.user.rol == 'cocinero':
            data = request.data
            
            allowed_fields = ['estado']
            if any(key not in allowed_fields for key in data.keys()):
                return Response(
                    {'message': 'El rol Cocina solo puede modificar el campo "estado".'},
                        status=status.HTTP_403_FORBIDDEN
                ) 
            return super().partial_update(request, *args, **kwargs)
            
        return Response(
            {'detail': 'No tienes permiso para realizar esta acción.'}, 
            status=status.HTTP_403_FORBIDDEN
        )