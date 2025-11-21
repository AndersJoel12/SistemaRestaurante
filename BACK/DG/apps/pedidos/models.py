from django.db import models
from apps.base.models import BaseModel
from apps.productos.models import Producto
from apps.users.models import User as Empleado

class Mesa(BaseModel):
    numero    = models.IntegerField('Número de Mesa', unique=True)
    capacidad = models.IntegerField('Capacidad de la Mesa')
    ubicacion = models.CharField('Ubicación de la Mesa', max_length=100)
    # CORRECCIÓN: default=False. False significa LIBRE. True significa OCUPADA.
    estado    = models.BooleanField('Ocupada', default=False) 

    class Meta:
        verbose_name = 'Mesa'
        verbose_name_plural = 'Mesas'
        db_table = 'mesa'
        ordering = ['numero'] # Para que salgan ordenadas

    def __str__(self):
        estado_texto = "Ocupada" if self.estado else "Libre"
        return f'Mesa N°{self.numero} ({estado_texto}) - {self.ubicacion}'
    
    # --- MÉTODOS DE LÓGICA DE NEGOCIO ---
    def ocupar(self):
        """Marca la mesa como OCUPADA (True)"""
        self.estado = True
        self.save()
        return True
    
    def liberar(self):
        """Marca la mesa como LIBRE (False)"""
        self.estado = False
        self.save()
        return True

class Pedido(BaseModel):
    ESTADOS_PEDIDO = (
        ('ABIERTO', 'Abierto (Tomando orden)'),
        ('EN_ESPERA', 'En Espera (Enviado a cocina)'),
        ('PREPARADO', 'Listo para Servir'),
        ('CERRADO', 'Cerrado (Pagado)'),
        ('ENTREGADO', 'Entregado al Cliente'),
        ('ANULADO', 'Anulado'),
    )
    
    # CORRECCIÓN DE NOMBRES (Quitamos el _id y mayúsculas)
    mesa = models.ForeignKey(Mesa, on_delete=models.PROTECT, verbose_name='Mesa')
    empleado = models.ForeignKey(Empleado, on_delete=models.PROTECT, verbose_name='Empleado que Toma el Pedido')
    
    fecha = models.DateField('Fecha de Pedido', auto_now_add=True)
    hora  = models.TimeField('Hora de Pedido', auto_now_add=True)
    observacion = models.TextField('Observación del Pedido', max_length=500, null=True, blank=True)
    
    # Mantenemos CostoTotal porque ya ajustamos el Frontend/Serializer a este nombre
    CostoTotal = models.DecimalField('Costo Total del Pedido', max_digits=10, decimal_places=2, default=0.00)
    
    estado_pedido = models.CharField('Estado del Pedido', max_length=15, choices=ESTADOS_PEDIDO, default='ABIERTO')
    
    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        db_table = 'pedido'
    
    def __str__(self):
        return f"Pedido #{self.id} - Mesa {self.mesa.numero}"
    

class ProductoPedido(BaseModel):
    ESTADOS_ITEM = (
        ('PENDIENTE', 'Pendiente (En orden)'),
        ('COCINA', 'En Preparación'),
        ('SERVIDO', 'Servido'),
        ('CANCELADO', 'Cancelado'),
    )

    # CORRECCIÓN DE NOMBRES (Quitamos el _id)
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, verbose_name='Pedido', related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, verbose_name='Producto')
    
    cantidad = models.PositiveIntegerField('Cantidad de Producto', default=1)
    precio_unit = models.DecimalField('Precio Unitario del Producto', max_digits=10, decimal_places=2)
    observacion = models.TextField('Observación del Producto', max_length=500, null=True, blank=True)
    subtotal = models.DecimalField('Subtotal del Producto', max_digits=10, decimal_places=2)
    estado = models.CharField('Estado del Producto', max_length=10, choices=ESTADOS_ITEM, default='PENDIENTE')

    class Meta:
        verbose_name = 'Producto del Pedido'
        verbose_name_plural = 'Productos del Pedido'
        db_table = 'producto_pedido'

    def calcular_subtotal(self):
        return self.cantidad * self.precio_unit