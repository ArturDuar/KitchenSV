import { createContext, useContext, useReducer, useEffect } from "react";
import type { Order } from "../types/Order";

type State = {
  orders: Order[];
};

type Action =
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "UPDATE_ORDER"; payload: Order }
  | { type: "SET_ORDERS"; payload: Order[] }
  | { type: "DELETE_ORDER"; payload: number };

const OrderContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({
  state: { orders: [] },
  dispatch: () => {},
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_ORDER":
      return { orders: [...state.orders, action.payload] };
    case "UPDATE_ORDER":
      return {
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o
        ),
      };
    case "SET_ORDERS":
      return { orders: action.payload };

    case "DELETE_ORDER":
      alert("Funcionalidad de eliminar no implementada");
    default:
      return state;
  }
}

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { orders: [] });

  // 🔄 Persistencia en localStorage
  useEffect(() => {
    const saved = localStorage.getItem("orders");
    if (saved) {
      dispatch({ type: "SET_ORDERS", payload: JSON.parse(saved) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(state.orders));
  }, [state.orders]);

  return (
    <OrderContext.Provider value={{ state, dispatch }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
