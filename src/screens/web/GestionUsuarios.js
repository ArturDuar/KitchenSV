// src/screens/web/GestionUsuarios.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const GestionUsuariosScreen = () => {
  const { user, userData } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [filtroRol, setFiltroRol] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('mesero');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'usuarios'));
      const usuariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    }
  };

  const abrirModal = (usuario = null) => {
    if (usuario) {
      setEditando(true);
      setUsuarioActual(usuario);
      setNombre(usuario.nombre);
      setEmail(usuario.email);
      setRol(usuario.rol);
      setPassword('');
    } else {
      setEditando(false);
      setUsuarioActual(null);
      setNombre('');
      setEmail('');
      setPassword('');
      setRol('mesero');
    }
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditando(false);
    setUsuarioActual(null);
    setNombre('');
    setEmail('');
    setPassword('');
    setRol('mesero');
  };

  const crearUsuario = async () => {
  // Validaciones
  if (!nombre.trim() || !email.trim() || !password.trim()) {
    Alert.alert('Error', 'Todos los campos son obligatorios');
    return;
  }

  setLoading(true);

  try {
    // Verificar si ya existe un usuario con ese correo en Firestore
    const usuariosRef = collection(db, 'usuarios');
    const snapshot = await getDocs(usuariosRef);
    const existeEmail = snapshot.docs.some(
      (doc) => doc.data().email.toLowerCase() === email.trim().toLowerCase()
    );

    if (existeEmail) {
      Alert.alert('Error', 'El correo electrónico ya está registrado');
      setLoading(false);
      return;
    }

    // Crear documento en Firestore
    await addDoc(collection(db, 'usuarios'), {
      nombre: nombre.trim(),
      email: email.trim(),
      rol: rol,
      activo: true,
      fechaCreacion: new Date(),
      creadoPor: user?.uid || null,
      // puedes almacenar la contraseña encriptada si quieres
      // pero NO se recomienda guardar texto plano
      password: password.trim(), // ⚠️ Solo si realmente lo necesitas
    });

    Alert.alert('Éxito', 'Usuario creado correctamente');
    cargarUsuarios();
    cerrarModal();
  } catch (error) {
    console.error('Error al crear usuario:', error);
    Alert.alert('Error', 'No se pudo crear el usuario');
  } finally {
    setLoading(false);
  }
};


  const actualizarUsuario = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setLoading(true);

    try {
      await updateDoc(doc(db, 'usuarios', usuarioActual.id), {
        nombre: nombre.trim(),
        rol: rol
      });

      Alert.alert('Éxito', 'Usuario actualizado correctamente');
      cargarUsuarios();
      cerrarModal();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      Alert.alert('Error', 'No se pudo actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivarUsuario = async (usuario) => {
    try {
      await updateDoc(doc(db, 'usuarios', usuario.id), {
        activo: !usuario.activo
      });
      cargarUsuarios();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado del usuario');
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchRol = filtroRol === 'todos' || usuario.rol === filtroRol;
    const matchBusqueda = usuario.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          usuario.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRol && matchBusqueda;
  });

  const getRolColor = (rol) => {
    const colores = {
      admin: '#FF3B30',
      cocinero: '#FF9500',
      mesero: '#007AFF'
    };
    return colores[rol] || '#666';
  };

  const getRolIcon = (rol) => {
    const iconos = {
      admin: '👨‍💼',
      cocinero: '👨‍🍳',
      mesero: '🧑‍🍳'
    };
    return iconos[rol] || '👤';
  };

  const conteoRoles = {
    total: usuarios.length,
    admin: usuarios.filter(u => u.rol === 'admin').length,
    cocinero: usuarios.filter(u => u.rol === 'cocinero').length,
    mesero: usuarios.filter(u => u.rol === 'mesero').length
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
          <Text style={styles.headerSubtitle}>
            Total: {usuarios.length} usuarios
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => abrirModal()}
        >
          <Text style={styles.addButtonText}>+ Nuevo Usuario</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{conteoRoles.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FF3B30' }]}>{conteoRoles.admin}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FF9500' }]}>{conteoRoles.cocinero}</Text>
          <Text style={styles.statLabel}>Cocineros</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#007AFF' }]}>{conteoRoles.mesero}</Text>
          <Text style={styles.statLabel}>Meseros</Text>
        </View>
      </View>

      {/* Filtros y búsqueda */}
      <View style={styles.filtrosContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filtrosRol}>
          {['todos', 'admin', 'cocinero', 'mesero'].map(r => (
            <TouchableOpacity
              key={r}
              style={[
                styles.filtroChip,
                filtroRol === r && styles.filtroChipActive
              ]}
              onPress={() => setFiltroRol(r)}
            >
              <Text style={[
                styles.filtroText,
                filtroRol === r && styles.filtroTextActive
              ]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Lista de usuarios */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {usuariosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No hay usuarios para mostrar</Text>
          </View>
        ) : (
          usuariosFiltrados.map(usuario => (
            <View key={usuario.id} style={styles.usuarioCard}>
              <View style={styles.usuarioHeader}>
                <View style={styles.usuarioInfo}>
                  <Text style={styles.usuarioIcon}>{getRolIcon(usuario.rol)}</Text>
                  <View style={styles.usuarioTextos}>
                    <Text style={styles.usuarioNombre}>{usuario.nombre}</Text>
                    <Text style={styles.usuarioEmail}>{usuario.email}</Text>
                  </View>
                </View>
                
                <View style={styles.usuarioAcciones}>
                  <View style={[styles.rolBadge, { backgroundColor: getRolColor(usuario.rol) }]}>
                    <Text style={styles.rolText}>{usuario.rol.toUpperCase()}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.estadoButton,
                      usuario.activo ? styles.estadoActivo : styles.estadoInactivo
                    ]}
                    onPress={() => toggleActivarUsuario(usuario)}
                  >
                    <Text style={styles.estadoText}>
                      {usuario.activo ? '✓ Activo' : '✗ Inactivo'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => abrirModal(usuario)}
                  >
                    <Text style={styles.editButtonText}>✏️ Editar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {usuario.fechaCreacion && (
                <Text style={styles.fechaCreacion}>
                  Creado: {usuario.fechaCreacion.toDate().toLocaleDateString('es-ES')}
                </Text>
              )}
            </View>
          ))
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={nombre}
              onChangeText={setNombre}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!editando && !loading}
            />

            {!editando && (
              <TextInput
                style={styles.input}
                placeholder="Contraseña (min. 6 caracteres)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            )}

            <Text style={styles.inputLabel}>Rol:</Text>
            <View style={styles.rolSelector}>
              {['mesero', 'cocinero', 'admin'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.rolOption,
                    rol === r && styles.rolOptionActive,
                    { borderColor: getRolColor(r) }
                  ]}
                  onPress={() => setRol(r)}
                  disabled={loading}
                >
                  <Text style={styles.rolOptionIcon}>{getRolIcon(r)}</Text>
                  <Text style={[
                    styles.rolOptionText,
                    rol === r && { color: getRolColor(r), fontWeight: 'bold' }
                  ]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {editando && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  ℹ️ No se puede cambiar el email ni la contraseña desde aquí
                </Text>
              </View>
            )}

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
                onPress={editando ? actualizarUsuario : crearUsuario}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear Usuario')}
                </Text>
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
    fontSize: 13,
    color: '#666',
    marginTop: 4
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
  filtrosRol: {
    flexDirection: 'row',
    gap: 10
  },
  filtroChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0'
  },
  filtroChipActive: {
    backgroundColor: '#007AFF'
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
  usuarioCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3
  },
  usuarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  usuarioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  usuarioIcon: {
    fontSize: 40,
    marginRight: 15
  },
  usuarioTextos: {
    flex: 1
  },
  usuarioNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  usuarioEmail: {
    fontSize: 14,
    color: '#666'
  },
  usuarioAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  rolBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  rolText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  estadoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  estadoActivo: {
    backgroundColor: '#E8F5E9'
  },
  estadoInactivo: {
    backgroundColor: '#FFEBEE'
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600'
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 8
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF'
  },
  fechaCreacion: {
    fontSize: 12,
    color: '#999',
    marginTop: 8
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
    color: '#999'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 500
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 15
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 5
  },
  rolSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20
  },
  rolOption: {
    flex: 1,
    padding: 15,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f8f8f8'
  },
  rolOptionActive: {
    backgroundColor: '#fff'
  },
  rolOptionIcon: {
    fontSize: 30,
    marginBottom: 5
  },
  rolOptionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500'
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2'
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

export default GestionUsuariosScreen;