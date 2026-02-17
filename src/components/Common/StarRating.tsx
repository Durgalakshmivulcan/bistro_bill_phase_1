import { Star } from "lucide-react";

type Props = {
  value: number;
};

export default function StarRating({ value }: Props) {
  return (
    <div className="flex gap-5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={25}
          className={
            n <= value
              ? "fill-yellow-400 text-yellow-400"
              : "text-black-400"
          }
        />
      ))}
    </div>
  );
}
