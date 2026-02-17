import { LoadingSpinner } from "../Common";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSupplier, Supplier } from "../../services/supplierService";
import SupplierForm from "../../components/PurchaseOrder/SupplierForm";


export default function EditSupplier() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupplier = async () => {
      if (!id) return;
      try {
        const response = await getSupplier(id);
        if (response.success && response.data) {
          setSupplier(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch supplier:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSupplier();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <LoadingSpinner size="lg" message="Loading supplier..." />
    </div>
  );

  return (
    <SupplierForm
      mode="edit"
      defaultValues={supplier}
    />
  );
}
