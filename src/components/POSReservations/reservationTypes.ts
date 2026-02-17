export type ReservationStatus =
  | "new"
  | "accepted"
  | "waiting"
  | "cancelled"
  | "completed";

export type Reservation = {
  id: number;
  customerName: string;
  date: string;
  time: string;
  phone: string;
  email: string;
  source: "POS" | "Customer";
  guests: number;
  floor: "AC" | "Non-AC";
  tableNo: string;
  status: ReservationStatus;
};
