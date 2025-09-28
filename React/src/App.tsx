import { useEffect, useState } from "react";
import { KitchenBoard } from "./pages/KitchenBoard";
import { DispatchBoard } from "./pages/DispatchBoard";
import type { Order } from "./types/Order";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "./firebase/firebase_config";

function App() {
  const [view, setView] = useState<"kitchen" | "dispatch">("kitchen");
  const [orders, setOrders] = useState<Order[]>([]);

  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(), // no sabemos la estructura
        }));
        setDocs(data);
        console.log(data);
      } catch (error) {
        console.error("Error leyendo la colección:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-orange-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Sistema de Órdenes</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("kitchen")}
            className={`px-4 py-2 rounded ${
              view === "kitchen" ? "bg-white text-orange-600" : "bg-orange-500"
            }`}
          >
            Cocina
          </button>
          <button
            onClick={() => setView("dispatch")}
            className={`px-4 py-2 rounded ${
              view === "dispatch" ? "bg-white text-orange-600" : "bg-orange-500"
            }`}
          >
            Despacho
          </button>
        </div>
      </header>

      {view === "kitchen" ? <KitchenBoard /> : <DispatchBoard />}
    </div>
  );
}

export default App;
