// components/reservations/ReservationForm.tsx
import { useState } from "react";
import GuestCounter from "./GuestCounter";

interface Props {
  mode: "add" | "edit" | "view";
  data?: any;
  onSubmit?: (data: any) => void;
}

const ReservationForm: React.FC<Props> = ({ mode, data, onSubmit }) => {
  const isView = mode === "view";
  const [guestCount, setGuestCount] = useState<number>(data?.guests || 1);

  return (
    <form className="reservation-form">
      <div className="grid-2">
        <div>
          <label>Customer Name *</label>
          <input disabled={isView} defaultValue={data?.customerName} />
        </div>

        <div>
          <label>Email Address</label>
          <input disabled={isView} defaultValue={data?.email} />
        </div>

        <div>
          <label>Phone Number *</label>
          <input disabled={isView} defaultValue={data?.phone} />
        </div>

        <div>
          <label>Reservation Date *</label>
          <input type="date" disabled={isView} defaultValue={data?.date} />
        </div>

        <div>
          <label>Reservation Time *</label>
          <input type="time" disabled={isView} defaultValue={data?.time} />
        </div>

        <div>
          <label>Floor / Area</label>
          <select disabled={isView} defaultValue={data?.floor}>
            <option>AC</option>
            <option>Non-AC</option>
          </select>
        </div>
      </div>

      <label>Guest Count *</label>
      <GuestCounter value={guestCount} onChange={setGuestCount} />

      <label>Notes</label>
      <textarea disabled={isView} defaultValue={data?.notes} />

      {!isView && (
        <div className="actions">
          <button type="button">Cancel</button>
          <button type="submit">
            {mode === "add" ? "Submit" : "Update"}
          </button>
        </div>
      )}
    </form>
  );
};

export default ReservationForm;
