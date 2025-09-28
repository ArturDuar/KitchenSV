import { Timestamp } from "firebase/firestore";

export type OrderItem = {
  nombreProducto: string;
  cantidad: number;
  referenciaProducto?: string;
};

export type OrderStatus =
  | "PENDIENTE"
  | "PREPARANDO"
  | "PAUSADA"
  | "LISTO"
  | "ENTREGADA";

export type Order = {
  id?: string; // ID de Firestore
  numeroMesa: string;
  notas?: string;
  platos: OrderItem[];
  estado: OrderStatus;
  horaCreacion: Timestamp; // Timestamp de Firestore
  horaCocina?: Timestamp; // Timestamp de Firestore
  type: "dine_in" | "take_off";
};
