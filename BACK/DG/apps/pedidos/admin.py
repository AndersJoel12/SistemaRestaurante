from django.contrib import admin
from .models import Mesa, Pedido, ProductoPedido

admin.site.register(Mesa)
admin.site.register(Pedido)
admin.site.register(ProductoPedido)
