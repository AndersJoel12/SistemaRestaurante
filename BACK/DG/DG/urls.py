from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from apps.users.api.serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(serializer_class=CustomTokenObtainPairSerializer), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path('api/', include('apps.users.api.urls')),
    path('api/', include('apps.pedidos.api.url')),
    path('api/', include('apps.productos.api.urls')),
    path('api/', include('apps.facturacion.api.urls')),
]
