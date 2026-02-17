export type StatItem = {
  id: number;
  label: string;
  value: string | number;
};

export type ProductItem = {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
};

export const stats: StatItem[] = [
  { id: 1, label: "Total Products", value: 50 },
  { id: 2, label: "Total Regular Products", value: 30 },
  { id: 3, label: "Total Combo Products", value: 10 },
  { id: 4, label: "Total Retail Products", value: 10 },
  { id: 5, label: "Total Categories", value: 30 },
  { id: 6, label: "Total Sub - Categories", value: 20 },
  { id: 7, label: "Total Menu", value: 3 },
  { id: 8, label: "Total Brands", value: 10 },
  { id: 9, label: "Total Tags", value: 30 },
];

const sampleImage =
  "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400";

export const topSelling: ProductItem[] = [
  {
    id: 1,
    name: "Idli with Sambar",
    price: "₹ 60.00",
    imageUrl: sampleImage,
  },
  {
    id: 2,
    name: "Masala Dosa with Coconut Chutney",
    price: "₹ 80.00",
    imageUrl: sampleImage,
  },
  {
    id: 3,
    name: "Chicken Biryani",
    price: "₹ 150.00",
    imageUrl: sampleImage,
  },
  {
    id: 4,
    name: "Puri with Potato Curry",
    price: "₹ 60.00",
    imageUrl: sampleImage,
  },
  {
    id: 5,
    name: "Paneer Curry Combo (Paneer + Curry + Rice)",
    price: "₹ 140.00",
    imageUrl: sampleImage,
  },
  {
    id: 6,
    name: "Tiffin with Mixed Dosa",
    price: "₹ 100.00",
    imageUrl: sampleImage,
  },
  {
    id: 7,
    name: "Mini Thali (Chapati + Dal + Curry)",
    price: "₹ 90.00",
    imageUrl: sampleImage,
  },
  {
    id: 8,
    name: "Snack Combo (Samosa + Tea)",
    price: "₹ 60.00",
    imageUrl: sampleImage,
  },
  // repeat to visually match grid
  {
    id: 9,
    name: "Idli with Sambar",
    price: "₹ 60.00",
    imageUrl: sampleImage,
  },
  {
    id: 10,
    name: "Masala Dosa with Coconut Chutney",
    price: "₹ 80.00",
    imageUrl: sampleImage,
  },
];

export const lastSale: ProductItem[] = [...topSelling];
