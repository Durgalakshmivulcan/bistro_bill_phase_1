import { useState } from "react";
import StatusBadge from "./StatusBadge";

interface Props {
  data: any[];
}

const ReservationTable: React.FC<Props> = ({ data }) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (id: string) => {
    if (openMenu === id) {
      setOpenMenu(null);
    } else {
      setOpenMenu(id);
    }
  };

  return (
    <table className="reservation-table">
      <thead>
        <tr>
          <th>Sl. No.</th>
          <th>Customer Name</th>
          <th>Date & Time</th>
          <th>Phone Number</th>
          <th>Email</th>
          <th>Source</th>
          <th>No. of Guests</th>
          <th>Floor/Area</th>
          <th>Table No.</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {data.map((item, index) => (
          <tr key={item.id}>
            <td>{index + 1}</td>

            <td>{item.customerName}</td>

            <td>
              <div>{item.date}</div>
              <div>{item.time}</div>
            </td>

            <td>{item.phone}</td>

            <td>{item.email}</td>

            <td>{item.source}</td>

            <td>{item.guests}</td>

            <td>{item.floor}</td>

            <td>{item.tables?.join(", ")}</td>

            <td>
              <StatusBadge status={item.status} />
            </td>

            <td style={{ position: "relative" }}>
              <button
                className="action-btn"
                onClick={() => toggleMenu(item.id)}
              >
                ⋮
              </button>

              {openMenu === item.id && (
                <div className="action-menu">
                  <button className="menu-item">👁 View</button>
                  <button className="menu-item">✏ Edit</button>
                  <button className="menu-item">📝 Update Status</button>
                  <button className="menu-item delete">🗑 Delete</button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ReservationTable;
