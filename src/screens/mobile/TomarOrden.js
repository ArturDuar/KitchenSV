// src/screens/mobile/TomarOrden.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Modal
} from 'react-native';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const TomarOrdenScreen = ({ navigation }) => {
  const { user, userData } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mesaNumero, setMesaNumero] = useState('');
  const [notasOrden, setNotasOrden] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('Todos');
  const [modalNotas, setModalNotas] = useState(false);
  const [itemNotasTemp, setItemNotasTemp] = useState(null);

  useEffect(() => {
    cargarMenu();
  }, []);

  const cargarMenu = async () => {
    try {
      const q = query(collection(db, 'menu'), where('disponible', '==', true));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(items);
    } catch (error) {
      console.error('Error al cargar menú:', error);
      Alert.alert('Error', 'No se pudo cargar el menú');
    }
  };

  const categorias = ['Todos', ...new Set(menuItems.map(item => item.categoria))];

  const itemsFiltrados = menuItems.filter(item => {
    const matchCategoria = selectedCategoria === 'Todos' || item.categoria === selectedCategoria;
    const matchBusqueda = item.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  const agregarAlCarrito = (item) => {
    const existente = carrito.find(c => c.id === item.id);
    if (existente) {
      setCarrito(carrito.map(c =>
        c.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c
      ));
    } else {
      setCarrito([...carrito, { ...item, cantidad: 1, notas: '' }]);
    }
  };

  const modificarCantidad = (itemId, cambio) => {
    setCarrito(carrito.map(item => {
      if (item.id === itemId) {
        const nuevaCantidad = item.cantidad + cambio;
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const eliminarDelCarrito = (itemId) => {
    setCarrito(carrito.filter(item => item.id !== itemId));
  };

  const abrirNotasItem = (item) => {
    setItemNotasTemp(item);
    setModalNotas(true);
  };

  const guardarNotasItem = (notas) => {
    setCarrito(carrito.map(item =>
      item.id === itemNotasTemp.id ? { ...item, notas } : item
    ));
    setModalNotas(false);
    setItemNotasTemp(null);
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  const generarNumeroOrden = async () => {
    // Obtener el último número de orden
    const ordenesRef = collection(db, 'ordenes');
    const snapshot = await getDocs(ordenesRef);

    if (snapshot.empty) return 1001;

    const numeros = snapshot.docs.map(doc => doc.data().numeroOrden || 0);
    return Math.max(...numeros) + 1;
  };

  const crearOrden = async () => {
    if (!mesaNumero.trim()) {
      Alert.alert('Error', 'Por favor ingresa el número de mesa');
      return;
    }

    if (carrito.length === 0) {
      Alert.alert('Error', 'Agrega al menos un producto a la orden');
      return;
    }

    setLoading(true);

    try {
      const numeroOrden = await generarNumeroOrden();

      const nuevaOrden = {
        numeroOrden,
        mesaNumero: mesaNumero.trim(),
        items: carrito.map(item => ({
          menuItemId: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
          notas: item.notas || ''
        })),
        subtotal: calcularTotal(),
        estado: 'pendiente',
        mesero: {
          uid: userData.uid || userData.id,
          nombre: userData.nombre,
          rol: userData.rol || 'mesero'
        },
        cocinero: {
          uid: null,
          nombre: null,
          rol: null
        },
        timestamps: {
          creada: new Date(),
          cocinando: null,
          preparada: null,
          entregada: null
        },
        notas: notasOrden.trim()
      };


      await addDoc(collection(db, 'ordenes'), nuevaOrden);

      Alert.alert(
        'Éxito',
        `Orden #${numeroOrden} creada correctamente`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error al crear orden:', error);
      Alert.alert('Error', 'No se pudo crear la orden. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderMenuItem = ({ item }) => {
    const enCarrito = carrito.find(c => c.id === item.id);

    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => agregarAlCarrito(item)}
      >
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemNombre}>{item.nombre}</Text>
          <Text style={styles.menuItemDescripcion} numberOfLines={2}>
            {item.descripcion}
          </Text>
          <Text style={styles.menuItemPrecio}>${item.precio.toFixed(2)}</Text>
        </View>
        {enCarrito && (
          <View style={styles.cantidadBadge}>
            <Text style={styles.cantidadText}>{enCarrito.cantidad}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCarritoItem = ({ item }) => (
    <View style={styles.carritoItem}>
      <View style={styles.carritoItemInfo}>
        <Text style={styles.carritoItemNombre}>{item.nombre}</Text>
        {item.notas && (
          <Text style={styles.carritoItemNotas}>Notas: {item.notas}</Text>
        )}
        <Text style={styles.carritoItemPrecio}>
          ${(item.precio * item.cantidad).toFixed(2)}
        </Text>
      </View>

      <View style={styles.carritoControles}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => modificarCantidad(item.id, -1)}
        >
          <Text style={styles.controlButtonText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.cantidad}>{item.cantidad}</Text>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => modificarCantidad(item.id, 1)}
        >
          <Text style={styles.controlButtonText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notasButton}
          onPress={() => abrirNotasItem(item)}
        >
          <Text style={styles.notasButtonText}>📝</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => eliminarDelCarrito(item.id)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header con Mesa */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nueva Orden</Text>
        <TextInput
          style={styles.mesaInput}
          placeholder="N° Mesa"
          value={mesaNumero}
          onChangeText={setMesaNumero}
          keyboardType="numeric"
        />
      </View>

      {/* Búsqueda y Categorías */}
      <View style={styles.filtrosContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorias}>
          {categorias.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoriaChip,
                selectedCategoria === cat && styles.categoriaChipActive
              ]}
              onPress={() => setSelectedCategoria(cat)}
            >
              <Text
                style={[
                  styles.categoriaText,
                  selectedCategoria === cat && styles.categoriaTextActive
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Menú */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Menú Disponible</Text>
        <FlatList
          data={itemsFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderMenuItem}
          contentContainerStyle={styles.menuList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay productos disponibles</Text>
          }
        />
      </View>

      {/* Carrito */}
      {carrito.length > 0 && (
        <View style={styles.carritoContainer}>
          <View style={styles.carritoHeader}>
            <Text style={styles.carritoTitle}>Carrito ({carrito.length})</Text>
            <Text style={styles.carritoTotal}>Total: ${calcularTotal().toFixed(2)}</Text>
          </View>

          <FlatList
            data={carrito}
            keyExtractor={(item) => item.id}
            renderItem={renderCarritoItem}
            style={styles.carritoList}
          />

          <TextInput
            style={styles.notasInput}
            placeholder="Notas generales de la orden..."
            value={notasOrden}
            onChangeText={setNotasOrden}
            multiline
          />

          <TouchableOpacity
            style={[styles.crearOrdenButton, loading && styles.buttonDisabled]}
            onPress={crearOrden}
            disabled={loading}
          >
            <Text style={styles.crearOrdenText}>
              {loading ? 'Creando...' : 'Crear Orden'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal para notas de item */}
      <Modal
        visible={modalNotas}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalNotas(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Notas para {itemNotasTemp?.nombre}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Sin cebolla, término medio..."
              defaultValue={itemNotasTemp?.notas}
              onChangeText={(text) => {
                if (itemNotasTemp) {
                  setItemNotasTemp({ ...itemNotasTemp, notas: text });
                }
              }}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalNotas(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={() => guardarNotasItem(itemNotasTemp?.notas || '')}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  mesaInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    width: 100,
    textAlign: 'center',
    fontSize: 16
  },
  filtrosContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10
  },
  categorias: {
    flexDirection: 'row'
  },
  categoriaChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8
  },
  categoriaChipActive: {
    backgroundColor: '#007AFF'
  },
  categoriaText: {
    fontSize: 14,
    color: '#333'
  },
  categoriaTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  menuContainer: {
    flex: 1,
    padding: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  menuList: {
    paddingBottom: 10
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  menuItemInfo: {
    flex: 1
  },
  menuItemNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  menuItemDescripcion: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4
  },
  menuItemPrecio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  cantidadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cantidadText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  carritoContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
    maxHeight: '50%'
  },
  carritoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  carritoTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  carritoTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  carritoList: {
    maxHeight: 200
  },
  carritoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  carritoItemInfo: {
    flex: 1
  },
  carritoItemNombre: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4
  },
  carritoItemNotas: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4
  },
  carritoItemPrecio: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600'
  },
  carritoControles: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  cantidad: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8
  },
  notasButton: {
    padding: 8,
    marginLeft: 4
  },
  notasButtonText: {
    fontSize: 18
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4
  },
  deleteButtonText: {
    fontSize: 18
  },
  notasInput: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 15,
    minHeight: 50
  },
  crearOrdenButton: {
    backgroundColor: '#32CD32',
    padding: 18,
    alignItems: 'center',
    margin: 15,
    borderRadius: 10
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  crearOrdenText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 15
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0'
  },
  modalButtonSave: {
    backgroundColor: '#007AFF'
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600'
  }
});

export default TomarOrdenScreen;