from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

# Modelos
from apps.pedidos.models import Mesa, Pedido, ProductoPedido
# Serializadores
from .serializers import MesaSerializer, PedidoSerializer, ProductoPedidoSerializer
# Permisos
from apps.users.api.permissions import IsAdministrador, IsMesero, IsCocina, IsOwner

# --- 1. VISTA DE MESAS ---
class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all().order_by('numero') 
    serializer_class = MesaSerializer
    permission_classes = [permissions.AllowAny] 

# --- 2. VISTA DE PEDIDOS ---
class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer

    def get_queryset(self):
        # 1. Base: Traemos todo MENOS lo cerrado/cobrado (Historial limpio)
        queryset = Pedido.objects.order_by('-fecha', '-hora')

        # 2. 🔥 FILTRO DINÁMICO (NUEVO)
        # Capturamos el parámetro de la URL (ej: ?estado=PREPARADO)
        estado_param = self.request.query_params.get('estado')

        if estado_param:
            # 3. Si existe el parámetro, filtramos la lista base
            queryset = queryset.filter(estado_pedido=estado_param)
        
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "Pedido creado con éxito.", "pedido": serializer.data}, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )

    def get_permissions(self):
        return [permissions.AllowAny()]

    @action(detail=True, methods=['patch'])
    def marcar_listo(self, request, pk=None):
        pedido = self.get_object()
        pedido.estado_pedido = 'CERRADO'
        pedido.save()
        return Response({'message': 'Pedido marcado como PREPARADO.'}, status=status.HTTP_200_OK)

# --- 3. VISTA DE PRODUCTOS DEL PEDIDO ---
class ProductoPedidoViewSet(viewsets.ModelViewSet):
    queryset = ProductoPedido.objects.all().order_by('id')
    serializer_class = ProductoPedidoSerializer 

    def get_permissions(self):
        return [permissions.AllowAny()]
        
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)