from apps.productos.models import Producto, Categoria
from rest_framework import serializers

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = (
            'id',
            'nombre', 
            'estado',
            'created_at',
            'updated_at',
            )
        read_only_fields = ('id', 'created_at', 'updated_at')


class ProductoSerializer(serializers.ModelSerializer):
    categoria = serializers.CharField(
        source='categoria.nombre',
        read_only=True
    )
    
    categoria_id = serializers.IntegerField(
        source='categoria.id',
        read_only=True
    )

    categoria_escritura = serializers.PrimaryKeyRelatedField(
        source='categoria',
        queryset=Categoria.objects.all(),
        write_only=True
    )

    class Meta:
        model = Producto
        fields = (
            'id',
            'nombre',
            'imagen',
            'descripcion',
            'precio',
            'disponible',
            'categoria',
            'categoria_id',
            'categoria_escritura',
            )
        read_only_fields = ('id', 'created_at', 'updated_at', 'state')

    def validate_precio(self, value):
        if value < 0:
            raise serializers.ValidationError("El precio debe ser un valor positivo.")
        return value



