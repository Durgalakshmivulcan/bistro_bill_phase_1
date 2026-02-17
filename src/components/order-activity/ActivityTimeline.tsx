import { buildOrderTimeline } from "../../data/buildOrderTimeline";
import ActivityItem from "./ActivityItem";

type Props = {
  order: any;
};

const ActivityTimeline: React.FC<Props> = ({ order }) => {
  const timeline = buildOrderTimeline(order);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">
        Order Activity Log
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Detail information about Order Number {order.orderNo}
      </p>

      <div className="space-y-1">
        {timeline.map((item, index) => (
          <ActivityItem
            key={item.id}
            item={item}
            isLast={index === timeline.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;
