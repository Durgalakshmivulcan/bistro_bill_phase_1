type MenuCardProps = {
  name: string;
  price: number;
  originalPrice?: number;
  tag?: string;
  discount?: string;
  disabled?: boolean;
  image?: string;
  onImageClick?: () => void;
  onAddToCart?: () => void;
  quantity?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
};

const MenuCard = ({
  name,
  price,
  originalPrice,
  tag,
  discount,
  disabled = false,
  image = "/images/menu/biryani.jpg",
  onImageClick,
  onAddToCart,
  quantity = 0,
  onIncrement,
  onDecrement,
}: MenuCardProps) => {

  // ✅ HANDLE CLICK HERE
  const handleClick = () => {
    if (disabled) return;
    onImageClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex flex-col rounded-2xl bg-white p-3 shadow-sm transition
        min-h-[240px] sm:min-h-[260px]
        md:hover:-translate-y-1 md:hover:shadow-lg
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-200">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover object-center transition-transform hover:scale-105"
        />

        {tag && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium">
            {tag}
          </span>
        )}

        {discount && (
          <span className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
            {discount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mt-3 flex flex-col">
        <h4 className="text-sm font-medium line-clamp-2">
          {name}
        </h4>

        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">
            ₹{price.toFixed(2)}
          </p>
          {originalPrice && originalPrice > price && (
            <p className="text-xs text-gray-400 line-through">
              ₹{originalPrice.toFixed(2)}
            </p>
          )}
        </div>

        {/* Button should NOT open modal */}
        {disabled ? (
          <button
            disabled
            onClick={(e) => e.stopPropagation()}
            className="mt-3 w-full rounded-lg bg-gray-200 py-2.5 text-sm font-medium text-gray-500"
          >
            Not Available
          </button>
        ) : quantity > 0 ? (
          <div
            className="mt-3 flex w-full items-center justify-between rounded-lg bg-yellow-400 text-sm font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onDecrement}
              className="px-3 py-2 hover:bg-yellow-500/70"
              aria-label="Decrease quantity"
            >
              –
            </button>

            <span className="px-2 tabular-nums">
              {quantity.toString().padStart(2, "0")}
            </span>

            <button
              onClick={onIncrement}
              className="px-3 py-2 hover:bg-yellow-500/70"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
            }}
            className="mt-3 w-full rounded-lg bg-yellow-400 py-2.5 text-sm font-medium transition hover:bg-yellow-500 active:scale-95"
          >
            + Add to cart
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuCard;
