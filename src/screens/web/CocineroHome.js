// src/screens/web/CocineroHome.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const CocineroHomeScreen = () => {
  const { user, userData, logout } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState('todas'); // todas, pendientes, cocinando

  useEffect(() => {
    // Escuchar órdenes activas (no entregadas)
    const q = query(
      collection(db, 'ordenes'),
      where('estado', 'in', ['pendiente', 'cocinando', 'preparado'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordenesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar por fecha de creación
      ordenesData.sort((a, b) =>
        a.timestamps.creada?.toMillis() - b.timestamps.creada?.toMillis()
      );

      setOrdenes(ordenesData);
    });

    return () => unsubscribe();
  }, []);

  const cambiarEstado = async (ordenId, nuevoEstado) => {
    try {
      const updates = {
        estado: nuevoEstado,
        [`timestamps.${nuevoEstado === 'cocinando' ? 'cocinando' : 'preparada'}`]: new Date()
      };

      if (nuevoEstado === 'cocinando') {
        updates['cocinero.uid'] = user?.uid || userData?.id || 'sin_uid';
        updates['cocinero.nombre'] = userData.nombre;
        updates['cocinero.rol'] = userData.rol;
      }


      await updateDoc(doc(db, 'ordenes', ordenId), updates);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al actualizar el estado de la orden');
    }
  };

  const ordenesFiltradas = ordenes.filter(orden => {
    if (filtro === 'pendientes') return orden.estado === 'pendiente';
    if (filtro === 'cocinando') return orden.estado === 'cocinando';
    return true;
  });

  const formatearHora = (timestamp) => {
    if (!timestamp) return '';
    const fecha = timestamp.toDate();
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const calcularTiempoEspera = (timestamp) => {
    if (!timestamp) return '';
    const ahora = Date.now();
    const creada = timestamp.toMillis();
    const minutos = Math.floor((ahora - creada) / 60000);

    if (minutos < 5) return '🟢';
    if (minutos < 15) return '🟡';
    return '🔴';
  };

  const renderOrden = (orden) => {
    const tiempoIndicador = calcularTiempoEspera(orden.timestamps.creada);

    return (
      <View key={orden.id} style={styles.ordenCard}>
        {/* Header */}
        <View style={styles.ordenHeader}>
          <View style={styles.ordenHeaderLeft}>
            <Text style={styles.numeroOrden}>#{orden.numeroOrden}</Text>
            <Text style={styles.mesaOrden}>Mesa {orden.mesaNumero}</Text>
          </View>
          <View style={styles.ordenHeaderRight}>
            <Text style={styles.tiempoIndicador}>{tiempoIndicador}</Text>
            <Text style={styles.horaOrden}>{formatearHora(orden.timestamps.creada)}</Text>
          </View>
        </View>

        {/* Mesero info */}
        <View style={styles.meseroInfo}>
          <Text style={styles.meseroLabel}>Mesero:</Text>
          <Text style={styles.meseroNombre}>{orden.mesero.nombre}</Text>
        </View>

        {/* Items */}
        <View style={styles.itemsContainer}>
          {orden.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemCantidad}>
                <Text style={styles.cantidadText}>{item.cantidad}x</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemNombre}>{item.nombre}</Text>
                {item.notas && (
                  <Text style={styles.itemNotas}>⚠️ {item.notas}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Notas generales */}
        {orden.notas && (
          <View style={styles.notasGenerales}>
            <Text style={styles.notasLabel}>Notas de la orden:</Text>
            <Text style={styles.notasTexto}>{orden.notas}</Text>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.accionesContainer}>
          {orden.estado === 'pendiente' && (
            <TouchableOpacity
              style={[styles.botonAccion, styles.botonCocinar]}
              onPress={() => cambiarEstado(orden.id, 'cocinando')}
            >
              <Text style={styles.botonTexto}>🍳 Empezar a Cocinar</Text>
            </TouchableOpacity>
          )}

          {orden.estado === 'cocinando' && (
            <TouchableOpacity
              style={[styles.botonAccion, styles.botonPreparado]}
              onPress={() => cambiarEstado(orden.id, 'preparado')}
            >
              <Text style={styles.botonTexto}>✅ Marcar como Listo</Text>
            </TouchableOpacity>
          )}

          {orden.estado === 'preparado' && (
            <View style={[styles.estadoBadge, styles.estadoListo]}>
              <Text style={styles.estadoTexto}>✓ Listo para entregar</Text>
            </View>
          )}
        </View>

        {/* Estado visual */}
        <View style={[
          styles.estadoBarra,
          orden.estado === 'pendiente' && styles.estadoPendiente,
          orden.estado === 'cocinando' && styles.estadoCocinando,
          orden.estado === 'preparado' && styles.estadoPreparado
        ]} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Panel de Cocina</Text>
          <Text style={styles.headerSubtitle}>{userData.nombre}</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{ordenes.filter(o => o.estado === 'pendiente').length}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{ordenes.filter(o => o.estado === 'cocinando').length}</Text>
            <Text style={styles.statLabel}>Cocinando</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{ordenes.filter(o => o.estado === 'preparado').length}</Text>
            <Text style={styles.statLabel}>Listos</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[styles.filtroBtn, filtro === 'todas' && styles.filtroBtnActive]}
          onPress={() => setFiltro('todas')}
        >
          <Text style={[styles.filtroText, filtro === 'todas' && styles.filtroTextActive]}>
            Todas ({ordenes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filtroBtn, filtro === 'pendientes' && styles.filtroBtnActive]}
          onPress={() => setFiltro('pendientes')}
        >
          <Text style={[styles.filtroText, filtro === 'pendientes' && styles.filtroTextActive]}>
            Pendientes ({ordenes.filter(o => o.estado === 'pendiente').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filtroBtn, filtro === 'cocinando' && styles.filtroBtnActive]}
          onPress={() => setFiltro('cocinando')}
        >
          <Text style={[styles.filtroText, filtro === 'cocinando' && styles.filtroTextActive]}>
            Cocinando ({ordenes.filter(o => o.estado === 'cocinando').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grid de órdenes */}
      <ScrollView contentContainerStyle={styles.ordenesGrid}>
        {ordenesFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👨‍🍳</Text>
            <Text style={styles.emptyText}>
              {filtro === 'todas'
                ? 'No hay órdenes activas'
                : `No hay órdenes ${filtro === 'pendientes' ? 'pendientes' : 'en proceso'}`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {ordenesFiltradas.map(renderOrden)}
          </View>
        )}
      </ScrollView>

      {/* Leyenda */}
      <View style={styles.leyenda}>
        <Text style={styles.leyendaTitle}>Indicadores de tiempo:</Text>
        <View style={styles.leyendaItems}>
          <Text style={styles.leyendaItem}>🟢 Menos de 5 min</Text>
          <Text style={styles.leyendaItem}>🟡 5-15 min</Text>
          <Text style={styles.leyendaItem}>🔴 Más de 15 min</Text>
        </View>
      </View>
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
  headerStats: {
    flexDirection: 'row',
    gap: 20
  },
  statBox: {
    alignItems: 'center',
    minWidth: 80
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  statLabel: {
    fontSize: 13,
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
    fontWeight: '600'
  },
  filtrosContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 10
  },
  filtroBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center'
  },
  filtroBtnActive: {
    backgroundColor: '#007AFF'
  },
  filtroText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666'
  },
  filtroTextActive: {
    color: '#fff'
  },
  ordenesGrid: {
    padding: 20
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20
  },
  ordenCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: Dimensions.get('window').width > 1200 ? '32%' :
      Dimensions.get('window').width > 768 ? '48%' : '100%',
    minWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden'
  },
  ordenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0'
  },
  ordenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10
  },
  numeroOrden: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333'
  },
  mesaOrden: {
    fontSize: 20,
    color: '#666'
  },
  ordenHeaderRight: {
    alignItems: 'flex-end'
  },
  tiempoIndicador: {
    fontSize: 24,
    marginBottom: 5
  },
  horaOrden: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600'
  },
  meseroInfo: {
    flexDirection: 'row',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8
  },
  meseroLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8
  },
  meseroNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  itemsContainer: {
    marginBottom: 15
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF'
  },
  itemCantidad: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 6,
    marginRight: 12
  },
  cantidadText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  itemInfo: {
    flex: 1
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  itemNotas: {
    fontSize: 13,
    color: '#FF9500',
    fontStyle: 'italic',
    fontWeight: '500'
  },
  notasGenerales: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD60A'
  },
  notasLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6
  },
  notasTexto: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic'
  },
  accionesContainer: {
    marginTop: 15
  },
  botonAccion: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center'
  },
  botonCocinar: {
    backgroundColor: '#1E90FF'
  },
  botonPreparado: {
    backgroundColor: '#32CD32'
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  estadoBadge: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center'
  },
  estadoListo: {
    backgroundColor: '#E8F5E9'
  },
  estadoTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  estadoBarra: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6
  },
  estadoPendiente: {
    backgroundColor: '#FFA500'
  },
  estadoCocinando: {
    backgroundColor: '#1E90FF'
  },
  estadoPreparado: {
    backgroundColor: '#32CD32'
  },
  emptyContainer: {
    padding: 80,
    alignItems: 'center',
    width: '100%'
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20
  },
  emptyText: {
    fontSize: 20,
    color: '#999',
    textAlign: 'center'
  },
  leyenda: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  leyendaTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  leyendaItems: {
    flexDirection: 'row',
    gap: 20
  },
  leyendaItem: {
    fontSize: 13,
    color: '#666'
  }
});

export default CocineroHomeScreen;