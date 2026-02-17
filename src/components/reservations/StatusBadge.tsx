interface Props {
  status: string;
}

const StatusBadge: React.FC<Props> = ({ status }) => {
  return (
    <span className={`status-badge ${status.toLowerCase()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
