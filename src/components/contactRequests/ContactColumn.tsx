import ContactCard from "./ContactCard";

interface Props {
  title: string;
  color: string;
  data: any[];
  onRefresh: () => void;
}

const ContactColumn = ({ title, color, data, onRefresh }: Props) => {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-4 min-w-[280px]">
      {/* Column Header */}
      <div
        className={`text-white font-semibold px-4 py-2 rounded-md ${color}`}
      >
        {title}
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            No contacts in this stage
          </div>
        ) : (
          data.map((item) => (
            <ContactCard key={item.id} item={item} onRefresh={onRefresh} />
          ))
        )}
      </div>
    </div>
  );
};

export default ContactColumn;
