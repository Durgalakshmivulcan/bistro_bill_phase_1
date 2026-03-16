// components/reservations/GuestCounter.tsx
import React from "react";

interface Props {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

const GuestCounter: React.FC<Props> = ({ value, onChange, disabled }) => {
  return (
    <div className="guest-counter">
      <button
        onClick={() => !disabled && onChange(Math.max(1, value - 1))}
        disabled={disabled}
      >
        -
      </button>
      <span>{value.toString().padStart(2, "0")}</span>
      <button
        onClick={() => !disabled && onChange(value + 1)}
        disabled={disabled}
      >
        +
      </button>
    </div>
  );
};

export default GuestCounter;
