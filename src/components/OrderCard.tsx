import { useEffect, useState } from "react";
import type { Order } from "../types/Order";
import { Timestamp } from "firebase/firestore";

type Props = {
  order: Order;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onComplete: (id: string) => void;
  onStartCooking: (id: string) => void;
};

export function OrderCard({
  order,
  onPause,
  onResume,
  onComplete,
  onStartCooking,
}: Props) {
  const createdAt =
    order.horaCreacion instanceof Timestamp
      ? order.horaCreacion.toMillis()
      : order.horaCreacion;

  const cookingAt =
    order.horaCocina instanceof Timestamp
      ? order.horaCocina.toMillis()
      : order.horaCocina;

  const [minutes, setMinutes] = useState(
    Math.floor((Date.now() - createdAt) / 60000)
  );
  const [cookingSeconds, setCookingSeconds] = useState(0);

  // Contador de cocinando
  useEffect(() => {
    if (!cookingAt) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - cookingAt) / 1000);
      setCookingSeconds(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [cookingAt]);

  // Formato mm:ss
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Contador de minutos desde creación
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - createdAt) / 60000);
      setMinutes(diff);
    }, 60000);
    return () => clearInterval(interval);
  }, [createdAt]);

  // Color dinámico del header
  let headerColor = "bg-green-500";
  if (minutes >= 3 && minutes < 6) headerColor = "bg-yellow-500";
  if (minutes >= 6) headerColor = "bg-red-500";

  const getTypeLabel = (key: string) => {
    if (key === "dine_in") return "Comer acá";
    if (key === "take_off") return "Para llevar";
    return "";
  };

  return (
    <div className="bg-white shadow-md border border-green-300 rounded-xl w-100 mx-auto">
      {/* Header */}
      <div
        className={`${headerColor} text-white p-3 flex justify-between items-center`}
      >
        <div>
          <p className="text-sm font-bold">#{order.id}</p>
          <p className="text-xs opacity-80">
            {new Date(createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-80">
            {order.estado === "PREPARANDO"
              ? `Cocinando: ${formatTime(cookingSeconds)}`
              : `${minutes} Min`}
          </p>
        </div>
      </div>

      {/* Info mesa */}
      <div className="p-3 flex justify-between items-center border-b">
        <p className="text-xs opacity-80">
          Mesa - {String(order.numeroMesa).padStart(2, "0")}
        </p>
        <p className="text-xs opacity-80">{getTypeLabel(order.type ?? "")}</p>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {order.platos.map((item, i) => (
          <div key={i} className="flex flex-col border-b pb-2 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{item.cantidad}x</span>
              <span className="text-sm">{item.nombreProducto}</span>
            </div>
          </div>
        ))}

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          {order.estado === "PENDIENTE" && (
            <button
              onClick={() => onStartCooking(order.id!)}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium"
            >
              Preparar
            </button>
          )}
          {order.estado === "PREPARANDO" && (
            <button
              onClick={() => onComplete(order.id!)}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium"
            >
              Listo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
