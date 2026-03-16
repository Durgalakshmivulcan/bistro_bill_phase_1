export type ReservationStatus =
  | "new"
  | "accepted"
  | "waiting"
  | "cancelled"
  | "completed";

export type Reservation = {
  id: string;
  customerName: string;
  date: string;
  time: string;
  phone: string;
  email: string;
  source: "POS" | "Customer";
  guests: number;
  floor: string;
  tableNo: string;
  status: ReservationStatus;
};
