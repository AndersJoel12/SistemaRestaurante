from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
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
        # CORREGIDO: 'disponible' en lugar de 'disponibilidad'
        queryset=Producto.objects.filter(disponible=True),
        write_only=True
    )

    class Meta:
        model = ProductoPedido
        fields = [
            'id', 'producto_id', 'cantidad', 'precio_unit', 
            'observacion', 'subtotal', 'estado'
        ]
        read_only_fields = ['id', 'precio_unit', 'subtotal']

    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser un número positivo.")
        return value

class PedidoSerializer(serializers.ModelSerializer):
    items = ProductoPedidoSerializer(many=True, write_only=True)
    
    # DEJA ESTO COMENTADO POR AHORA (Evita el error 500 anterior)
    # total_items = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id', 'mesa_id', 'Empleado_id', 'fecha', 'hora', 
            'observacion', 'CostoTotal', 'estado_pedido', 
            'items', 
            # 'total_items' # COMENTADO
        ]
        read_only_fields = ['id', 'fecha', 'hora', 'CostoTotal', 'estado_pedido']

    # FUNCION COMENTADA POR AHORA
    # def get_total_items(self, obj):
    #     if hasattr(obj, 'items'):
    #         return obj.items.count()
    #     return 0

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        if not items_data:
            raise serializers.ValidationError("El pedido debe contener al menos un producto.")

        mesa_instance = validated_data.get('mesa_id')
        if mesa_instance and mesa_instance.estado:
            raise serializers.ValidationError("La mesa ya está ocupada.")

        pedido = Pedido.objects.create(**validated_data)
        
        total_cost = Decimal('0.00')
        productos_para_crear = []

        for item_data in items_data:
            product_instance = item_data.pop('producto')
            cantidad = item_data['cantidad']
            
            # CORREGIDO: 'disponible' en lugar de 'disponibilidad'
            if not product_instance.disponible:
                 raise serializers.ValidationError(f"El producto {product_instance.nombre} no está disponible.")

            precio_unitario = product_instance.precio
            subtotal = cantidad * precio_unitario

            productos_para_crear.append(
                ProductoPedido(
                    pedido=pedido,
                    producto=product_instance,
                    cantidad=cantidad,
                    precio_unit=precio_unitario,
                    subtotal=subtotal,
                    observacion=item_data.get('observacion', ''),
                    **item_data
                )
            )
            total_cost += subtotal

        ProductoPedido.objects.bulk_create(productos_para_crear)
        pedido.CostoTotal = total_cost
        pedido.save()
        
        if mesa_instance:
            mesa_instance.ocupar()
            
        return pedido