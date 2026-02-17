import React from "react";
import { MoreVertical } from "lucide-react";

type Props = {
  name: string;
  price: string;
  image: string;
};

const ProductCard: React.FC<Props> = ({ name, price, image }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between shadow">
    <div className="flex gap-3">
      <img src={image} className="w-20 h-16 rounded-lg object-cover" />

      <div>
        <p className="font-semibold text-sm">{name}</p>
        <p className="text-xs text-gray-600 mt-1">Price: {price}</p>
      </div>
    </div>

    <MoreVertical className="text-gray-500 cursor-pointer" />
  </div>
);

export default ProductCard;
