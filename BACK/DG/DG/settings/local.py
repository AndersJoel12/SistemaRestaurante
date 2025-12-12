from .base import *

#DEBUG = True
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', os.environ.get('HOSTS_PERMITIDOS')]

#DATABASES = {
#    'default': {
#        'ENGINE': 'django.db.backends.sqlite3',
#        'NAME': BASE_DIR / 'db.sqlite3',
#    }
#}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRESLOCAL_DB'),
        'USER': os.environ.get('POSTGRESLOCAL_USER'),
        'PASSWORD': os.environ.get('POSTGRESLOCAL_PASSWORD'),
        'HOST': os.environ.get('POSTGRESLOCAL_HOST'),
        'PORT': os.environ.get('POSTGRESLOCAL_PORT'),
    }
}

STATIC_URL = 'static/'