import { useState } from "react";
import GuestCounter from "./GuestCounter";

interface Props {
  mode: "add" | "edit" | "view";
  data?: any;
  onSubmit?: (data: any) => void;
}

const ReservationForm: React.FC<Props> = ({ mode, data, onSubmit }) => {
  const isView = mode === "view";

  const [form, setForm] = useState({
    customerName: data?.customerName || "",
    email: data?.email || "",
    phone: data?.phone || "",
    date: data?.date || "",
    time: data?.time || "",
    floor: data?.floor || "",
    table: data?.table || "",
    notes: data?.notes || "",
  });

  const [guestCount, setGuestCount] = useState<number>(data?.guests || 1);

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        ...form,
        guests: guestCount,
      });
    }
  };

  return (
    <form className="reservation-form-card" onSubmit={handleSubmit}>
      <h2 className="form-title">
        {mode === "add" ? "Add New Reservation" : "Reservation"}
      </h2>

      <div className="form-grid">

        <div className="form-group">
          <label>Customer Name *</label>
          <input
            name="customerName"
            placeholder="Enter/Select Customer Name"
            disabled={isView}
            value={form.customerName}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            name="email"
            placeholder="Email"
            disabled={isView}
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <input
            name="phone"
            placeholder="+91 Phone Number"
            disabled={isView}
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Reservation Date *</label>
          <input
            type="date"
            name="date"
            disabled={isView}
            value={form.date}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Reservation Time Slot *</label>
          <input
            type="time"
            name="time"
            disabled={isView}
            value={form.time}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Floor/Area</label>
          <select
            name="floor"
            disabled={isView}
            value={form.floor}
            onChange={handleChange}
          >
            <option value="">Select Floor/Area</option>
            <option value="AC">AC</option>
            <option value="Non-AC">Non‑AC</option>
          </select>
        </div>

        <div className="form-group">
          <label>Guest Count *</label>
          <GuestCounter value={guestCount} onChange={setGuestCount} disabled={isView} />
        </div>

        <div className="form-group">
          <label>Table</label>
          <select
            name="table"
            disabled={isView}
            value={form.table}
            onChange={handleChange}
          >
            <option value="">Select Table</option>
            <option>T-01</option>
            <option>T-02</option>
            <option>T-03</option>
            <option>T-04</option>
            <option>T-05</option>
            <option>T-06</option>
          </select>
        </div>

      </div>

      <div className="form-group full">
        <label>Notes</label>
        <textarea
          name="notes"
          placeholder="Add Notes here.."
          disabled={isView}
          value={form.notes}
          onChange={handleChange}
        />
      </div>

      {!isView && (
        <div className="form-actions">
          <button type="button" className="cancel-btn">
            Cancel
          </button>

          <button type="submit" className="submit-btn">
            {mode === "add" ? "Submit" : "Update"}
          </button>
        </div>
      )}
    </form>
  );
};

export default ReservationForm;
