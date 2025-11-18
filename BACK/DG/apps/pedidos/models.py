from django.db import models
from apps.base.models import BaseModel
from apps.productos.models import Producto
from apps.users.models import User as Empleado

class Mesa(BaseModel):
    numero        = models.IntegerField('Número de Mesa', unique=True)
    capacidad     = models.IntegerField('Capacidad de la Mesa')
    ubicacion     = models.CharField('Ubicación de la Mesa', max_length=100)
    estado        = models.BooleanField('Estado de la Mesa', default=True)

    class Meta:
        verbose_name = 'Mesa'
        verbose_name_plural = 'Mesas'
        db_table = 'mesa'

    def __str__(self):
        return f'Mesa N°{self.numero} - Capacidad: {self.ubicacion}'
    
    def ocupar(self):
        if not self.estado:
            self.estado = True
            self.save()
            return True
        return False
    
    def liberar(self):
        if self.estado:
            self.estado = False
            self.save()
            return True
        return False

class Pedido(BaseModel):
    ESTADOS_PEDIDO = (
        ('ABIERTO', 'Abierto (Tomando orden)'),
        ('EN_ESPERA', 'En Espera (Enviado a cocina)'),
        ('PREPARADO', 'Listo para Servir'),
        ('CERRADO', 'Cerrado (Pagado)'),
        ('ANULADO', 'Anulado'),
    )
    mesa_id      = models.ForeignKey(Mesa, on_delete=models.PROTECT, verbose_name='Mesa')
    Empleado_id  = models.ForeignKey(Empleado, on_delete=models.PROTECT, verbose_name='Empleado que Toma el Pedido')
    fecha        = models.DateField('Fecha de Pedido',auto_now=False, auto_now_add=True)
    hora         = models.TimeField('Hora de Pedido', auto_now=False, auto_now_add=True)
    observacion  = models.TextField('Observación del Pedido', max_length=500, null=True, blank=True)
    CostoTotal   = models.DecimalField('Costo Total del Pedido', max_digits=10, decimal_places=2)
    estado_pedido= models.CharField('Estado del Pedido', max_length=15, choices=ESTADOS_PEDIDO, default='ABIERTO')
    
    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        db_table = 'pedido'
    

class ProductoPedido(BaseModel):
    ESTADOS_ITEM = (
        ('PENDIENTE', 'Pendiente (En orden)'),
        ('COCINA', 'En Preparación'),
        ('SERVIDO', 'Servido'),
        ('CANCELADO', 'Cancelado'),
    )

    pedido_id    = models.ForeignKey(Pedido, on_delete=models.CASCADE, verbose_name='Pedido', related_name='items')
    producto_id  = models.ForeignKey(Producto, on_delete=models.PROTECT, verbose_name='Producto')
    cantidad     = models.PositiveIntegerField('Cantidad de Producto', default=1)
    precio_unit  = models.DecimalField('Precio Unitario del Producto', max_digits=10, decimal_places=2)
    observacion  = models.TextField('Observación del Producto', max_length=500, null=True, blank=True)
    subtotal     = models.DecimalField('Subtotal del Producto', max_digits=10, decimal_places=2)
    estado = models.CharField('Estado del Producto', max_length=10, choices=ESTADOS_ITEM, default='PENDIENTE')

    class Meta:
        verbose_name = 'Producto del Pedido'
        verbose_name_plural = 'Productos del Pedido'
        db_table = 'producto_pedido'

    def calcular_subtotal(self):
        return self.cantidad * self.precio_unit
