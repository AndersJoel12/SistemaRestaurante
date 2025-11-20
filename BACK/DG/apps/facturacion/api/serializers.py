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
            'numero_factura', # Agregado por si quieres verlo en la respuesta
            'fecha_emision', 
            'hora_emision', 
            'impuesto', 
            'descuento', 
            'metodo_pago', 
            'subtotal', 
            'totalFactura', 
            # Campos del Cliente (Deben coincidir con tu models.py actualizado)
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
        # Extraemos el objeto pedido de los datos validados
        pedido_instance = validated_data.pop('pedido')

        with transaction.atomic():
            # 1. Validar si ya existe factura para este pedido
            if hasattr(pedido_instance, 'factura'):
                raise serializers.ValidationError("Este pedido ya tiene una factura asociada.")
            
            # 2. Obtener el Subtotal (Corregido: CostoTotal con mayúsculas)
            subtotal = pedido_instance.CostoTotal 
            
            # 3. Cálculos Matemáticos
            porcentaje_impuesto = validated_data.get('impuesto', Decimal(0))
            
            # Cálculo del monto de impuesto
            monto_impuesto_calculado = subtotal * (porcentaje_impuesto / Decimal(100))
            
            descuento = validated_data.get('descuento', Decimal(0))
            
            # Total Final
            totalFactura = subtotal + monto_impuesto_calculado - descuento

            # 4. Creación de la Factura en Base de Datos
            factura = Factura.objects.create(
                pedido=pedido_instance,
                subtotal=subtotal,
                totalFactura=totalFactura,
                **validated_data # Insertamos cliente_nombre, cedula, metodo_pago, etc.
            )

            # 5. Actualizar Estado del Pedido
            pedido_instance.estado_pedido = 'CERRADO' # O 'PAGADO' según tu lógica
            pedido_instance.save()
            
            # 6. Lógica Robusta para Liberar la Mesa
            # Intentamos obtener la mesa buscando por 'mesa' o 'mesa_id'
            mesa_asociada = getattr(pedido_instance, 'mesa', None)
            
            if not mesa_asociada:
                # Si falló 'mesa', probamos 'mesa_id' (por si tu modelo se llama así)
                mesa_asociada = getattr(pedido_instance, 'mesa_id', None)

            if mesa_asociada:
                # Verificamos si tenemos el método específico 'liberar'
                if hasattr(mesa_asociada, 'liberar'):
                    mesa_asociada.liberar()
                # Si no, verificamos si tiene el atributo 'estado' para cambiarlo manualmente
                elif hasattr(mesa_asociada, 'estado'):
                    # Asumiendo que False significa 'Libre' y True 'Ocupada'
                    # Si tu lógica es al revés, cambia False por True.
                    mesa_asociada.estado = False 
                    mesa_asociada.save()
                else:
                    print(f"⚠️ Aviso: Se encontró la mesa {mesa_asociada} pero no se supo cómo liberarla.")

        return factura