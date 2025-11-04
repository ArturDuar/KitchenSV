// src/screens/mobile/MisOrdenes.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const MisOrdenesScreen = () => {
  const { user } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState('todas'); // todas, activas, completadas
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'ordenes'),
      where('mesero.uid', '==', user.uid),
      orderBy('timestamps.creada', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordenesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrdenes(ordenesData);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const ordenesFiltradas = ordenes.filter(orden => {
    if (filtro === 'activas') {
      return orden.estado !== 'entregado';
    }
    if (filtro === 'completadas') {
      return orden.estado === 'entregado';
    }
    return true;
  });

  const formatearFecha = (timestamp) => {
    if (!timestamp) return 'N/A';
    const fecha = timestamp.toDate();
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoInfo = (estado) => {
    const info = {
      pendiente: { color: '#FFA500', emoji: '⏳', texto: 'Pendiente' },
      cocinando: { color: '#1E90FF', emoji: '🍳', texto: 'Cocinando' },
      preparado: { color: '#32CD32', emoji: '✅', texto: 'Listo' },
      entregado: { color: '#808080', emoji: '✓', texto: 'Entregado' }
    };
    return info[estado] || info.pendiente;
  };

  const calcularTiempoTotal = (orden) => {
    if (!orden.timestamps.entregada || !orden.timestamps.creada) return null;
    
    const inicio = orden.timestamps.creada.toMillis();
    const fin = orden.timestamps.entregada.toMillis();
    const minutos = Math.floor((fin - inicio) / 60000);
    
    return `${minutos} min`;
  };

  const renderOrden = ({ item }) => {
    const estadoInfo = getEstadoInfo(item.estado);
    const tiempoTotal = calcularTiempoTotal(item);

    return (
      <View style={styles.ordenCard}>
        <View style={styles.ordenHeader}>
          <View style={styles.ordenHeaderLeft}>
            <Text style={styles.numeroOrden}>Orden #{item.numeroOrden}</Text>
            <Text style={styles.mesaText}>Mesa {item.mesaNumero}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.color }]}>
            <Text style={styles.estadoEmoji}>{estadoInfo.emoji}</Text>
            <Text style={styles.estadoText}>{estadoInfo.texto}</Text>
          </View>
        </View>

        <View style={styles.fechaContainer}>
          <Text style={styles.fechaLabel}>Creada:</Text>
          <Text style={styles.fechaText}>
            {formatearFecha(item.timestamps.creada)}
          </Text>
        </View>

        {item.estado === 'entregado' && tiempoTotal && (
          <View style={styles.tiempoContainer}>
            <Text style={styles.tiempoLabel}>Tiempo total:</Text>
            <Text style={styles.tiempoText}>{tiempoTotal}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.itemsTitle}>Productos:</Text>
        {item.items.map((producto, index) => (
          <View key={index} style={styles.productoItem}>
            <Text style={styles.productoNombre}>
              {producto.cantidad}x {producto.nombre}
            </Text>
            <Text style={styles.productoPrecio}>
              ${(producto.precio * producto.cantidad).toFixed(2)}
            </Text>
          </View>
        ))}

        {item.notas && (
          <View style={styles.notasContainer}>
            <Text style={styles.notasLabel}>Notas:</Text>
            <Text style={styles.notasText}>{item.notas}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.totalMonto}>${item.subtotal.toFixed(2)}</Text>
        </View>

        {/* Timeline de estados */}
        <View style={styles.timeline}>
          <TimelineItem
            completado={true}
            texto="Creada"
            hora={formatearFecha(item.timestamps.creada)}
          />
          <TimelineItem
            completado={item.timestamps.cocinando !== null}
            texto="Cocinando"
            hora={item.timestamps.cocinando ? formatearFecha(item.timestamps.cocinando) : null}
          />
          <TimelineItem
            completado={item.timestamps.preparada !== null}
            texto="Preparada"
            hora={item.timestamps.preparada ? formatearFecha(item.timestamps.preparada) : null}
          />
          <TimelineItem
            completado={item.timestamps.entregada !== null}
            texto="Entregada"
            hora={item.timestamps.entregada ? formatearFecha(item.timestamps.entregada) : null}
            ultimo={true}
          />
        </View>
      </View>
    );
  };

  const TimelineItem = ({ completado, texto, hora, ultimo }) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View style={[
          styles.timelineDot,
          completado && styles.timelineDotCompletado
        ]} />
        {!ultimo && (
          <View style={[
            styles.timelineLine,
            completado && styles.timelineLineCompletada
          ]} />
        )}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[
          styles.timelineTexto,
          completado && styles.timelineTextoCompletado
        ]}>
          {texto}
        </Text>
        {hora && (
          <Text style={styles.timelineHora}>{hora}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'todas' && styles.filtroButtonActive]}
          onPress={() => setFiltro('todas')}
        >
          <Text style={[styles.filtroText, filtro === 'todas' && styles.filtroTextActive]}>
            Todas ({ordenes.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'activas' && styles.filtroButtonActive]}
          onPress={() => setFiltro('activas')}
        >
          <Text style={[styles.filtroText, filtro === 'activas' && styles.filtroTextActive]}>
            Activas ({ordenes.filter(o => o.estado !== 'entregado').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'completadas' && styles.filtroButtonActive]}
          onPress={() => setFiltro('completadas')}
        >
          <Text style={[styles.filtroText, filtro === 'completadas' && styles.filtroTextActive]}>
            Completadas ({ordenes.filter(o => o.estado === 'entregado').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de órdenes */}
      <FlatList
        data={ordenesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderOrden}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>
              {filtro === 'todas' ? 'No hay órdenes registradas' : `No hay órdenes ${filtro}`}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  filtrosContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  filtroButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center'
  },
  filtroButtonActive: {
    backgroundColor: '#007AFF'
  },
  filtroText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666'
  },
  filtroTextActive: {
    color: '#fff'
  },
  listContainer: {
    padding: 15
  },
  ordenCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
    alignItems: 'flex-start',
    marginBottom: 12
  },
  ordenHeaderLeft: {
    flex: 1
  },
  numeroOrden: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  mesaText: {
    fontSize: 16,
    color: '#666'
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  estadoEmoji: {
    fontSize: 14,
    marginRight: 4
  },
  estadoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  fechaContainer: {
    flexDirection: 'row',
    marginBottom: 8
  },
  fechaLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8
  },
  fechaText: {
    fontSize: 13,
    color: '#333'
  },
  tiempoContainer: {
    flexDirection: 'row',
    marginBottom: 8
  },
  tiempoLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8
  },
  tiempoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#32CD32'
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  productoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  productoNombre: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  productoPrecio: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF'
  },
  notasContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#FFF9E6',
    borderRadius: 6
  },
  notasLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4
  },
  notasText: {
    fontSize: 13,
    color: '#333',
    fontStyle: 'italic'
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  totalMonto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  timeline: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8
  },
  timelineLeft: {
    width: 30,
    alignItems: 'center'
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
    borderWidth: 2,
    borderColor: '#fff'
  },
  timelineDotCompletado: {
    backgroundColor: '#32CD32'
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#ddd',
    marginTop: 4
  },
  timelineLineCompletada: {
    backgroundColor: '#32CD32'
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 10
  },
  timelineTexto: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500'
  },
  timelineTextoCompletado: {
    color: '#333',
    fontWeight: '600'
  },
  timelineHora: {
    fontSize: 11,
    color: '#999',
    marginTop: 2
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center'
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center'
  }
});

export default MisOrdenesScreen;