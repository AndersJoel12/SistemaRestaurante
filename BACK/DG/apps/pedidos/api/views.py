from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

# Modelos
from apps.pedidos.models import Mesa, Pedido, ProductoPedido
# Serializadores (Asegúrate de importar ProductoPedidoSerializer)
from .serializers import MesaSerializer, PedidoSerializer, ProductoPedidoSerializer
# Permisos (Si los usas)
from apps.users.api.permissions import IsAdministrador, IsMesero, IsCocina, IsOwner

# --- 1. VISTA DE MESAS ---
class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all().order_by('numero') 
    serializer_class = MesaSerializer
    # Permisos abiertos para desarrollo
    permission_classes = [permissions.AllowAny] 

# --- 2. VISTA DE PEDIDOS (Aquí estaba el problema del 405) ---
class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    # ⚠️ ELIMINADO: http_method_names = [...]  <-- ESTO CAUSABA EL ERROR 405
    # Al quitarlo, ModelViewSet permite GET, POST, PUT, PATCH y DELETE por defecto.

    def get_queryset(self):
        # Filtramos para no traer los pedidos viejos 'CERRADO'
        return Pedido.objects.exclude(estado_pedido='CERRADO').order_by('-fecha', '-hora')

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
        # Para desarrollo, dejémoslo abierto. 
        # Cuando vayas a producción, descomenta la lógica de roles.
        return [permissions.AllowAny()]

    # Acción extra por si quieres usarla, pero tu frontend usa PATCH directo, que ahora funcionará.
    @action(detail=True, methods=['patch'])
    def marcar_listo(self, request, pk=None):
        pedido = self.get_object()
        pedido.estado_pedido = 'PREPARADO'
        pedido.save()
        return Response({'message': 'Pedido marcado como PREPARADO.'}, status=status.HTTP_200_OK)

# --- 3. VISTA DE PRODUCTOS DEL PEDIDO ---
class ProductoPedidoViewSet(viewsets.ModelViewSet):
    queryset = ProductoPedido.objects.all().order_by('id')
    # 🔥 CORRECCIÓN CRÍTICA: Antes tenías el Modelo aquí, debe ser el Serializer
    serializer_class = ProductoPedidoSerializer 

    def get_permissions(self):
        return [permissions.AllowAny()]
        
    def partial_update(self, request, *args, **kwargs):
        # Lógica de seguridad opcional:
        # Si quieres validar roles aquí, asegúrate de enviar el TOKEN desde el frontend.
        # Por ahora, delegamos al padre para que funcione el flujo.
        return super().partial_update(request, *args, **kwargs)