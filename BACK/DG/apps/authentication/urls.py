# urls.py

from django.urls import path
from .views import LoginConCaptchaView # 👈 Importa tu nueva vista
# from rest_framework_simplejwt.views import TokenObtainPairView  <-- BORRA o COMENTA ESTA si la tenías directa

urlpatterns = [
    # ... otras rutas ...
    
    # Cambia la vista vieja por la nueva:
    path('token/', LoginConCaptchaView.as_view(), name='token_obtain_pair'),
    
    # ... otras rutas ...
]