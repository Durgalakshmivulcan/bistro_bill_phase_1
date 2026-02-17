type Props = {
  active: string;
  setActive: (v: string) => void;
};

export default function FeedbackTabs({ active, setActive }: Props) {
  const tabs = ["Summary", "Questions", "Individual"];

  return (
    <div className="flex gap-6 border-b">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setActive(t)}
          className={`pb-2 text-sm ${
            active === t
              ? "px-3 py-1.5 bg-black text-white rounded-t-md font-medium"
              : "text-grey-500"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
