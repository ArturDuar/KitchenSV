// src/screens/web/Historial.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions
} from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const HistorialScreen = () => {
  const { user, userData } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [ordenesOriginales, setOrdenesOriginales] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroMesero, setFiltroMesero] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [meseros, setMeseros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtroEstado, filtroMesero, searchQuery, fechaInicio, fechaFin, ordenesOriginales]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar todas las órdenes
      const ordenesSnapshot = await getDocs(
        query(collection(db, 'ordenes'), orderBy('timestamps.creada', 'desc'))
      );
      const ordenesData = ordenesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setOrdenesOriginales(ordenesData);
      setOrdenes(ordenesData);

      // Cargar lista de meseros
      const meserosSnapshot = await getDocs(
        query(collection(db, 'usuarios'), where('rol', '==', 'mesero'))
      );
      const meserosData = meserosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMeseros(meserosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...ordenesOriginales];

    // Filtro por estado
    if (filtroEstado !== 'todas') {
      resultado = resultado.filter(orden => orden.estado === filtroEstado);
    }

    // Filtro por mesero
    if (filtroMesero !== 'todos') {
      resultado = resultado.filter(orden => orden.mesero?.uid === filtroMesero);
    }

    // Búsqueda por número de orden o mesa
    if (searchQuery.trim()) {
      resultado = resultado.filter(orden =>
        orden.numeroOrden?.toString().includes(searchQuery) ||
        orden.mesaNumero?.toString().includes(searchQuery)
      );
    }

    // Filtro por rango de fechas
    if (fechaInicio) {
      const inicio = new Date(fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      resultado = resultado.filter(orden => {
        const fechaOrden = orden.timestamps.creada?.toDate();
        return fechaOrden >= inicio;
      });
    }

    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
      resultado = resultado.filter(orden => {
        const fechaOrden = orden.timestamps.creada?.toDate();
        return fechaOrden <= fin;
      });
    }

    setOrdenes(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todas');
    setFiltroMesero('todos');
    setSearchQuery('');
    setFechaInicio('');
    setFechaFin('');
  };

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

  const calcularTiempoTotal = (orden) => {
    if (!orden.timestamps.entregada || !orden.timestamps.creada) return null;
    
    const inicio = orden.timestamps.creada.toMillis();
    const fin = orden.timestamps.entregada.toMillis();
    const minutos = Math.floor((fin - inicio) / 60000);
    
    return minutos;
  };

  const calcularEstadisticas = () => {
    const entregadas = ordenes.filter(o => o.estado === 'entregado');
    const tiemposTotales = entregadas
      .map(o => calcularTiempoTotal(o))
      .filter(t => t !== null);

    const tiempoPromedio = tiemposTotales.length > 0
      ? Math.round(tiemposTotales.reduce((a, b) => a + b, 0) / tiemposTotales.length)
      : 0;

    const totalVentas = ordenes.reduce((sum, orden) => sum + (orden.subtotal || 0), 0);

    return {
      totalOrdenes: ordenes.length,
      ordenesEntregadas: entregadas.length,
      tiempoPromedio,
      totalVentas
    };
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

  const stats = calcularEstadisticas();

  const renderOrden = (orden) => {
    const estadoInfo = getEstadoInfo(orden.estado);
    const tiempoTotal = calcularTiempoTotal(orden);

    return (
      <View key={orden.id} style={styles.ordenCard}>
        <View style={styles.ordenHeader}>
          <View style={styles.ordenHeaderLeft}>
            <Text style={styles.numeroOrden}>#{orden.numeroOrden}</Text>
            <Text style={styles.mesaText}>Mesa {orden.mesaNumero}</Text>
          </View>
          
          <View style={styles.ordenHeaderRight}>
            <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.color }]}>
              <Text style={styles.estadoEmoji}>{estadoInfo.emoji}</Text>
              <Text style={styles.estadoText}>{estadoInfo.texto}</Text>
            </View>
          </View>
        </View>

        <View style={styles.ordenInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mesero:</Text>
            <Text style={styles.infoValue}>{orden.mesero?.nombre || 'N/A'}</Text>
          </View>
          
          {orden.cocinero?.nombre && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cocinero:</Text>
              <Text style={styles.infoValue}>{orden.cocinero.nombre}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Creada:</Text>
            <Text style={styles.infoValue}>{formatearFecha(orden.timestamps.creada)}</Text>
          </View>

          {orden.timestamps.entregada && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Entregada:</Text>
                <Text style={styles.infoValue}>{formatearFecha(orden.timestamps.entregada)}</Text>
              </View>
              
              {tiempoTotal !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tiempo total:</Text>
                  <Text style={[styles.infoValue, styles.tiempoValue]}>
                    {tiempoTotal} minutos
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Productos ({orden.items?.length || 0}):</Text>
          {orden.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemCantidad}>{item.cantidad}x</Text>
              <Text style={styles.itemNombre}>{item.nombre}</Text>
              <Text style={styles.itemPrecio}>${(item.precio * item.cantidad).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {orden.notas && (
          <View style={styles.notasSection}>
            <Text style={styles.notasLabel}>Notas:</Text>
            <Text style={styles.notasText}>{orden.notas}</Text>
          </View>
        )}

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.totalValue}>${orden.subtotal?.toFixed(2) || '0.00'}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Historial de Órdenes</Text>
          <Text style={styles.headerSubtitle}>
            {ordenes.length} órdenes encontradas
          </Text>
        </View>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalOrdenes}</Text>
          <Text style={styles.statLabel}>Total Órdenes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#32CD32' }]}>{stats.ordenesEntregadas}</Text>
          <Text style={styles.statLabel}>Entregadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#007AFF' }]}>{stats.tiempoPromedio}</Text>
          <Text style={styles.statLabel}>Tiempo Promedio (min)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FF9500' }]}>${stats.totalVentas.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Ventas Totales</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <View style={styles.filtrosRow}>
          <TextInput
            style={[styles.input, styles.searchInput]}
            placeholder="Buscar por # orden o mesa..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="Fecha inicio (YYYY-MM-DD)"
            value={fechaInicio}
            onChangeText={setFechaInicio}
          />

          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="Fecha fin (YYYY-MM-DD)"
            value={fechaFin}
            onChangeText={setFechaFin}
          />
        </View>

        <View style={styles.filtrosRow}>
          <View style={styles.selectContainer}>
            <Text style={styles.selectLabel}>Estado:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {['todas', 'pendiente', 'cocinando', 'preparado', 'entregado'].map(estado => (
                <TouchableOpacity
                  key={estado}
                  style={[
                    styles.filterChip,
                    filtroEstado === estado && styles.filterChipActive
                  ]}
                  onPress={() => setFiltroEstado(estado)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filtroEstado === estado && styles.filterChipTextActive
                  ]}>
                    {estado === 'todas' ? 'Todas' : getEstadoInfo(estado).texto}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.selectContainer}>
            <Text style={styles.selectLabel}>Mesero:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filtroMesero === 'todos' && styles.filterChipActive
                ]}
                onPress={() => setFiltroMesero('todos')}
              >
                <Text style={[
                  styles.filterChipText,
                  filtroMesero === 'todos' && styles.filterChipTextActive
                ]}>
                  Todos
                </Text>
              </TouchableOpacity>
              
              {meseros.map(mesero => (
                <TouchableOpacity
                  key={mesero.id}
                  style={[
                    styles.filterChip,
                    filtroMesero === mesero.id && styles.filterChipActive
                  ]}
                  onPress={() => setFiltroMesero(mesero.id)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filtroMesero === mesero.id && styles.filterChipTextActive
                  ]}>
                    {mesero.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.clearButton} onPress={limpiarFiltros}>
            <Text style={styles.clearButtonText}>Limpiar Filtros</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de órdenes */}
      <ScrollView contentContainerStyle={styles.ordenesContainer}>
        {ordenes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No se encontraron órdenes</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={limpiarFiltros}>
              <Text style={styles.emptyButtonText}>Limpiar filtros</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordenesGrid}>
            {ordenes.map(renderOrden)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    fontSize: 18,
    color: '#666'
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 15
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  },
  filtrosContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12
  },
  filtrosRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14
  },
  searchInput: {
    flex: 2,
    minWidth: 200
  },
  dateInput: {
    flex: 1,
    minWidth: 150
  },
  selectContainer: {
    flex: 1,
    minWidth: 250
  },
  selectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6
  },
  chipScroll: {
    flexDirection: 'row'
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8
  },
  filterChipActive: {
    backgroundColor: '#007AFF'
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500'
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 8
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  ordenesContainer: {
    padding: 15
  },
  ordenesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15
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
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3
  },
  ordenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  ordenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10
  },
  numeroOrden: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  mesaText: {
    fontSize: 16,
    color: '#666'
  },
  ordenHeaderRight: {
    alignItems: 'flex-end'
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
  ordenInfo: {
    marginBottom: 15
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500'
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600'
  },
  tiempoValue: {
    color: '#32CD32'
  },
  itemsSection: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  itemCantidad: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 40
  },
  itemNombre: {
    flex: 1,
    fontSize: 13,
    color: '#333'
  },
  itemPrecio: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF'
  },
  notasSection: {
    backgroundColor: '#FFF9E6',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
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
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#eee'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF'
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
    marginBottom: 20
  },
  emptyButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default HistorialScreen;