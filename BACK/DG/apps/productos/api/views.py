from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, IsAuthenticated

# View Categoria --ListoAparentemente 4:17 AM 12/11/25--
class CategoriaViewSet(viewsets.ModelViewSet):
    from apps.productos.models import Categoria
    from .serializers import CategoriaSerializer

    serializer_class = CategoriaSerializer
    queryset = Categoria.objects.all().order_by('nombre') 

    permission_classes = [IsAuthenticated]
    
    def destroy(self, request, *args, **kwargs):

        instance = self.get_object()
        if instance.estado is False:
            return Response(
                {'message': 'La categoría ya está deshabilitada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.estado = False
        instance.save()

        return Response({'message':'Categoría Deshabilitada exitosamente.'}, status=status.HTTP_200_OK)
    
# View Producto --ListoAparentemente 4:16 AM 12/11/25--
class ProductoViewSet(viewsets.ModelViewSet):
    from apps.productos.models import Producto
    from .serializers import ProductoSerializer

    serializer_class = ProductoSerializer
    queryset = Producto.objects.all().order_by('nombre')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.state = False
        instance.disponible = False
        instance.save()

        return Response(
            {'message': f'Producto "{instance.nombre}" deshabilitado y puesto como NO disponible.'}, 
            status=status.HTTP_200_OK
        )
