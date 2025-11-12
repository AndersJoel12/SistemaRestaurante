from django.db import models

class Dish(models.Model):
    # Ya no necesitas id, Django lo añade automáticamente.
    category = models.CharField(max_length=50) 
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=6, decimal_places=2) # Para precios con decimales
    available = models.BooleanField(default=True)
    
    # Esto ayuda a que se vea bien en el panel de administración de Django
    def __str__(self):
        return self.name