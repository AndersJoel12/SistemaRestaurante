from rest_framework import viewsets, permissions
from apps.users.api.permissions import IsAdministrador, IsMesero
from apps.facturacion.models import Factura
from .serializers import FacturaSerializer

class FacturaViewSet(viewsets.ModelViewSet):
    serializer_class = FacturaSerializer
    queryset = Factura.objects.all().order_by('-fecha_emision', '-hora_emision')

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [IsAdministrador | IsMesero]
        elif self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdministrador]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]