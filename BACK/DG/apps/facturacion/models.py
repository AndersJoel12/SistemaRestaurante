from django.db import models
from apps.base.models import BaseModel
from apps.pedidos.models import Pedido

class Factura(BaseModel):
    pedido         = models.OneToOneField(Pedido, on_delete=models.PROTECT, verbose_name='Pedido Asociado')
    cliente_nombre = models.CharField('Nombre del Cliente', max_length=100)
    numero_factura = models.CharField('Número de Factura', max_length=50, unique=True)
    fecha_emision  = models.DateField('Fecha de Emisión', auto_now_add=True)
    hora_emision   = models.TimeField('Hora de Emisión', auto_now_add=True)
    impuesto       = models.DecimalField('Impuesto', max_digits=5, decimal_places=2, default=0.00)
    descuento      = models.DecimalField('Descuento', max_digits=10, decimal_places=2, default=0.00)
    metodo_pago    = models.CharField('Método de Pago', max_length=50)
    subtotal       = models.DecimalField('Subtotal', max_digits=10, decimal_places=2, editable=False)
    totalFactura   = models.DecimalField('Total de la Factura', max_digits=10, decimal_places=2, editable=False)
    
    class Meta:
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'
        db_table = 'factura'