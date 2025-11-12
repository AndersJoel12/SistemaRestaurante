from django.urls import path, include
from rest_framework.routers import DefaultRouter
#from .api import user_api_view, user_detail_api_view
from .views import EmpleadoViewSet

router = DefaultRouter()
router.register(r'empleados', EmpleadoViewSet, basename='empleados')

urlpatterns = [
    path('', include(router.urls)),
   # path('usuarios/', user_api_view, name='usuarios_api'),
   # path('usuario/<int:pk>/', user_detail_api_view, name='usuario-detail')
]
