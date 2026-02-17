import StatusBadge from "./StatusBadge";

interface Props {
  data: any[];
}

const ReservationTable: React.FC<Props> = ({ data }) => {
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
            <td>{item.date} {item.time}</td>
            <td>{item.phone}</td>
            <td>{item.email}</td>
            <td>{item.source}</td>
            <td>{item.guests}</td>
            <td>{item.floor}</td>
            <td>{item.tables.join(", ")}</td>
            <td>
              <StatusBadge status={item.status} />
            </td>
            <td>
              <button className="action-btn">⋮</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ReservationTable;
