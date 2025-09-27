import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

// 🔹 Configura con tus credenciales de Firebase
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

async function clearOrders() {
  try {
    const ordersRef = collection(db, "orders"); // colección a limpiar
    const snapshot = await getDocs(ordersRef);

    if (snapshot.empty) {
      console.log("No hay órdenes para eliminar.");
      return;
    }

    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "orders", docSnap.id));
      console.log("Orden eliminada:", docSnap.id);
    }

    console.log("✅ Todas las órdenes han sido eliminadas.");
  } catch (error) {
    console.error("Error eliminando órdenes:", error);
  }
}

clearOrders();
