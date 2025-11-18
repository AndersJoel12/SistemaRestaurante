from django.db import models
from apps.base.models import BaseModel

# Modelo de Producto --ListoAparentemente 4:10am 12/11/25--
class Producto(BaseModel):
    nombre       = models.CharField('Nombre del Producto', max_length=100)
    imagen       = models.ImageField('Imagen del Producto', upload_to='media/productos/', null=True, blank=True)
    descripcion  = models.TextField('Descripción del Producto', max_length=500, null=True, blank=True)
    precio       = models.DecimalField('Precio del Producto', max_digits=10, decimal_places=2)
    disponible   = models.BooleanField('Disponibilidad', default=False)
    categoria = models.ForeignKey('Categoria', on_delete=models.PROTECT, verbose_name='Categoría del Producto')

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        db_table = 'producto'

    def __str__(self):
        return self.nombre

# Modelo de Categoría --ListoAparentemente 4:11am 12/11/25--
class Categoria(BaseModel):
    nombre       = models.CharField('Nombre de la Categoría', max_length=100, unique=True)
    estado       = models.BooleanField('Estado de la Categoría', default=True)
    

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        db_table = 'categoria'

    def __str__(self):
        return self.nombre