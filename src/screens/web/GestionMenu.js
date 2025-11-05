import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const GestionMenuScreen = () => {
  const { user, userData } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [itemActual, setItemActual] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('Entradas');
  const [disponible, setDisponible] = useState(true);
  const [loading, setLoading] = useState(false);

  const categorias = ['Entradas', 'Platos Fuertes', 'Postres', 'Bebidas', 'Extras'];

  useEffect(() => {
    cargarMenu();
  }, []);

  const cargarMenu = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'menu'));
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(items);
    } catch (error) {
      console.error('Error al cargar menú:', error);
      if (Platform.OS !== 'web') Alert.alert('Error', 'No se pudo cargar el menú');
      else alert('Error: No se pudo cargar el menú');
    }
  };

  const abrirModal = (item = null) => {
    if (item) {
      setEditando(true);
      setItemActual(item);
      setNombre(item.nombre);
      setDescripcion(item.descripcion || '');
      setPrecio(item.precio.toString());
      setCategoria(item.categoria);
      setDisponible(item.disponible);
    } else {
      setEditando(false);
      setItemActual(null);
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setCategoria('Entradas');
      setDisponible(true);
    }
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditando(false);
    setItemActual(null);
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setCategoria('Entradas');
    setDisponible(true);
  };

  const crearItem = async () => {
    if (!nombre.trim() || !precio.trim()) {
      Platform.OS === 'web'
        ? alert('El nombre y el precio son obligatorios')
        : Alert.alert('Error', 'El nombre y el precio son obligatorios');
      return;
    }

    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      Platform.OS === 'web'
        ? alert('El precio debe ser un número válido mayor a 0')
        : Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'menu'), {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: precioNum,
        categoria: categoria,
        disponible: disponible,
        fechaCreacion: new Date(),
        creadoPor: user?.uid || userData?.id
      });

      Platform.OS === 'web'
        ? alert('✅ Producto agregado al menú')
        : Alert.alert('Éxito', 'Producto agregado al menú');

      cargarMenu();
      cerrarModal();
    } catch (error) {
      console.error('Error al crear producto:', error);
      Platform.OS === 'web'
        ? alert('❌ No se pudo agregar el producto')
        : Alert.alert('Error', 'No se pudo agregar el producto');
    } finally {
      setLoading(false);
    }
  };

  const actualizarItem = async () => {
    if (!nombre.trim() || !precio.trim()) {
      Platform.OS === 'web'
        ? alert('El nombre y precio son obligatorios')
        : Alert.alert('Error', 'El nombre y precio son obligatorios');
      return;
    }

    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      Platform.OS === 'web'
        ? alert('El precio debe ser un número válido mayor a 0')
        : Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    setLoading(true);

    try {
      await updateDoc(doc(db, 'menu', itemActual.id), {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: precioNum,
        categoria: categoria,
        disponible: disponible,
        fechaModificacion: new Date(),
        modificadoPor: user?.uid || userData?.id
      });

      Platform.OS === 'web'
        ? alert('✅ Producto actualizado')
        : Alert.alert('Éxito', 'Producto actualizado');

      cargarMenu();
      cerrarModal();
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      Platform.OS === 'web'
        ? alert('❌ No se pudo actualizar el producto')
        : Alert.alert('Error', 'No se pudo actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  const toggleDisponibilidad = async (item) => {
    try {
      await updateDoc(doc(db, 'menu', item.id), {
        disponible: !item.disponible,
        fechaModificacion: new Date()
      });
      cargarMenu();
    } catch (error) {
      console.error('Error al cambiar disponibilidad:', error);
      Platform.OS === 'web'
        ? alert('❌ No se pudo cambiar la disponibilidad')
        : Alert.alert('Error', 'No se pudo cambiar la disponibilidad');
    }
  };

  const eliminarItem = async (item) => {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm(`¿Estás seguro de eliminar "${item.nombre}"?`);
      if (!confirmar) return;

      try {
        await deleteDoc(doc(db, 'menu', item.id));
        window.alert('✅ Producto eliminado');
        cargarMenu();
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        window.alert('❌ No se pudo eliminar el producto');
      }
      return;
    }

    // Móvil
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar "${item.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'menu', item.id));
              Alert.alert('Éxito', 'Producto eliminado');
              cargarMenu();
            } catch (error) {
              console.error('Error al eliminar producto:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  const itemsFiltrados = menuItems.filter(item => {
    const matchCategoria = filtroCategoria === 'todas' || item.categoria === filtroCategoria;
    const matchBusqueda = item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.descripcion || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  const getCategoriaColor = (cat) => {
    const colores = {
      'Entradas': '#FF9500',
      'Platos Fuertes': '#FF3B30',
      'Postres': '#FF2D55',
      'Bebidas': '#007AFF',
      'Extras': '#32CD32'
    };
    return colores[cat] || '#666';
  };

  const getCategoriaIcon = (cat) => {
    const iconos = {
      'Entradas': '🥗',
      'Platos Fuertes': '🍽️',
      'Postres': '🍰',
      'Bebidas': '🥤',
      'Extras': '🍟'
    };
    return iconos[cat] || '🍴';
  };

  const conteoCategoria = (cat) => {
    return menuItems.filter(item => item.categoria === cat).length;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Gestión del Menú</Text>
          <Text style={styles.headerSubtitle}>
            Total: {menuItems.length} productos
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => abrirModal()}
        >
          <Text style={styles.addButtonText}>+ Nuevo Producto</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        {categorias.map(cat => (
          <View key={cat} style={styles.statCard}>
            <Text style={styles.statIcon}>{getCategoriaIcon(cat)}</Text>
            <Text style={[styles.statNumber, { color: getCategoriaColor(cat) }]}>
              {conteoCategoria(cat)}
            </Text>
            <Text style={styles.statLabel}>{cat}</Text>
          </View>
        ))}
      </View>

      {/* Filtros y búsqueda */}
      <View style={styles.filtrosContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosCategoria}>
          <TouchableOpacity
            style={[
              styles.filtroChip,
              filtroCategoria === 'todas' && styles.filtroChipActive
            ]}
            onPress={() => setFiltroCategoria('todas')}
          >
            <Text style={[
              styles.filtroText,
              filtroCategoria === 'todas' && styles.filtroTextActive
            ]}>
              Todas ({menuItems.length})
            </Text>
          </TouchableOpacity>

          {categorias.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filtroChip,
                filtroCategoria === cat && styles.filtroChipActive,
                { borderColor: getCategoriaColor(cat) }
              ]}
              onPress={() => setFiltroCategoria(cat)}
            >
              <Text style={styles.filtroIcon}>{getCategoriaIcon(cat)}</Text>
              <Text style={[
                styles.filtroText,
                filtroCategoria === cat && styles.filtroTextActive
              ]}>
                {cat} ({conteoCategoria(cat)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de productos */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {itemsFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>No hay productos para mostrar</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {itemsFiltrados.map(item => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemHeaderLeft}>
                    <Text style={styles.itemIcon}>{getCategoriaIcon(item.categoria)}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemNombre}>{item.nombre}</Text>
                      <Text style={styles.itemDescripcion} numberOfLines={2}>
                        {item.descripcion || 'Sin descripción'}
                      </Text>
                    </View>
                  </View>

                  <View style={[
                    styles.categoriaBadge,
                    { backgroundColor: getCategoriaColor(item.categoria) }
                  ]}>
                    <Text style={styles.categoriaText}>{item.categoria}</Text>
                  </View>
                </View>

                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrecio}>${item.precio.toFixed(2)}</Text>

                  <View style={styles.itemAcciones}>
                    <TouchableOpacity
                      style={[
                        styles.disponibleButton,
                        item.disponible ? styles.disponibleActivo : styles.disponibleInactivo
                      ]}
                      onPress={() => toggleDisponibilidad(item)}
                    >
                      <Text style={styles.disponibleText}>
                        {item.disponible ? '✓ Disponible' : '✗ No disponible'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => abrirModal(item)}
                    >
                      <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => eliminarItem(item)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal para crear/editar */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editando ? 'Editar Producto' : 'Nuevo Producto'}
              </Text>

              <Text style={styles.inputLabel}>Nombre del producto:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Hamburguesa Clásica"
                value={nombre}
                onChangeText={setNombre}
                editable={!loading}
              />

              <Text style={styles.inputLabel}>Descripción:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción detallada del producto..."
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
                editable={!loading}
              />

              <Text style={styles.inputLabel}>Precio ($):</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="decimal-pad"
                editable={!loading}
              />

              <Text style={styles.inputLabel}>Categoría:</Text>
              <View style={styles.categoriaSelector}>
                {categorias.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoriaOption,
                      categoria === cat && styles.categoriaOptionActive,
                      { borderColor: getCategoriaColor(cat) }
                    ]}
                    onPress={() => setCategoria(cat)}
                    disabled={loading}
                  >
                    <Text style={styles.categoriaOptionIcon}>{getCategoriaIcon(cat)}</Text>
                    <Text style={[
                      styles.categoriaOptionText,
                      categoria === cat && {
                        color: getCategoriaColor(cat),
                        fontWeight: 'bold'
                      }
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.disponibleContainer}>
                <Text style={styles.inputLabel}>Estado:</Text>
                <TouchableOpacity
                  style={[
                    styles.disponibleToggle,
                    disponible ? styles.disponibleToggleActivo : styles.disponibleToggleInactivo
                  ]}
                  onPress={() => setDisponible(!disponible)}
                  disabled={loading}
                >
                  <Text style={styles.disponibleToggleText}>
                    {disponible ? '✓ Disponible' : '✗ No disponible'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cerrarModal}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, loading && styles.buttonDisabled]}
                  onPress={editando ? actualizarItem : crearItem}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear Producto')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 10,
    flexWrap: 'wrap'
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 10
  },
  statIcon: {
    fontSize: 30,
    marginBottom: 5
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  },
  filtrosContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12
  },
  filtrosCategoria: {
    flexDirection: 'row'
  },
  filtroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  filtroChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  filtroIcon: {
    fontSize: 16,
    marginRight: 6
  },
  filtroText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  filtroTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  listContainer: {
    padding: 15
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    flex: 1
  },
  itemIcon: {
    fontSize: 40,
    marginRight: 12
  },
  itemInfo: {
    flex: 1
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  itemDescripcion: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18
  },
  categoriaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    height: 24
  },
  categoriaText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  itemPrecio: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  itemAcciones: {
    flexDirection: 'row',
    gap: 8
  },
  disponibleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12
  },
  disponibleActivo: {
    backgroundColor: '#E8F5E9'
  },
  disponibleInactivo: {
    backgroundColor: '#FFEBEE'
  },
  disponibleText: {
    fontSize: 11,
    fontWeight: '600'
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  editButtonText: {
    fontSize: 16
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteButtonText: {
    fontSize: 16
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    width: '100%'
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15
  },
  emptyText: {
    fontSize: 16,
    color: '#999'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center'
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center'
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 5
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 15
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  categoriaSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15
  },
  categoriaOption: {
    flex: 1,
    minWidth: 120,
    padding: 12,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f8f8f8'
  },
  categoriaOptionActive: {
    backgroundColor: '#fff'
  },
  categoriaOptionIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  categoriaOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center'
  },
  disponibleContainer: {
    marginBottom: 20
  },
  disponibleToggle: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8
  },
  disponibleToggleActivo: {
    backgroundColor: '#E8F5E9'
  },
  disponibleToggleInactivo: {
    backgroundColor: '#FFEBEE'
  },
  disponibleToggleText: {
    fontSize: 16,
    fontWeight: '600'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f0f0f0'
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  saveButton: {
    backgroundColor: '#007AFF'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  }
});

export default GestionMenuScreen;