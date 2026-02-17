type Props = {
  value: number;
  onChange: (val: number) => void;
};

export default function NumericKeypad({ value, onChange }: Props) {
  const append = (num: string) => {
    const next = `${value}${num}`;
    onChange(Number(next));
  };

  return (
    <div className="mt-4 grid grid-cols-4 gap-3 bg-gray-200 p-4 rounded-xl w-fit">
      {["1","2","3","4","5","6","7","8","9","00","0","."].map((n) => (
        <button
          key={n}
          onClick={() => append(n)}
          className="bg-white rounded-md h-12 text-lg shadow"
        >
          {n}
        </button>
      ))}

      <button
        onClick={() => onChange(0)}
        className="col-span-2 bg-gray-300 rounded-md h-12"
      >
        C
      </button>

      <button
        onClick={() => onChange(0)}
        className="col-span-2 bg-gray-300 rounded-md h-12"
      >
        AC
      </button>
    </div>
  );
}
