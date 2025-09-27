import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";

// 🔹 Config de Firebase (usa tus credenciales)
const firebaseConfig = {
  apiKey: "AIzaSyCNqFX_nJuw8tuR2DkxRwXQ1UE2loNlXyI",
  authDomain: "kitchensv-47863.firebaseapp.com",
  projectId: "kitchensv-47863",
  storageBucket: "kitchensv-47863.firebasestorage.app",
  messagingSenderId: "223871745234",
  appId: "1:223871745234:web:3e3ac8d70df2b11e45410b",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔹 Datos de prueba
const sampleOrders = [
  {
    numeroMesa: "5",
    notas: "sin cebolla",
    platos: [
      {
        referenciaProducto: "Kq6ArWBrU3rmu2qOTnAz",
        nombreProducto: "Pizza Margherita",
        cantidad: 2,
      },
    ],
    estado: "PENDIENTE",
    horaCreacion: Timestamp.now(),
    type: "dine_in",
  },
];

async function seedOrders() {
  try {
    for (const order of sampleOrders) {
      const docRef = await addDoc(collection(db, "orders"), order);
      console.log("Orden creada con ID:", docRef.id);
    }
    console.log("✅ Todas las órdenes de prueba fueron insertadas.");
  } catch (error) {
    console.error("Error insertando órdenes:", error);
  }
}

seedOrders();
