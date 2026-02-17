import { Reservation } from "./reservationTypes";

const statusStyles = {
  new: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  waiting: "bg-gray-200 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-purple-100 text-purple-700",
};

const ReservationRow: React.FC<{
  reservation: Reservation;
  index: number;
}> = ({ reservation, index }) => {
  return (
    <div className="grid grid-cols-11 border-t px-4 py-3 text-sm">
      <span>{index + 1}</span>
      <span className="col-span-2">{reservation.customerName}</span>
      <span>
        {reservation.date}
        <br />
        {reservation.time}
      </span>
      <span>{reservation.phone}</span>
      <span>{reservation.email}</span>
      <span>{reservation.source}</span>
      <span>{reservation.guests}</span>
      <span>{reservation.floor}</span>
      <span>{reservation.tableNo}</span>
      <span>
        <span
          className={`rounded-full px-2 py-1 text-xs ${statusStyles[reservation.status]}`}
        >
          {reservation.status}
        </span>
      </span>
    </div>
  );
};

export default ReservationRow;
