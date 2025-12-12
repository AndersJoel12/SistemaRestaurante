from django.db import models
import uuid # Importamos esto para generar el número de factura único
from apps.base.models import BaseModel
from apps.pedidos.models import Pedido

class Factura(BaseModel):
    pedido = models.OneToOneField(Pedido, on_delete=models.PROTECT, verbose_name='Pedido Asociado')
    
    # --- DATOS DEL CLIENTE (Agregados para coincidir con el Frontend) ---
    cliente_nombre    = models.CharField('Nombre del Cliente', max_length=100)
    cliente_cedula    = models.CharField('Cédula/RIF', max_length=20, null=True, blank=True)
    cliente_direccion = models.TextField('Dirección Fiscal', null=True, blank=True)
    cliente_telefono  = models.CharField('Teléfono', max_length=20, null=True, blank=True)
    
    # --- DATOS DE LA FACTURA ---
    numero_factura = models.CharField('Número de Factura', max_length=50, unique=True, blank=True) # blank=True para permitir que el save() lo llene
    fecha_emision  = models.DateField('Fecha de Emisión', auto_now_add=True)
    hora_emision   = models.TimeField('Hora de Emisión', auto_now_add=True)
    
    # --- MONTOS ---
    impuesto      = models.DecimalField('Impuesto (%)', max_digits=5, decimal_places=2, default=0.00)
    descuento     = models.DecimalField('Descuento', max_digits=10, decimal_places=2, default=0.00)
    
    # --- PAGO ---
    metodo_pago     = models.CharField('Método de Pago', max_length=50)
    referencia_pago = models.CharField('Referencia de Pago', max_length=100, null=True, blank=True) # Para Zelle/Pago Movil
    
    subtotal     = models.DecimalField('Subtotal', max_digits=10, decimal_places=2) # Quité editable=False por si necesitas ajustarlo manualmente alguna vez, pero puedes dejarlo
    totalFactura = models.DecimalField('Total de la Factura', max_digits=10, decimal_places=2)
    
    class Meta:
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'
        db_table = 'factura'

    # --- GENERADOR AUTOMÁTICO DE NÚMERO DE FACTURA ---
    def save(self, *args, **kwargs):
        # Si no tiene número, generamos uno. 
        # Ej: FACT-A1B2C3D4
        if not self.numero_factura:
            unique_id = str(uuid.uuid4())[:8].upper()
            self.numero_factura = f"FACT-{unique_id}"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Factura {self.numero_factura} - {self.cliente_nombre}"