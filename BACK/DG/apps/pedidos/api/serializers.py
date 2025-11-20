from rest_framework import serializers
from decimal import Decimal
from apps.pedidos.models import ProductoPedido, Pedido, Mesa
from apps.productos.models import Producto
from apps.users.models import User as Empleado


class MesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mesa
        fields = ['id', 'numero', 'capacidad', 'ubicacion', 'estado']
        read_only_fields = ['id']

    def validate_capacidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("La capacidad debe ser un número positivo.")
        return value
    
class ProductoPedidoSerializer(serializers.ModelSerializer):
    producto_id = serializers.PrimaryKeyRelatedField(
        source='producto',
        queryset=Producto.objects.filter(disponible=True),
        write_only=True
    )

    class Meta:
        model = ProductoPedido
        fields = [
            'id',
            'producto_id',
            'cantidad',
            'precio_unit',
            'observacion',
            'subtotal',
            'estado',
        ]
        read_only_fields = ['id', 'precio_unit', 'subtotal']

    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser un número positivo.")
        return value

class PedidoSerializer(serializers.ModelSerializer):
    items = ProductoPedidoSerializer(many=True, write_only=True)
    total_items = serializers.SerializerMethodField(read_only=True)

    mesa_id = serializers.PrimaryKeyRelatedField(
        source='mesa',
        queryset=Mesa.objects.all(),
    )

    Empleado_id = serializers.PrimaryKeyRelatedField(
        source='Empleado',
        queryset=Empleado.objects.filter(),
    )

    class Meta:
        model = Pedido
        fields = [
            'id',
            'mesa_id',
            'Empleado_id',
            'fecha',
            'hora',
            'observacion',
            'CostoTotal',
            'estado_pedido',
            'items',
            'total_items',
        ]
        read_only_fields = ['id', 'fecha', 'hora', 'CostoTotal', 'estado_pedido', 'total_items']

        def get_total_items(self, obj):
            return obj.items.count()
        
        def create(self, validated_data):
            items_data = validated_data.pop('items')

            if not items_data:
                raise serializers.ValidationError("El pedido debe contener al menos un producto.")
            
            mesa_instance = Mesa.objects.get(id=validated_data['mesa_id'])

            if mesa_instance.estado == True:
                raise serializers.ValidationError("La mesa seleccionada ya está ocupada.")
            
            pedido = Pedido.objects.create(**validated_data)
            total_cost = Decimal('0.00')
            productos_para_crear = []            

            for item_data in items_data:
                producto_instance = item_data.pop('producto')
                cantidad = item_data['cantidad']
            
                product_instance = Producto.objects.filter(id=producto_instance.id, disponibe=True).first()

                if not product_instance:
                    raise serializers.ValidationError({"items": f"Producto ID {producto_instance.id} no existe o no está disponible."})

                if product_instance:
                    precio_unitario = product_instance.precio
                    subtotal = cantidad * precio_unitario
            
                    productos_para_crear.append(
                        ProductoPedido(
                            pedido=pedido,
                            producto_id=producto_instance.id,
                            cantidad=cantidad,
                            precio_unitario=precio_unitario,
                            subtotal=subtotal,
                            **item_data
                        )
                    )
                total_pedido += subtotal
                        
            ProductoPedido.objects.bulk_create(productos_para_crear)
            pedido.CostoTotal = total_cost
            pedido.save()
            mesa_instance.ocupar()
            return pedido
        
