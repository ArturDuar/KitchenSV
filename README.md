# 🍽️ Sistema de Restaurante

Sistema de gestión de órdenes con React Native y Firebase. Incluye app móvil para meseros y panel web para cocineros y admins.

## ✨ Características

- **Meseros (Móvil)**: Tomar órdenes, agregar notas, ver historial
- **Cocineros (Web)**: Gestionar órdenes en tiempo real con indicadores de tiempo
- **Admins (Web)**: Gestionar usuarios, menú, historial y estadísticas

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar Firebase en src/config/firebase.js

# Iniciar proyecto
npx expo start
```

## 📱 Estructura

```
src/
├── config/          # Firebase
├── contexts/        # AuthContext
├── navigation/      # Navegación
└── screens/
    ├── shared/      # Login
    ├── mobile/      # Meseros
    └── web/         # Cocineros y Admins
```

## 🔐 Roles

- **Admin**: Web, Firebase Auth, acceso total
- **Cocinero**: Web, Firestore, gestión de órdenes
- **Mesero**: Móvil, Firestore, tomar órdenes

## 📊 Colecciones Firestore

**usuarios**: `{ nombre, email, password, rol, activo }`

**menu**: `{ nombre, descripcion, precio, categoria, disponible }`

**ordenes**: `{ numeroOrden, mesaNumero, items[], subtotal, estado, mesero{}, cocinero{}, timestamps{}, notas }`

## 🛠️ Tecnologías

React Native · Expo · Firebase · React Navigation
