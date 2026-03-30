# Giro Rides - API de Notificaciones Push 🚀

Esta es la documentación de los endpoints de la API para el servicio de notificaciones push de Giro Rides.

La URL base para todas las rutas es: `http://localhost:3000` (o la URL de producción).

## Rutas de Estado

### 1. Comprobación de Estado (Root)
*   **URL:** `/`
*   **Método:** `GET`
*   **Respuesta:** `🚀 Giro Rides API`

### 2. Comprobación de API v1
*   **URL:** `/api/v1/`
*   **Método:** `GET`
*   **Respuesta:** `{ "message": "API de Giro Rides" }`

## Configuración y Subscripciones (Prefijo: `/api/v1/push`)

### 3. Obtener Public Key (VAPID)
Obtiene la clave pública necesaria para configurar las notificaciones en el frontend.

*   **URL:** `/api/v1/push/public-key`
*   **Método:** `GET`
*   **Respuesta Exitosa:**
    ```json
    { "publicKey": "TU_VAPID_PUBLIC_KEY" }
    ```

### 2. Obtener Suscripciones
Lista todas las suscripciones guardadas en el sistema.

*   **URL:** `/api/v1/push/subscriptions`
*   **Método:** `GET`
*   **Respuesta Exitosa:**
    ```json
    {
      "total": 5,
      "subscriptions": [ ... ]
    }
    ```

---

## Suscripción

### 3. Suscribirse
Guarda una nueva suscripción de navegador vinculada a un usuario.

*   **URL:** `/api/v1/push/subscribe`
*   **Método:** `POST`
*   **Cuerpo (JSON):**
    ```json
    {
      "subscription": {
        "endpoint": "https://fcm.googleapis.com/fcm/send/...",
        "keys": {
          "p256dh": "...",
          "auth": "..."
        }
      },
      "user": {
        "userId": "123",
        "role": "driver",
        "vehicleType": "car"
      }
    }
    ```
*   **Respuesta Exitosa:**
    ```json
    { "message": "Guardado en Firebase", "total": 6 }
    ```

---

## Envío de Notificaciones

### 4. Notificar a Todos
Envía una notificación a todos los dispositivos suscritos.

*   **URL:** `/api/v1/push/send-all`
*   **Método:** `POST`
*   **Cuerpo (JSON):**
    ```json
    {
      "title": "Título de la Notificación",
      "message": "Mensaje para todos"
    }
    ```

### 5. Notificar a Drivers
Envía una notificación a los conductores. Se puede filtrar por tipo de vehículo.

*   **URL:** `/api/v1/push/send-drivers`
*   **Método:** `POST`
*   **Cuerpo (JSON):**
    ```json
    {
      "title": "Nuevo Viaje",
      "message": "Hay un viaje disponible cerca de ti",
      "vehicleType": "Moto" 
    }
    ```
    *`vehicleType` es opcional. Si no se envía, llegará a todos los conductores.*

### 6. Notificar a un Usuario Específico
Envía una notificación a un `userId` determinado.

*   **URL:** `/api/v1/push/send-user`
*   **Método:** `POST`
*   **Cuerpo (JSON):**
    ```json
    {
      "title": "Tu pedido llegó",
      "message": "El repartidor está en la puerta",
      "userId": "user_abc_123"
    }
    ```

### 7. Notificar a Administradores
Envía una notificación a todos los usuarios con rol de administrador.

*   **URL:** `/api/v1/push/send-admin`
*   **Método:** `POST`
*   **Cuerpo (JSON):**
    ```json
    {
      "title": "Alerta de Sistema",
      "message": "Se ha detectado un error crítico"
    }
    ```

---

## Probando con cURL (Ejemplo)

```bash
curl -X POST http://localhost:3000/api/v1/push/send-all \
     -H "Content-Type: application/json" \
     -d '{"title": "Hola", "message": "Prueba de notificación"}'
```
