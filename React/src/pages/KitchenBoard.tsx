import { useState } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase_config";
import { useOrders } from "../context/OrderContext";
import { OrderCard } from "../components/OrderCard";
import type { Order, OrderStatus } from "../types/Order";
import { useFirestoreOrders } from "../util/hook/useFirestoreOrders";

export function KitchenBoard() {
  const { state } = useOrders();
  const [filter, setFilter] = useState<"pending" | "cooking" | "delayed">(
    "pending"
  );

  // 🔥 Cargar pedidos en tiempo real desde Firebase
  useFirestoreOrders();

  // 🔹 Función para actualizar estado en Firestore
  const updateOrderStatus = async (order: Order, estado: OrderStatus) => {
    if (!order.id) return console.error("Order ID vacío");
    const orderRef = doc(db, "orders", order.id);

    const data: Partial<Order> = { estado };
    if (estado === "PREPARANDO") data.horaCocina = Timestamp.now();

    try {
      await updateDoc(orderRef, data);
      console.log("Orden actualizada:", order.id, "Estado:", estado);
    } catch (err) {
      console.error("Error actualizando orden:", err);
    }
  };

  // Handlers
  const handlePause = (order: Order) => updateOrderStatus(order, "PAUSADA");
  const handleResume = (order: Order) => updateOrderStatus(order, "PENDIENTE");
  const handleComplete = (order: Order) => updateOrderStatus(order, "LISTO");
  const handleStartCooking = (order: Order) =>
    updateOrderStatus(order, "PREPARANDO");

  // Filtrado de pedidos
  const filteredOrders = state.orders.filter((order) => {
    const now = Date.now();
    const sixMinutes = 6 * 60 * 1000;

    switch (filter) {
      case "pending":
        return order.estado === "PENDIENTE";
      case "cooking":
        return order.estado === "PREPARANDO";
      case "delayed":
        return (
          order.estado !== "LISTO" &&
          order.estado !== "ENTREGADA" &&
          order.horaCreacion.toMillis() < now - sixMinutes
        );
      default:
        return true;
    }
  });

  return (
    <div className="p-6">
      {/* Header con filtros */}
      <nav className="mb-4 flex gap-4 flex-wrap">
        {["pending", "cooking", "delayed"].map((f) => (
          <button
            key={f}
            className={`px-4 py-2 rounded ${
              filter === f ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setFilter(f as typeof filter)}
          >
            {f === "pending"
              ? "Pendientes"
              : f === "cooking"
              ? "Cocinando"
              : "Retrasados"}
          </button>
        ))}
      </nav>

      {/* Lista de pedidos en horizontal */}
      <div className="flex flex-row gap-4 p-4 overflow-x-auto">
        {filteredOrders
          .sort((a, b) => b.horaCreacion.toMillis() - a.horaCreacion.toMillis())
          .map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPause={() => handlePause(order)}
              onResume={() => handleResume(order)}
              onComplete={() => handleComplete(order)}
              onStartCooking={() => handleStartCooking(order)}
            />
          ))}
      </div>
    </div>
  );
}
