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
    producto_nombre = serializers.CharField(
        source='producto.nombre',
        read_only=True
    )


    class Meta:
        model = ProductoPedido
        fields = [
            'id', 'producto_id','producto_nombre' ,'cantidad', 'precio_unit', 
            'observacion', 'subtotal', 'estado'
        ]
        read_only_fields = ['id', 'precio_unit', 'subtotal']

    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser un número positivo.")
        return value

class PedidoSerializer(serializers.ModelSerializer):
<<<<<<< HEAD
    items = ProductoPedidoSerializer(many=True, write_only=True)
    items_detalle = ProductoPedidoSerializer(many=True, read_only=True, source='items')
=======
    items = ProductoPedidoSerializer(many=True, read_only=False)
>>>>>>> 7e3ca5c90ae8daa75889b88c824ff245bde1cd4e
    total_items = serializers.SerializerMethodField(read_only=True)

    mesa_id = serializers.PrimaryKeyRelatedField(
        source='mesa',
        queryset=Mesa.objects.all(),
    )

    empleado_id = serializers.PrimaryKeyRelatedField(
        source='empleado',
        queryset=Empleado.objects.filter(),
    )
    
    # DEJA ESTO COMENTADO POR AHORA (Evita el error 500 anterior)
    # total_items = serializers.SerializerMethodField()

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
            'items_detalle', 
            'total_items' # COMENTADO
        ]
        read_only_fields = ['id', 'fecha', 'hora', 'CostoTotal']

        #FUNCION COMENTADA POR AHORA
    def get_total_items(self, obj):
        if hasattr(obj, 'items'):
            return obj.items.count()
        return 0

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
            
        if not items_data:
            raise serializers.ValidationError({"items": "El pedido debe contener al menos un producto."})

        mesa_instance = validated_data.pop('mesa') 
        empleado_instance = validated_data.pop('empleado')

            #if mesa_instance and mesa_instance.estado == False: # Ajusta 'OCUPADA' a tu valor real
            #    raise serializers.ValidationError({"mesa_id": "La mesa ya está ocupada."})

        pedido = Pedido.objects.create(
            mesa=mesa_instance, 
            empleado=empleado_instance, 
            **validated_data
        )
            
        total_cost = Decimal('0.00')
        productos_para_crear = []

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
                    # Usa .get() para 'observacion' para que sea opcional, si no fue sacado por pop()
                    observacion=item_data.get('observacion', ''), 
                )
            )
            total_cost += subtotal
                    
        ProductoPedido.objects.bulk_create(productos_para_crear)
            
        pedido.CostoTotal = total_cost
        pedido.save()
    
            #if mesa_instance:
            #mesa_instance.ocupar() 
            
        return pedido