from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from apps.facturacion.models import Factura
from apps.pedidos.models import Pedido

class FacturaSerializer(serializers.ModelSerializer):
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
            'fecha_emision', 
            'hora_emision', 
            'impuesto', 
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
        pedido_id = validated_data.pop('pedido_id')

        with transaction.atomic():
            pedido = Pedido.objects.get(id=pedido_id)
            if hasattr(pedido, 'factura'):
                raise serializers.ValidationError("El pedido ya tiene una factura asociada.")
            
            subtotal = pedido.costo_total
            impuesto = subtotal * (validated_data.get('impuesto', Decimal(0)/100))
            descuento= validated_data.get('descuento', Decimal(0))
            totalFactura = subtotal + impuesto - descuento

            factura = Factura.objects.create(
                pedido=pedido,
                subtotal=subtotal,
                totalFactura=totalFactura,
                **validated_data
            )

            pedido.estado_pedido = 'CERRADO'
            pedido.save()
            pedido.mesa.liberar()
        return factura
    pass

        

    