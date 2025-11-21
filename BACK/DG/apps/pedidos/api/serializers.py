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
    # 1. AGREGADO: Para que el frontend vea el nombre del plato (ej: "Hamburguesa")
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    
    producto_id = serializers.PrimaryKeyRelatedField(
        source='producto',
        queryset=Producto.objects.filter(disponible=True),
        write_only=True # El ID solo se usa al escribir (enviar pedido)
    )

    class Meta:
        model = ProductoPedido
        fields = [
            'id', 
            'producto_id', 
            'producto_nombre', # <--- Importante para tu lista en React
            'cantidad', 
            'precio_unit', 
            'observacion', 
            'subtotal', 
            'estado'
        ]
        read_only_fields = ['id', 'precio_unit', 'subtotal']

    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser un número positivo.")
        return value

class PedidoSerializer(serializers.ModelSerializer):
    # 2. CORREGIDO: Quitamos 'write_only=True' para que React pueda LEER la lista.
    # IMPORTANTE: Esto asume que en tu models.py la relación tiene related_name='items'
    # o que el campo se llama 'items'. Si usas el default, abajo te dejo una nota.
    items = ProductoPedidoSerializer(many=True) 
    
    total_items = serializers.SerializerMethodField(read_only=True)

    mesa_id = serializers.PrimaryKeyRelatedField(
        source='mesa',
        queryset=Mesa.objects.all(),
    )

    empleado_id = serializers.PrimaryKeyRelatedField(
        source='empleado',
        queryset=Empleado.objects.filter(), # Puedes filtrar is_active=True si quieres
    )

    class Meta:
        model = Pedido
        fields = [
            'id', 
            'mesa_id', 
            'empleado_id', 
            'fecha', 
            'hora', 
            'observacion', 
            'CostoTotal', 
            'estado_pedido', 
            'items', 
            'total_items'
        ]
        read_only_fields = ['id', 'fecha', 'hora', 'CostoTotal']

    # 3. DESCOMENTADO Y CORREGIDO
    def get_total_items(self, obj):
        # Intentamos obtener el count de la relación inversa
        if hasattr(obj, 'items'):
            return obj.items.count()
        # Fallback por si se llama diferente (ej: productopedido_set)
        if hasattr(obj, 'productopedido_set'):
            return obj.productopedido_set.count()
        return 0

    @transaction.atomic
    def create(self, validated_data):
        # Extraemos los items del payload
        items_data = validated_data.pop('items')
            
        if not items_data:
            raise serializers.ValidationError({"items": "El pedido debe contener al menos un producto."})

        mesa_instance = validated_data.pop('mesa') 
        empleado_instance = validated_data.pop('empleado')

        # Crear el Pedido Padre
        pedido = Pedido.objects.create(
            mesa=mesa_instance, 
            empleado=empleado_instance, 
            **validated_data
        )
            
        total_cost = Decimal('0.00')
        productos_para_crear = []

        # Procesar cada item
        for item_data in items_data:
            producto_instance = item_data.pop('producto') 
            cantidad = item_data['cantidad']
                
            if not producto_instance.disponible:
                raise serializers.ValidationError({"items": f"El producto {producto_instance.nombre} no está disponible."})

            precio_unit = producto_instance.precio
            subtotal = cantidad * precio_unit
                
            productos_para_crear.append(
                ProductoPedido(
                    pedido=pedido,
                    producto=producto_instance,
                    cantidad=cantidad,
                    precio_unit=precio_unit,
                    subtotal=subtotal,
                    observacion=item_data.get('observacion', ''), 
                )
            )
            total_cost += subtotal
                    
        # Bulk Create para optimizar base de datos
        ProductoPedido.objects.bulk_create(productos_para_crear)
            
        # Actualizar costo total
        pedido.CostoTotal = total_cost
        pedido.save()
            
        return pedido