from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from apps.facturacion.models import Factura
from apps.pedidos.models import Pedido

class FacturaSerializer(serializers.ModelSerializer):
    # Input: Recibimos el ID del pedido desde el Frontend
    pedido_id = serializers.PrimaryKeyRelatedField(
        source='pedido', 
        queryset=Pedido.objects.all(),
        write_only=True
    )

    class Meta:
        model = Factura
        fields = (
            'id', 
            'pedido_id', 
            'numero_factura', 
            'fecha_emision', 
            'hora_emision', 
            'impuesto', 
            'descuento', 
            'metodo_pago', 
            'subtotal', 
            'totalFactura', 
            # Campos del Cliente
            'cliente_nombre',
            'cliente_cedula',
            'cliente_direccion',
            'cliente_telefono',
            'referencia_pago',
        )
        read_only_fields = (
            'id', 'numero_factura', 'fecha_emision', 'hora_emision', 'subtotal', 'totalFactura'
        )

    def create(self, validated_data):
        # Extraemos el objeto pedido
        pedido_instance = validated_data.pop('pedido')

        with transaction.atomic():
            # 1. Validar si ya existe factura
            if hasattr(pedido_instance, 'factura'):
                raise serializers.ValidationError("Este pedido ya tiene una factura asociada.")
            
            # 2. Obtener el Subtotal (Usando CostoTotal del modelo Pedido)
            subtotal = pedido_instance.CostoTotal 
            
            # 3. Cálculos Matemáticos
            porcentaje_impuesto = validated_data.get('impuesto', Decimal(0))
            monto_impuesto_calculado = subtotal * (porcentaje_impuesto / Decimal(100))
            descuento = validated_data.get('descuento', Decimal(0))
            
            # Total Final
            totalFactura = subtotal + monto_impuesto_calculado - descuento

            # 4. Creación de la Factura
            factura = Factura.objects.create(
                pedido=pedido_instance,
                subtotal=subtotal,
                totalFactura=totalFactura,
                **validated_data 
            )

            # 5. Actualizar Estado del Pedido
            pedido_instance.estado_pedido = 'CERRADO'
            pedido_instance.save()
            
            # 6. 🔥 LIBERAR MESA (Lógica Conectada al Modelo) 🔥
            # Verificamos si el pedido tiene una mesa asignada
            if pedido_instance.mesa:
                # Llamamos al método liberar() que creamos en el modelo Mesa
                # Esto pone estado = False y guarda la mesa.
                pedido_instance.mesa.liberar()
                print(f"✅ Mesa {pedido_instance.mesa.numero} liberada automáticamente.")
            else:
                print("ℹ️ Este pedido no tenía mesa asignada (quizás es para llevar).")

        return factura