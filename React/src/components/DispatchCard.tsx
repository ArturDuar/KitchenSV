import type { Order } from "../types/Order";

type Props = {
  order: Order;
  onDeliver: (id: string) => void;
};

export function DispatchCard({ order, onDeliver }: Props) {
  return (
    <div className="bg-white shadow-md border border-green-300 rounded-xl overflow-hidden w-72 mx-auto">
      {/* Header */}
      <div className="bg-green-500 text-white p-3 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg">Mesa {order.numeroMesa}</h2>
          <p className="text-xs opacity-80">
            {order.type === "dine_in" ? "Dine In" : "Take Off"}
          </p>
        </div>
        <span className="text-sm font-semibold">
          {order.platos.reduce((acc, item) => acc + item.cantidad, 0)} Items
        </span>
      </div>

      {/* Items */}
      <div className="p-4 space-y-2">
        {order.platos.map((item, i) => (
          <div
            key={i}
            className="flex justify-between items-center border-b last:border-0 pb-1"
          >
            <div>
              <span className="font-medium">{item.cantidad}x </span>
              <span>{item.nombreProducto}</span>
              {order.notas && (
                <span className="text-gray-500 italic text-xs ml-1">
                  ({order.notas})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Button */}
      <div className="p-3 bg-green-50 flex justify-end">
        <button
          onClick={() => order.id && onDeliver(order.id)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow"
          disabled={!order.id}
        >
          Entregado
        </button>
      </div>
    </div>
  );
}
