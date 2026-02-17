import { useState } from "react";
import MenuCard from "./MenuCard";
import MenuItemModal from "./Modals/MenuItemModal";

export default function MenuList() {
  const [open, setOpen] = useState(false);

  return (
    <>
<MenuCard
  name="Chicken Biryani"
  price={160}
  tag="Non-Veg"
  discount="10% Off"
  onImageClick={() => setOpen(true)}
/>


      <MenuItemModal
        open={open}
        item={{
          name: "Chicken Biryani",
          price: 160,
          image: "/images/menu/chicken-biryani.jpg",
          discount: "10% Off",
        }}
        onClose={() => setOpen(false)}       // ✅ IMPORTANT
      />
    </>
  );
}
