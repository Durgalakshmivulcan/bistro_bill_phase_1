import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPurchaseOrder, PurchaseOrderDetail } from "../../services/purchaseOrderService";
import POForm from "./POForm";
import { LoadingSpinner } from "../Common";

export default function EditPO() {
  const { id } = useParams();
  const [po, setPo] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPO = async () => {
      if (!id) return;
      try {
        const response = await getPurchaseOrder(id);
        if (response.success && response.data) {
          setPo(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch PO:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPO();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <LoadingSpinner size="lg" message="Loading purchase order..." />
    </div>
  );

  return <POForm mode="edit" defaultValues={po} />;
}
