// src/screens/web/AdminHome.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const AdminHomeScreen = ({ navigation }) => {
  const { userData, logout } = useAuth();

  const menuOptions = [
    {
      id: 'usuarios',
      title: 'Gestión de Usuarios',
      description: 'Crear y administrar meseros, cocineros y admins',
      icon: '👥',
      color: '#007AFF',
      route: 'GestionUsuarios'
    },
    {
      id: 'menu',
      title: 'Gestión del Menú',
      description: 'Agregar, editar y eliminar productos del menú',
      icon: '🍽️',
      color: '#FF9500',
      route: 'GestionMenu'
    },
    {
      id: 'historial',
      title: 'Historial de Órdenes',
      description: 'Ver todas las órdenes y estadísticas',
      icon: '📊',
      color: '#32CD32',
      route: 'Historial'
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Panel de Administración</Text>
          <Text style={styles.headerSubtitle}>Bienvenido, {userData.nombre}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Tarjetas de opciones */}
        <View style={styles.menuGrid}>
          {menuOptions && menuOptions?.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.menuCard, { borderTopColor: option.color }]}
              onPress={() => navigation.navigate(option.route)}
            >
              <Text style={styles.menuIcon}>{option.icon}</Text>
              <Text style={styles.menuTitle}>{option.title}</Text>
              <Text style={styles.menuDescription}>{option.description}</Text>
              <View style={[styles.menuButton, { backgroundColor: option.color }]}>
                <Text style={styles.menuButtonText}>Acceder →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info adicional */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Información del Sistema</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Rol</Text>
              <Text style={styles.infoValue}>Administrador</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userData.email}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={[styles.infoValue, { color: '#32CD32' }]}>Activo</Text>
            </View>
          </View>
        </View>

        {/* Instrucciones */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>📌 Funciones Principales</Text>
          
          <View style={styles.instructionCard}>
            <Text style={styles.instructionIcon}>👥</Text>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Gestión de Usuarios</Text>
              <Text style={styles.instructionText}>
                • Crear nuevos usuarios con diferentes roles{'\n'}
                • Asignar permisos específicos{'\n'}
                • Activar o desactivar cuentas
              </Text>
            </View>
          </View>

          <View style={styles.instructionCard}>
            <Text style={styles.instructionIcon}>🍽️</Text>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Gestión del Menú</Text>
              <Text style={styles.instructionText}>
                • Agregar nuevos productos al menú{'\n'}
                • Editar precios y descripciones{'\n'}
                • Marcar productos como disponibles/no disponibles
              </Text>
            </View>
          </View>

          <View style={styles.instructionCard}>
            <Text style={styles.instructionIcon}>📊</Text>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Historial y Estadísticas</Text>
              <Text style={styles.instructionText}>
                • Ver todas las órdenes completadas{'\n'}
                • Filtrar por fecha y mesero{'\n'}
                • Analizar tiempos de servicio
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333'
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4
  },
  logoutButton: {
    padding: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 8
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15
  },
  content: {
    padding: 20
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 30
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    width: Dimensions.get('window').width > 1200 ? '32%' : 
           Dimensions.get('window').width > 768 ? '48%' : '100%',
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderTopWidth: 4,
    alignItems: 'center'
  },
  menuIcon: {
    fontSize: 60,
    marginBottom: 15
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center'
  },
  menuDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  menuButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  infoSection: {
    marginBottom: 30
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    flex: 1,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  instructionsSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20
  },
  instructionCard: {
    flexDirection: 'row',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10
  },
  instructionIcon: {
    fontSize: 40,
    marginRight: 15
  },
  instructionContent: {
    flex: 1
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22
  }
});

export default AdminHomeScreen;