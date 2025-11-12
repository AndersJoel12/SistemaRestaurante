# 🍽️ DeliGood - Sistema de Pedidos y Facturación (Backend API)

¡Bienvenido! 👋 Este es el repositorio del **Backend de DeliGood**, el sistema diseñado para la gestión **eficiente** de pedidos, mesas y facturación en restaurantes.

> 🌟 Este proyecto proporciona la infraestructura de la API para una administración de restaurante robusta y escalable.

---

## 🚀 Tecnologías Principales del Backend

El Backend de DeliGood está construido sobre una pila de tecnologías **modernas** y **confiables**:

| Icono | Tecnología | Versión/Detalle | Propósito |
| :---: | :---: | :---: | :--- |
| 🐍 | **Framework** | Django 5.x | El corazón del proyecto. |
| ⚙️ | **API** | Django Rest Framework (DRF) | Creación de endpoints **RESTful** rápidos. |
| 🐘 | **Base de Datos** | PostgreSQL 15 | Almacenamiento de datos **escalable** y robusto. |
| 📑 | **Documentación** | Swagger / ReDoc | Generación automática de documentación de la API. |

---

## ⚙️ Instalación y Configuración Local

Sigue estos pasos para poner a correr la API en tu máquina local.

### 1. Requisitos Previos

Asegúrate de tener instalado lo siguiente antes de comenzar:

* 🐍 **[Python 3.10 o superior]**($<https://www.python.org/downloads/>$)
* 📦 **[Git]**($<https://git-scm.com/downloads>$)
* 🐘 **[PostgreSQL]**($<https://www.postgresql.org/download/>$) (Opcional, si deseas usar una DB local. Si no, puedes usar una solución en la nube como Neon).

### 2. Configuración del Entorno Virtual e Instalación de Dependencias

1.  **Crea el entorno virtual:**

    ```bash
    python -m venv .env
    ```

2.  **Activa el entorno:**

    * **En Windows 🖥️:**
        ```bash
        .\.env\Scripts\activate
        ```
    * **En Linux/macOS 🍎:**
        ```bash
        source .env/bin/activate
        ```

3.  **Instala todas las dependencias:**

    > ⚠️ **Nota:** La ruta del archivo de requisitos es crucial.

    ```bash
    pip install -r BACK/DG/requirements.txt
    ```

### 3. Configurar Variables de Entorno (`.env`)

El proyecto utiliza un archivo `.env` para manejar las claves secretas y credenciales de la base de datos de manera segura.

1.  Crea un archivo llamado **`.env`** en la raíz del proyecto (`/SistemaRestaurante/BACK/DG/.env`).
2.  Copia y pega el siguiente contenido, **reemplazando** los valores genéricos por los que te proporcionó el equipo de backend:

    ```env
    # CLAVES DE SEGURIDAD
    SECRET_KEY="tu-clave-secreta-larga"
    DEBUG="True"

    # HOSTS PERMITIDOS (Para desarrollo local)
    ALLOWED_HOSTS="127.0.0.1,localhost"

    # CONFIGURACIÓN DE BASE DE DATOS LOCAL
    POSTGRES_DB="deligood_local"
    POSTGRES_USER="tu_usuario_local"
    POSTGRES_PASSWORD="tu_password_local"
    POSTGRES_HOST="localhost"
    POSTGRES_PORT="5432"

    # URL de conexión de NEON (PRODUCCIÓN):
    # *Esto es solo para referencia o si quieres probar con la DB en línea.*
    # DATABASE_URL="postgresql://neondb_owner:npg_8J2LCBuKViHX@..."
    ```

### 4. Crea una Base de Datos en PostgreSQL

Debes crear una base de datos con el mismo nombre que definiste en tu variable de entorno:

> `POSTGRES_DB="name"`

### 5. Configurar Base de Datos

Asegúrate de que tu servidor PostgreSQL local esté **corriendo** y luego aplica las configuraciones:

1.  **Aplicar las migraciones** a la base de datos local:

    ```bash
    python manage.py migrate
    ```

2.  **Crear un usuario administrador** (se te pedirá Cédula, Nombre, Email, Contraseña, etc.):

    ```bash
    python manage.py createsuperuser
    ```

### 6. Ejecutar el Servidor

¡Estás listo para correr la API! 🥳

```bash
python manage.py runserver```

La API estará corriendo en http://127.0.0.1:8000/

### 📑 Documentación de la API (Swagger / ReDoc)
*Toda la estructura de la API (modelos, endpoints, métodos HTTP, campos requeridos) está documentada automáticamente gracias a DRF.*

Puedes acceder a la documentación interactiva aquí:

Swagger UI 📝: http://127.0.0.1:8000/api/schema/swagger-ui/

ReDoc 📚: http://127.0.0.1:8000/api/schema/redoc/

Panel de Administración de Django
Accede al panel de administración para gestionar modelos directamente:

Admin Panel 🔑: http://127.0.0.1:8000/admin

"Recuerde loguearse con el superusuario creado en el paso 5 de la configuración de la Base de Datos."

### 📦 Estructura del Proyecto
```
Aquí te mostramos cómo está organizado el código principal:
DG/: Carpeta principal del proyecto Django (settings, urls, wsgi, etc.).
DG/settings/: Contiene la configuración específica (base.py, local.py).
apps/: Contiene las aplicaciones modulares del sistema (ej: users, pedidos, productos, etc.).
requirements.txt: Lista de todas las dependencias de Python necesarias.
```