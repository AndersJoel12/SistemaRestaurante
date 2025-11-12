from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from apps.pedidos.models import Mesa, Pedido
from .serializers import MesaSerializer, PedidoSerializer
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.response import Response

class MesaViewSet(viewsets.ModelViewSet):
    serializer_class = MesaSerializer
    queryset = Mesa.objects.all().order_by('numero') 
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser] 
        
        return [permission() for permission in permission_classes]

class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    queryset = Pedido.objects.all().order_by('-fecha', '-hora')

    def get_permissions(self):
        if self.action in ['create', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser] 
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
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