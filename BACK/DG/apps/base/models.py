from django.db import models

class BaseModel(models.Model):
    id         = models.AutoField(primary_key=True)
    state      = models.BooleanField('Estado', default=True)
    created_at = models.DateField('Fecha de Creación',auto_now=False, auto_now_add=True)
    updated_at = models.DateField('Fecha de Modificación', auto_now=True, auto_now_add=False)
    deleted_at = models.DateField('Fecha de Eliminación', null=True, blank=True, auto_now=True, auto_now_add=False)
    created_by = models.CharField('Creado por', max_length=50, null=True, blank=True)
    updated_by = models.CharField('Modificado por', max_length=50, null=True, blank=True)
    deleted_by = models.CharField('Eliminado por', max_length=50, null=True, blank=True)

    class Meta:
        abstract = True
        verbose_name = 'Modelo Base'
        verbose_name_plural = 'Modelos Base'