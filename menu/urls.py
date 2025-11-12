from rest_framework.routers import DefaultRouter
from .views import DishViewSet

router = DefaultRouter()
# Registra la ruta '/dishes/' para el CRUD completo
router.register(r'dishes', DishViewSet) 

urlpatterns = router.urls