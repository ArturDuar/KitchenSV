// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // Usuario Firebase (solo admin)
  const [userData, setUserData] = useState(null); // Datos Firestore (admins, cocineros, meseros)
  const [loading, setLoading] = useState(true);

  // --- Helper persistencia según plataforma
  const storage = {
    async getItem(key) {
      if (Platform.OS === 'web') return localStorage.getItem(key);
      return await AsyncStorage.getItem(key);
    },
    async setItem(key, value) {
      if (Platform.OS === 'web') return localStorage.setItem(key, value);
      return await AsyncStorage.setItem(key, value);
    },
    async removeItem(key) {
      if (Platform.OS === 'web') return localStorage.removeItem(key);
      return await AsyncStorage.removeItem(key);
    }
  };

  // --- Restaurar sesión persistente (cocinero o mesero)
  useEffect(() => {
    (async () => {
      try {
        const saved = await storage.getItem('userData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.rol) {
            setUserData(parsed);
            console.log(`🔄 Sesión restaurada (${parsed.rol})`);
          }
        }
      } catch (e) {
        console.error('Error al restaurar sesión persistente:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---  Escuchar sesión de Firebase Auth (solo admins)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser(firebaseUser);
            setUserData(data);
            await storage.setItem('userData', JSON.stringify(data));
          } else {
            console.error('Usuario no encontrado en la base de datos');
            await signOut(auth);
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
        }
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  // --- 🔐 LOGIN: Admin (Firebase Auth) + Cocinero/Mesero (Firestore)
  const login = async (email, password) => {
    try {
      // Buscar usuario en Firestore
      const q = query(collection(db, 'usuarios'), where('email', '==', email.trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return { success: false, error: 'Usuario no encontrado' };

      const userDoc = snapshot.docs[0];
      const data = userDoc.data();

      // --- 🧑‍💼 ADMIN (Firebase Auth)
      if (data.rol === 'admin') {
        try {
          const credential = await signInWithEmailAndPassword(auth, email, password);
          setUser(credential.user);
          setUserData(data);
          await storage.setItem('userData', JSON.stringify(data));
          return { success: true };
        } catch (error) {
          console.error('Error Auth admin:', error);
          return { success: false, error: 'Credenciales incorrectas' };
        }
      }

      // --- 👨‍🍳 COCINERO (web Firestore)
      if (data.rol === 'cocinero') {
        if (data.password === password.trim()) {
          const finalData = { ...data, id: userDoc.id };
          setUser(null);
          setUserData(finalData);
          await storage.setItem('userData', JSON.stringify(finalData));
          return { success: true };
        } else {
          return { success: false, error: 'Contraseña incorrecta' };
        }
      }

      // --- 🍽️ MESERO (móvil Firestore)
      if (data.rol === 'mesero') {
        if (data.password === password.trim()) {
          const finalData = { ...data, id: userDoc.id };
          setUser(null);
          setUserData(finalData);
          await storage.setItem('userData', JSON.stringify(finalData));
          return { success: true };
        } else {
          return { success: false, error: 'Contraseña incorrecta' };
        }
      }

      return { success: false, error: 'Rol no permitido' };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error interno' };
    }
  };

  // --- 🔒 LOGOUT
  const logout = async () => {
    try {
      if (user) await signOut(auth);
      setUser(null);
      setUserData(null);
      await storage.removeItem('userData');
      return { success: true };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userData,
    loading,
    login,
    logout,
    isAdmin: userData?.rol === 'admin',
    isMesero: userData?.rol === 'mesero',
    isCocinero: userData?.rol === 'cocinero'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
