import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase_config";
import { useOrders } from "../context/OrderContext";
import { DispatchCard } from "../components/DispatchCard";
import { useFirestoreOrders } from "../util/hook/useFirestoreOrders";

export function DispatchBoard() {
  const { state } = useOrders();
  // 🔥 Cargar pedidos en tiempo real desde Firebase
  useFirestoreOrders();
  const handleDeliver = async (id: string) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { estado: "ENTREGADA" });
      console.log(`Orden ${id} marcada como entregada`);
    } catch (error) {
      console.error("Error actualizando orden:", error);
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {state.orders
        .filter((o) => o.estado === "LISTO") // solo los que están listos para entregar
        .map((order) => (
          <DispatchCard
            key={order.id}
            order={order}
            onDeliver={() => handleDeliver(order.id!)}
          />
        ))}
    </div>
  );
}
