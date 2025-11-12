from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/', admin.site.urls),
    path('api/', include('apps.users.api.urls')),
    path('api/', include('apps.pedidos.api.url')),
    path('api/', include('apps.productos.api.urls')),
    path('api/', include('apps.facturacion.api.urls')),
]
