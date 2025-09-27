import { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useOrders } from "../../context/OrderContext";
import { db } from "../../firebase/firebase_config";
import type { Order } from "../../types/Order";

export function useFirestoreOrders() {
  const { dispatch } = useOrders();

  useEffect(() => {
    const ordersRef = collection(db, "orders");

    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[]; // ⚠️ casteo para que TypeScript no se queje

      dispatch({ type: "SET_ORDERS", payload: orders });
    });

    return () => unsubscribe();
  }, [dispatch]);
}
