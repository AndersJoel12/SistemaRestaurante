from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from apps.facturacion.models import Factura
from .serializers import FacturaSerializer

class FacturaViewSet(viewsets.ModelViewSet):
    serializer_class = FacturaSerializer
    queryset = Factura.objects.all().order_by('-fecha_emision', '-hora_emision')

    def get_permissions(self):
        if self.action in ['create', 'retrieve', 'list']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser] 
        return [permission() for permission in permission_classes]