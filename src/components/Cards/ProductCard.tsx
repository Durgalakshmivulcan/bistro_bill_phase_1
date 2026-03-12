import { useState } from "react";
import { Eye } from "lucide-react";
import Actions from "../form/ActionButtons";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import ProductQuickViewModal from "../Catalog/products/ProductQuickViewModal";
import favoriteImg from "../../assets/favorite.png";
import deleteImg from "../../assets/deleteConformImg.png";
import conformDeleteImg from "../../assets/deleteSuccessImg.png";
import { usePermission } from "../../hooks/usePermission";

interface ProductCardProps {
  id?: string | number;
  name: string;
  price: number | string;
  image?: string;
  imageUrl?: string;
  onDelete?: (id: string | number) => Promise<boolean | void> | boolean | void;
}

const ProductCard = ({
  id,
  name,
  price,
  image,
  imageUrl,
  onDelete,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { hasPermission, permissions } = usePermission();

  const catalogPermissions = permissions.catalog || {};
  const canUpdate =
    hasPermission("catalog", "update") ||
    (catalogPermissions as Record<string, boolean>).edit === true;
  const canDelete = hasPermission("catalog", "delete");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [favouriteOpen, setFavouriteOpen] = useState(false);

  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const imgSrc = imageUrl || image || "/placeholder.jpg";
  const hasId = id !== undefined && id !== null;

  const handleDeleteConfirm = async () => {
    let deleted = true;

    if (hasId) {
      const result = await onDelete?.(id as string | number);
      deleted = result !== false;
    }

    setDeleteOpen(false);
    if (!deleted) {
      return;
    }

    setDeletedOpen(true);

    setTimeout(() => {
      setDeletedOpen(false);
    }, 2000);
  };

  const handleFavourite = () => {
    setFavouriteOpen(true);
    setTimeout(() => {
      setFavouriteOpen(false);
    }, 2000);
  };

  return (
    <>
      <div className="relative bg-white border border-bb-border rounded-lg p-3 flex gap-3 flex-wrap">
        <div className="relative group">
          <img
            src={imgSrc}
            alt={name}
            className="w-16 h-12 rounded object-cover bg-gray-100"
          />
          <button
            onClick={() => hasId && setQuickViewOpen(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Quick View"
          >
            <Eye size={16} className="text-white" />
          </button>
        </div>

        <div className="flex-1">
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-bb-textSoft">
            Price : {typeof price === "number" ? `Rs. ${price}` : price}
          </div>
        </div>

        <Actions
          actions={[
            "view",
            ...(canUpdate ? ["edit" as const] : []),
            ...(canDelete ? ["delete" as const] : []),
            "favourite",
          ]}
          onView={() => {
            if (hasId) {
              setQuickViewOpen(true);
            }
          }}
          onEdit={
            canUpdate
              ? () => {
                  if (hasId) {
                    navigate(`/catalog/products/edit/${id}`);
                  }
                }
              : undefined
          }
          onDelete={canDelete ? () => setDeleteOpen(true) : undefined}
          onFavourite={handleFavourite}
        />
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteImg} alt="Delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. <br />
          Do you want to proceed with deletion?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setDeleteOpen(false)}
            className="border border-black px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleDeleteConfirm}
            className="bg-yellow-400 px-8 py-2 rounded font-medium"
          >
            Yes
          </button>
        </div>
      </Modal>

      <Modal
        open={deletedOpen}
        onClose={() => setDeletedOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Deleted!</h2>

        <div className="flex justify-center mb-4">
          <img src={conformDeleteImg} alt="Delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Product has been successfully removed.
        </p>
      </Modal>

      <Modal
        open={favouriteOpen}
        onClose={() => setFavouriteOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          Marked as Favorite
        </h2>

        <div className="flex justify-center mb-4">
          <img src={favoriteImg} alt="Favorite" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Product successfully added to favorites!
        </p>
      </Modal>

      {hasId && (
        <ProductQuickViewModal
          open={quickViewOpen}
          productId={id as string | number}
          onClose={() => setQuickViewOpen(false)}
          onDelete={onDelete}
        />
      )}
    </>
  );
};

export default ProductCard;
