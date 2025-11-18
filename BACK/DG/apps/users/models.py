from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin
from simple_history.models import HistoricalRecords

class UserManager(BaseUserManager):
    def _create_user(self, username, email, name, last_name, cedula, rol ,password, is_staff, is_superuser, **extra_fields):
        if not username:
            raise ValueError('El nombre de usuario es obligatorio')

        user = self.model(
            username=username,
            email=self.normalize_email(email),   
            name=name,
            last_name=last_name,
            cedula=cedula,
            rol=rol,
            is_staff=is_staff,
            is_superuser=is_superuser,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self.db)
        return user
    
    def create_user(self, username, email, name, last_name, cedula, rol='mesero', password=None, **extra_fields):
        return self._create_user(username, email, name, last_name, cedula, rol, password, False, False, **extra_fields)
    
    def create_superuser(self, username, email, name, last_name, cedula, rol='admin',  password=None, **extra_fields):
        return self._create_user(username, email, name, last_name, cedula, 'admin', password, True, True, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    roles = (
        ('administrador', 'Administrador'),
        ('mesero', 'Mesero'),
        ('cocinero', 'Cocinero'),
        ('cliente', 'Cliente'),
    )
    
    username = models.CharField('Nombre de Usuario', max_length=255, unique=True)
    email = models.EmailField('Correo Electrónico', max_length=255, unique=True)
    
    name = models.CharField('Nombres', max_length=255, blank=True, null=True)
    last_name = models.CharField('Apellidos', max_length=255, blank=True, null=True)
    
    cedula = models.IntegerField('Cédula', unique=True)
    rol = models.CharField('Rol', max_length=20, choices=roles, default='mesero')

    is_active = models.BooleanField('Estado', default=True)
    is_staff = models.BooleanField('personal', default=False)

    historical = HistoricalRecords()

    objects = UserManager()

    class Meta:
        verbose_name = 'Empleado'
        verbose_name_plural = 'Empleados'
        db_table = 'usuario'

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'name', 'last_name', 'cedula']

    def __str__(self):
        return f'{self.name} {self.last_name}'