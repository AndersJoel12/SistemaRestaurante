# users/views.py (o authentication/views.py)
import os
from dotenv import load_dotenv
from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView # 👈 La vista original
import requests # 👈 Necesario para hablar con Google

load_dotenv()

class LoginConCaptchaView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # 1. Obtenemos el token que envió el Frontend
        recaptcha_token = request.data.get('recaptcha_token')

        # Si no hay token, rechazamos la entrada inmediatamente
        if not recaptcha_token:
            return Response(
                {"detail": "Falta la validación del CAPTCHA."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Preguntamos a Google si el token es real
        google_data = {
        'secret': os.getenv('RECAPTCHA_SECRET_KEY'), # 👈 Busca la clave en el .env
        'response': recaptcha_token
        }
        
        try:
            verify_response = requests.post(
                'https://www.google.com/recaptcha/api/siteverify', 
                data=google_data
            )
            result = verify_response.json()
        except Exception as e:
            return Response(
                {"detail": "Error conectando con Google."}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # 3. Si Google dice que NO es válido (success: false)
        if not result.get('success'):
            return Response(
                {"detail": "Captcha inválido o expirado. Intenta de nuevo."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. SI TODO ESTÁ BIEN: Ejecutamos el login normal de Django
        # Esto llamará a la lógica original que verifica email/password y devuelve el token
        return super().post(request, *args, **kwargs)