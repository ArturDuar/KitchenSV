import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const MeseroHomeScreen = ({ navigation }) => {
  const { user, userData, logout } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!userData) return;

    // Identificador único del mesero (de Firestore, no de Auth)
    const meseroUid = userData.uid || userData.id;

    if (!meseroUid) {
      console.warn('⚠️ No hay UID de mesero disponible en userData.');
      return;
    }

    // 🔹 Escuchar órdenes del mesero actual en tiempo real
    const q = query(collection(db, 'ordenes'), where('mesero.uid', '==', meseroUid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordenesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        // Ordenar por fecha (más recientes primero)
        ordenesData.sort(
          (a, b) => b.timestamps.creada?.toMillis() - a.timestamps.creada?.toMillis()
        );

        setOrdenes(ordenesData);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error al obtener órdenes:', error);
        Alert.alert('Error', 'No se pudieron cargar las órdenes');
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [userData]);

  const marcarEntregado = async (ordenId) => {
    try {
      await updateDoc(doc(db, 'ordenes', ordenId), {
        estado: 'entregado',
        'timestamps.entregada': new Date()
      });
    } catch (error) {
      console.error('Error al marcar como entregado:', error);
      Alert.alert('Error', 'No tienes permiso para marcar esta orden como entregada');
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: '#FFA500',
      cocinando: '#1E90FF',
      preparado: '#32CD32',
      entregado: '#808080'
    };
    return colores[estado] || '#000';
  };

  const renderOrden = ({ item }) => (
    <View style={styles.ordenCard}>
      <View style={styles.ordenHeader}>
        <Text style={styles.numeroOrden}>Orden #{item.numeroOrden}</Text>
        <View
          style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}
        >
          <Text style={styles.estadoText}>{item.estado.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.mesaText}>Mesa: {item.mesaNumero}</Text>

      <View style={styles.itemsContainer}>
        {item.items.map((producto, index) => (
          <Text key={index} style={styles.itemText}>
            {producto.cantidad}x {producto.nombre}
          </Text>
        ))}
      </View>

      <Text style={styles.totalText}>Total: ${item.subtotal?.toFixed(2) || 0}</Text>

      {item.estado === 'preparado' && (
        <TouchableOpacity
          style={styles.entregarButton}
          onPress={() => marcarEntregado(item.id)}
        >
          <Text style={styles.entregarButtonText}>Marcar como Entregado</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hola, {userData?.nombre || 'Mesero'}</Text>
          <Text style={styles.roleText}>Mesero</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.nuevaOrdenButton}
        onPress={() => navigation.navigate('TomarOrden')}
      >
        <Text style={styles.nuevaOrdenText}>+ Nueva Orden</Text>
      </TouchableOpacity>

      <FlatList
        data={ordenes}
        keyExtractor={(item) => item.id}
        renderItem={renderOrden}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(true)}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay órdenes activas</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  roleText: { fontSize: 14, color: '#666', marginTop: 4 },
  logoutButton: { padding: 10 },
  logoutText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
  nuevaOrdenButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  nuevaOrdenText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  listContainer: { padding: 15 },
  ordenCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  ordenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  numeroOrden: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  estadoBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  estadoText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  mesaText: { fontSize: 16, color: '#666', marginBottom: 10 },
  itemsContainer: { marginVertical: 10 },
  itemText: { fontSize: 14, color: '#333', marginBottom: 4 },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 10 },
  entregarButton: {
    backgroundColor: '#32CD32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15
  },
  entregarButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' }
});

export default MeseroHomeScreen;
