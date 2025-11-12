from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Dish
from .serializers import DishSerializer

class DishViewSet(viewsets.ModelViewSet):
    # Le dice a la vista qué datos consultar
    queryset = Dish.objects.all().order_by('id') 
    # Le dice a la vista qué serializador usar para JSON
    serializer_class = DishSerializer