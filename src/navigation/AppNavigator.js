import React, { useEffect, useState } from 'react';
import { Platform, View, Text, StyleSheet, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

// Screens compartidas
import LoginScreen from '../screens/shared/Login';

// Screens móvil (Mesero)
import MeseroHomeScreen from '../screens/mobile/MeseroHome';
import TomarOrdenScreen from '../screens/mobile/TomarOrden';
import MisOrdenesScreen from '../screens/mobile/MisOrdenes';

// Screens web (Cocinero y Admin)
import CocineroHomeScreen from '../screens/web/CocineroHome';
import AdminHomeScreen from '../screens/web/AdminHome';
import GestionUsuariosScreen from '../screens/web/GestionUsuarios';
import GestionMenuScreen from '../screens/web/GestionMenu';
import HistorialScreen from '../screens/web/Historial';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { userData, loading, logout } = useAuth();
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userData) return;

    // Detectar rol incorrecto según el dispositivo
    if (Platform.OS === 'web' && userData.rol === 'mesero') {
      setMessage('Este usuario debe usar la aplicación móvil.');
      setUnauthorized(true);

      // Cerrar sesión tras 2.5 s
      const timer = setTimeout(async () => {
        await logout();
        setUnauthorized(false);
      }, 2500);

      return () => clearTimeout(timer);
    }

    if (Platform.OS !== 'web' && userData.rol !== 'mesero') {
      setMessage(`Este usuario solo puede usar la versión web.`);
      setUnauthorized(true);

      const timer = setTimeout(async () => {
        await logout();
        setUnauthorized(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [userData]);


  //  Pantalla de carga
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  //  Mostrar mensaje de acceso denegado antes del logout
  if (unauthorized) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Acceso no permitido</Text>
        <Text style={styles.errorText}>{message}</Text>
        <Text style={styles.errorSubtext}>Cerrando sesión en unos segundos...</Text>
      </View>
    );
  }


  //  Sin sesión → Login
  if (!userData) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // 📱 MÓVIL — Solo Mesero
  if (Platform.OS !== 'web') {
    if (userData.rol === 'mesero') {
      return (
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="MeseroHome"
              component={MeseroHomeScreen}
              options={{
                headerTitle: () => (
                  <Image
                    source={require('./../../assets/icon.png')} // 👉 cambia la ruta a la de tu logo
                    style={{ width: 120, height: 40, resizeMode: 'contain' }}
                  />
                ),
                headerTitleAlign: 'center', // centra el logo
              }}
            />
            <Stack.Screen
              name="TomarOrden"
              component={TomarOrdenScreen}
              options={{ title: 'Nueva Orden' }}
            />
            <Stack.Screen
              name="MisOrdenes"
              component={MisOrdenesScreen}
              options={{ title: 'Mis Órdenes' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      );
    }
  }

  // 💻 WEB — Cocinero y Admin
  if (Platform.OS === 'web') {
    if (userData.rol === 'cocinero') {
      return (
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="CocineroHome"
              component={CocineroHomeScreen}
              options={{
                headerTitle: () => (
                  <Image
                    source={require('./../../assets/icon.png')} // 👉 cambia la ruta a la de tu logo
                    style={{ width: 120, height: 40, resizeMode: 'contain' }}
                  />
                ),
                headerTitleAlign: 'center', // centra el logo
              }}

            />
          </Stack.Navigator>
        </NavigationContainer>
      );
    }

    if (userData.rol === 'admin') {
      return (
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="AdminHome"
              component={AdminHomeScreen}
              options={{
                headerTitle: () => (
                  <Image
                    source={require('./../../assets/icon.png')} 
                    style={{ width: 120, height: 40, resizeMode: 'contain' }}
                  />
                ),
                headerTitleAlign: 'center', 
              }}
            />
            <Stack.Screen
              name="GestionUsuarios"
              component={GestionUsuariosScreen}
              options={{ title: 'Gestión de Usuarios' }}
            />
            <Stack.Screen
              name="GestionMenu"
              component={GestionMenuScreen}
              options={{ title: 'Gestión del Menú' }}
            />
            <Stack.Screen
              name="Historial"
              component={HistorialScreen}
              options={{ title: 'Historial de Órdenes' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      );
    }
  }

  // ⚠️ Rol desconocido
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.errorText}>Rol no reconocido o configuración inválida.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 10
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 10
  },
  errorSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 10
  }
});

export default AppNavigator;
