interface Props {
  status: "active" | "inactive";
}

const StatusBadge = ({ status }: Props) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        status === "active"
          ? "bg-blue-100 text-blue-600"
          : "bg-red-100 text-red-600"
      }`}
    >
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
};

export default StatusBadge;
