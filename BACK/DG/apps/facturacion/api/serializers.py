from rest_framework import serializers
from django.db import transaction
from decimal import Decimal

# Asegúrate de que los imports coincidan con tus nombres de Apps reales
from apps.facturacion.models import Factura
from apps.pedidos.models import Pedido

class FacturaSerializer(serializers.ModelSerializer):
    # Input: Recibimos solo el ID, pero Django internamente busca el objeto
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
        # Extraemos el objeto pedido del diccionario validado
        pedido_instance = validated_data.pop('pedido')

        # Usamos atomic para asegurar que SI falla la factura, NO se cierre el pedido a medias
        with transaction.atomic():
            # 1. Validar si ya existe factura para este pedido (Evitar duplicados)
            if Factura.objects.filter(pedido=pedido_instance).exists():
                raise serializers.ValidationError({"pedido_id": "Este pedido ya fue facturado."})
            
            # 2. Obtener el Subtotal directo del Pedido
            # Nota: Asegúrate que en tu modelo Pedido el campo sea 'CostoTotal' (Tal cual lo tienes)
            subtotal = pedido_instance.CostoTotal 
            
            # 3. Cálculos Matemáticos
            # Convertimos a Decimal para precisión financiera
            porcentaje_impuesto = validated_data.get('impuesto', Decimal(0))
            monto_impuesto_calculado = subtotal * (porcentaje_impuesto / Decimal(100))
            descuento = validated_data.get('descuento', Decimal(0))
            
            # Total Final
            total_calculado = subtotal + monto_impuesto_calculado - descuento

            # 4. Creación de la Factura
            factura = Factura.objects.create(
                pedido=pedido_instance,
                subtotal=subtotal,
                totalFactura=total_calculado,
                **validated_data 
            )

            # 5. Actualizar Estado del Pedido
            pedido_instance.estado_pedido = 'CERRADO'
            pedido_instance.save()
            
            # 6. 🔥 LIBERAR MESA 🔥
            if pedido_instance.mesa:
                try:
                    pedido_instance.mesa.liberar()
                    print(f"✅ Mesa {pedido_instance.mesa.numero} liberada.")
                except AttributeError:
                    print("⚠️ Advertencia: El modelo Mesa no tiene el método .liberar()")
            else:
                print("ℹ️ Pedido sin mesa (Para llevar/Delivery).")

        return factura