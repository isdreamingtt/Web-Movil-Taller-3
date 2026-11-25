# ICPC Tracker

**Taller 03 — Introducción al Desarrollo Web/Móvil**

ICPC Tracker es una aplicación web y móvil para registrar problemas de programación competitiva de plataformas como Codeforces, LeetCode y CSES, organizar su estado y visualizar el progreso personal. La versión móvil integra Angular con Capacitor para su ejecución en dispositivos Android.

## Integrantes

- Juan Alvarado
- Harold Ramos
- Cristian Pérez
- Gabriel Astudillo

## Funcionalidades

- Registro e inicio de sesión de usuarios.
- Gestión, filtrado y estadísticas de problemas de programación competitiva.
- Creación y uso compartido de listas de entrenamiento mediante códigos QR, con escaneo e importación de problemas desde Android.
- Registro de la ubicación mediante GPS al marcar un problema como resuelto.
- Selección de retos aleatorios al agitar el dispositivo mediante el acelerómetro.

## Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Frontend | Angular 22, Angular Material, TypeScript |
| Aplicación móvil | Capacitor 8, Android, Java |
| Capacidades móviles | ZXing, Capacitor Geolocation, Capacitor Motion |
| Backend | Python, FastAPI, SQLAlchemy, JWT |
| Base de datos | PostgreSQL |
| Construcción automatizada | Gradle, GitHub Actions |

## Requisitos previos

- [Git](https://git-scm.com/).
- [Node.js](https://nodejs.org/) 24.15.0 o superior dentro de la rama 24.x (incluye npm).
- [JDK 21](https://adoptium.net/temurin/releases/?version=21).
- [Android Studio](https://developer.android.com/studio) con Android SDK Platform 36, SDK Build-Tools y Platform-Tools.
- Dispositivo con Android 7.0 (API 24) o superior y conexión a Internet.

Para ejecutar el backend localmente también se requiere Python 3.12 y PostgreSQL.

## 1. Obtener el proyecto

```bash
git clone URL_DEL_REPOSITORIO
cd Web-Movil-Taller-3
```

Reemplazar `URL_DEL_REPOSITORIO` por la dirección del repositorio. Si se descargó como ZIP, extraerlo y abrir la carpeta raíz.

## 2. Construir la aplicación Android

Desde la raíz del proyecto:

```bash
cd frontend
npm ci
npm run build:prod
npx cap sync android
```

El build de producción de Angular se genera en `frontend/dist/frontend/browser/`. Capacitor copia estos archivos y sincroniza las dependencias con el proyecto nativo ubicado en `frontend/android/`.

La aplicación utiliza la API de producción configurada en `frontend/src/environments/environment.prod.ts`:

<https://web-movil-taller-3-production.up.railway.app>

No es necesario ejecutar el backend local para utilizar la aplicación Android mientras este servicio esté disponible. Su estado puede consultarse en [/health](https://web-movil-taller-3-production.up.railway.app/health).

## 3. Ejecutar en un dispositivo Android

Desde la carpeta `frontend`, abrir el proyecto nativo:

```bash
npm run cap:open
```

1. Completar la sincronización de Gradle en Android Studio y configurar JDK 21 como Gradle JDK.
2. En el teléfono, habilitar las opciones de desarrollador pulsando siete veces sobre el número de compilación en Ajustes y activar la depuración USB.
3. Conectar el dispositivo al computador mediante USB y aceptar la autorización de depuración.
4. Seleccionar el dispositivo y la configuración `app` en Android Studio, y pulsar **Run**.

Después de modificar el frontend, ejecutar `npm run cap:sync` desde `frontend` para reconstruir y sincronizar la aplicación antes de ejecutarla nuevamente.

## 4. Generar el APK

Después de completar la construcción del frontend y la sincronización con Capacitor, acceder a `frontend/android` desde la carpeta `frontend`:

```bash
cd android
```

**Windows (PowerShell):**

```powershell
.\gradlew.bat assembleDebug
```

**Linux/macOS:**

```bash
chmod +x gradlew
./gradlew assembleDebug
```

Si se compila desde la terminal, configurar `JAVA_HOME` para JDK 21 y `ANDROID_HOME` con la ruta del SDK de Android, si aún no están configurados.

El APK generado se encuentra en la siguiente ruta, relativa a la raíz del repositorio:

```text
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## 5. Construcción automatizada con GitHub Actions

El workflow `.github/workflows/android-build.yml` se ejecuta automáticamente ante cambios en la rama `main` y también puede ejecutarse manualmente. Realiza el build de producción de Angular, sincroniza Capacitor, compila Android mediante Gradle y publica el APK debug como artefacto.

Para obtener el APK desde GitHub:

1. Acceder a la pestaña **Actions** del repositorio.
2. Seleccionar el workflow **Build Android APK**.
3. Abrir una ejecución exitosa o iniciar una nueva mediante **Run workflow**.
4. Descargar el artefacto `icpc-tracker-debug-apk` desde **Artifacts** y extraer el archivo `app-debug.apk`.

## 6. Instalar el APK en Android

1. Transferir el archivo `app-debug.apk` al dispositivo Android.
2. Abrir el archivo desde el administrador de archivos y autorizar la instalación desde esa fuente si Android lo solicita.
3. Instalar y abrir **ICPC Tracker**.

La aplicación requiere conexión a Internet para comunicarse con el backend. Los permisos de cámara y ubicación se solicitan al utilizar las funcionalidades correspondientes.

## 7. Ejecutar la aplicación web localmente (Opcional)

### Base de datos

Iniciar PostgreSQL, conectarse mediante `psql -U postgres` y crear la base de datos:

```sql
CREATE DATABASE tracker;
```

### Backend

Desde la raíz del repositorio:

```bash
cd backend
python -m venv venv
```

**Windows (PowerShell):**

```powershell
.\venv\Scripts\Activate.ps1
Copy-Item .env.example .env
```

**Linux/macOS:**

```bash
source venv/bin/activate
cp .env.example .env
```

Instalar las dependencias:

```bash
python -m pip install -r requirements.txt
```

Editar el archivo `backend/.env`, reemplazando la contraseña de PostgreSQL y el secreto JWT por valores propios:

```dotenv
DATABASE_URL=postgresql+psycopg2://postgres:TU_PASSWORD@localhost:5432/tracker
JWT_SECRET=TU_SECRETO_ALEATORIO
JWT_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:4200,https://localhost,http://localhost,capacitor://localhost
```

El secreto JWT puede generarse con `python -c "import secrets; print(secrets.token_hex(32))"`.

Iniciar el backend desde `backend/`:

```bash
uvicorn app.main:app --reload
```

Las tablas se crean automáticamente al iniciar el servidor. La documentación de la API está disponible en <http://localhost:8000/docs>.

### Frontend

En otra terminal, desde la raíz del repositorio:

```bash
cd frontend
npm ci
npm start
```

Para ejecutar la versión web conectada a la API de producción, utilizar `npx ng serve --configuration production` en lugar de `npm start`.
