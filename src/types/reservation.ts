export type ReservationStatus =
  | "New"
  | "Accepted"
  | "Waiting"
  | "Cancelled";

export interface Reservation {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  floor: string;
  tables: string[];
  source: string;
  status: ReservationStatus;
  notes?: string;
}
