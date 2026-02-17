// components/reservations/GuestCounter.tsx
import React from "react";

interface Props {
  value: number;
  onChange: (val: number) => void;
}

const GuestCounter: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="guest-counter">
      <button onClick={() => onChange(Math.max(1, value - 1))}>-</button>
      <span>{value.toString().padStart(2, "0")}</span>
      <button onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
};

export default GuestCounter;
