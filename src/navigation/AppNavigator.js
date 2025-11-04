// src/navigation/AppNavigator.js
import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
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
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  // Sin sesión - Mostrar Login
  if (!userData) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // MÓVIL - Solo Mesero
  if (Platform.OS !== 'web') {
    if (userData.rol === 'mesero') {
      return (
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen 
              name="MeseroHome" 
              component={MeseroHomeScreen}
              options={{ title: 'Órdenes' }}
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
    } else {
      // Usuario no autorizado en móvil
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Esta aplicación móvil es solo para meseros.
          </Text>
          <Text style={styles.errorText}>
            Por favor, usa la versión web para {userData.rol}.
          </Text>
        </View>
      );
    }
  }

  // WEB - Cocinero y Admin
  if (Platform.OS === 'web') {
    if (userData.rol === 'cocinero') {
      return (
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen 
              name="CocineroHome" 
              component={CocineroHomeScreen}
              options={{ title: 'Cocina - Órdenes Activas' }}
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
              options={{ title: 'Panel de Administración' }}
            />
            <Stack.Screen 
              name="GestionUsuarios" 
              component={GestionUsuariosScreen}
              options={{ title: 'Gestión de Usuarios' }}
            />
            {/*<Stack.Screen 
              name="GestionMenu" 
              component={GestionMenuScreen}
              options={{ title: 'Gestión del Menú' }}
            />
            <Stack.Screen 
              name="Historial" 
              component={HistorialScreen}
              options={{ title: 'Historial de Órdenes' }}
            />*/}
          </Stack.Navigator>
        </NavigationContainer>
      );
    }

    // Mesero intentando acceder desde web
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Los meseros deben usar la aplicación móvil.
        </Text>
      </View>
    );
  }

  // Fallback
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Error: Rol no reconocido</Text>
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    color: '#333'
  }
});

export default AppNavigator;