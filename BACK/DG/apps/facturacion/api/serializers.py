from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from apps.facturacion.models import Factura
from apps.pedidos.models import Pedido

class FacturaSerializer(serializers.ModelSerializer):
    # Input: Recibimos el ID del pedido (Ej: 5)
    pedido_id = serializers.PrimaryKeyRelatedField(
        source='pedido', # Esto hace que en validated_data la llave sea 'pedido'
        queryset=Pedido.objects.all(),
        write_only=True
    )

    class Meta:
        model = Factura
        fields = (
            'id', 
            'pedido_id', 
            'fecha_emision', 
            'hora_emision', 
            'impuesto',    # Asumo que esto es el % (Ej: 16.00)
            'descuento', 
            'metodo_pago', 
            'subtotal', 
            'totalFactura', 
            'state', 
            'created_at'
        )
        read_only_fields = (
            'id', 'fecha_emision', 'hora_emision', 'subtotal', 'totalFactura', 'state', 'created_at'
        )

    def create(self, validated_data):
        # 1. CORRECCIÓN CRÍTICA: 
        # Al usar source='pedido', DRF ya nos da el OBJETO Pedido en la llave 'pedido'.
        # No necesitamos buscarlo de nuevo con Pedido.objects.get()
        pedido_instance = validated_data.pop('pedido')

        with transaction.atomic():
            # Validamos si ya tiene factura (usando la relación inversa del OneToOne)
            if hasattr(pedido_instance, 'factura'):
                raise serializers.ValidationError("Este pedido ya tiene una factura asociada.")
            
            # 2. Cálculos Matemáticos
            subtotal = pedido_instance.costo_total
            
            # Obtenemos el porcentaje de impuesto (Ej: 16). Si no viene, es 0.
            porcentaje_impuesto = validated_data.get('impuesto', Decimal(0))
            
            # Calculamos el monto del impuesto: (Subtotal * Porcentaje) / 100
            monto_impuesto_calculado = subtotal * (porcentaje_impuesto / Decimal(100))
            
            descuento = validated_data.get('descuento', Decimal(0))
            
            # Total = Subtotal + Impuesto ($) - Descuento
            # Nota: Asegúrate de que tu modelo Factura guarde el % de impuesto o el monto.
            # Aquí asumo que guardas el % en 'impuesto' y el total incluye el cálculo.
            totalFactura = subtotal + monto_impuesto_calculado - descuento

            # 3. Creación de la Factura
            factura = Factura.objects.create(
                pedido=pedido_instance,
                subtotal=subtotal,
                totalFactura=totalFactura,
                **validated_data # Aquí van metodo_pago, impuesto (%), descuento, etc.
            )

            # 4. Lógica de Negocio (Cerrar Pedido y Mesa)
            pedido_instance.estado_pedido = 'CERRADO'
            pedido_instance.save()
            
            # Verificamos que la mesa exista antes de intentar liberarla (por seguridad)
            if pedido_instance.mesa:
                pedido_instance.mesa.liberar()
                
        return factura