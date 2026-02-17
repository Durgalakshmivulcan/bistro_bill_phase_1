import { useState, useEffect } from "react";
import { ChevronsRight, Save } from "lucide-react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import ProductDetails from "../components/Catalog/products/productDetails";
import VariantsStep from "../components/Catalog/products/variantsStep";
import AddonsStep from "../components/Catalog/products/addonsStep";
import PriceDetails from "../components/Catalog/products/priceDetails";
import ImagesStep from "../components/Catalog/products/imagesStep";
import AdditionalDetails from "../components/Catalog/products/additionalDetails";
import AdditionalIngredients from "../components/Catalog/products/additionalIngredients";
import AvailabilityScheduleStep from "../components/Catalog/products/AvailabilityScheduleStep";
import KitchenStationStep from "../components/Catalog/products/KitchenStationStep";
import Modal from "../components/ui/Modal";
import successImg from "../assets/tick.png";
import { createProduct, getProduct, updateProduct } from "../services/catalogService";
import { CRUDToasts } from "../utils/toast";

const steps = [
  "Product Details",
  "Variants",
  "Addons",
  "Price Details",
  "Images",
  "Additional Details",
  "Additional Ingredients",
  "Kitchen Station",
  "Availability",
];

const AddProduct = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isView = location.pathname.includes("/view/");
  const isEdit = location.pathname.includes("/edit/");
  const isAdd = location.pathname.includes("/add");

  const [activeStep, setActiveStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessOpen, setSaveSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 🔥 Shared product state
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🔁 Load product for Edit/View
  useEffect(() => {
    if ((isEdit || isView) && id) {
      setLoading(true);
      setErrorMessage("");

      // Fetch product from API
      getProduct(id)
        .then((response) => {
          if (response.success && response.data) {
            setProductData(response.data);
          } else {
            setErrorMessage(response.message || "Failed to load product");
          }
        })
        .catch((error) => {
          console.error("Error loading product:", error);
          setErrorMessage(error?.message || "Failed to load product");
        })
        .finally(() => {
          setLoading(false);
        });
    }

    if (isAdd) {
      setProductData(null);
    }

    setActiveStep(1);
  }, [id, isEdit, isView, isAdd]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage("");

    try {
      if (isAdd) {
        // Create new product
        // TODO: Form components need refactoring to collect actual data
        // For now, using mock data structure that matches CreateProductData interface
        const createData = {
          name: productData?.name || "New Product",
          type: productData?.type || "Regular" as const,
          categoryId: productData?.categoryId || "temp-category-id", // Required field
          subCategoryId: productData?.subCategoryId,
          brandId: productData?.brandId,
          menuId: productData?.menuId,
          sku: productData?.sku,
          barcode: productData?.barcode,
          description: productData?.description,
          shortCode: productData?.shortCode,
          hsnCode: productData?.hsnCode,
          preparationTime: productData?.preparationTime,
          servesCount: productData?.servesCount,
          isVeg: productData?.isVeg ?? true,
          status: "active" as const,
          availabilitySchedule: productData?.availabilitySchedule,
          kitchenIds: productData?.kitchenIds,
        };

        const response = await createProduct(createData);

        if (response.success) {
          CRUDToasts.created("Product");
          setSaveSuccessOpen(true);

          // Navigate to product list after 2 seconds
          setTimeout(() => {
            setSaveSuccessOpen(false);
            navigate("/catalog/products");
          }, 2000);
        } else {
          setErrorMessage(response.message || "Failed to create product");
        }
      } else if (isEdit && id) {
        // Update existing product
        const updateData = {
          name: productData?.name,
          type: productData?.type,
          categoryId: productData?.categoryId,
          subCategoryId: productData?.subCategoryId,
          brandId: productData?.brandId,
          menuId: productData?.menuId,
          sku: productData?.sku,
          barcode: productData?.barcode,
          description: productData?.description,
          shortCode: productData?.shortCode,
          hsnCode: productData?.hsnCode,
          preparationTime: productData?.preparationTime,
          servesCount: productData?.servesCount,
          isVeg: productData?.isVeg,
          status: productData?.status,
          availabilitySchedule: productData?.availabilitySchedule,
          kitchenIds: productData?.kitchenIds,
        };

        const response = await updateProduct(id, updateData);

        if (response.success) {
          CRUDToasts.updated("Product");
          setSaveSuccessOpen(true);

          // Navigate to product list after 2 seconds
          setTimeout(() => {
            setSaveSuccessOpen(false);
            navigate("/catalog/products");
          }, 2000);
        } else {
          setErrorMessage(response.message || "Failed to update product");
        }
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      setErrorMessage(error?.message || "An error occurred while saving the product");
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    const commonProps = {
      productData,
      setProductData,
      readOnly: isView,
      isEdit,
    };

    if (loading) {
      return (
        <div className="text-center py-10 text-gray-500">
          Loading product data...
        </div>
      );
    }

    switch (activeStep) {
      case 1:
        return (
          <ProductDetails {...commonProps} onNext={() => setActiveStep(2)} />
        );
      case 2:
        return (
          <VariantsStep
            {...commonProps}
            onNext={() => setActiveStep(3)}
            onPrev={() => setActiveStep(1)}
          />
        );
      case 3:
        return (
          <AddonsStep
            {...commonProps}
            onNext={() => setActiveStep(4)}
            onPrev={() => setActiveStep(2)}
          />
        );
      case 4:
        return (
          <PriceDetails
            {...commonProps}
            onNext={() => setActiveStep(5)}
            onPrev={() => setActiveStep(3)}
          />
        );
      case 5:
        return (
          <ImagesStep
            {...commonProps}
            onNext={() => setActiveStep(6)}
            onPrev={() => setActiveStep(4)}
          />
        );
      case 6:
        return (
          <AdditionalDetails
            {...commonProps}
            onNext={() => setActiveStep(7)}
            onPrev={() => setActiveStep(5)}
          />
        );
      case 7:
        return (
          <AdditionalIngredients
            {...commonProps}
            onNext={() => setActiveStep(8)}
            onPrev={() => setActiveStep(6)}
          />
        );
      case 8:
        return (
          <KitchenStationStep
            {...commonProps}
            onNext={() => setActiveStep(9)}
            onPrev={() => setActiveStep(7)}
          />
        );
      case 9:
        return (
          <AvailabilityScheduleStep
            {...commonProps}
            onPrev={() => setActiveStep(8)}
          />
        );
      default:
        return null;
    }
  };

  const Stepper = () => (
    <div className="flex items-center gap-2 mb-6 text-sm overflow-x-auto">
      {steps.map((step, idx) => {
        const stepNo = idx + 1;
        const isClickable = isEdit || (!isView && stepNo <= activeStep);

        return (
          <div key={step} className="flex items-center gap-2 shrink-0">
            <div
              onClick={() => isClickable && setActiveStep(stepNo)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-medium
                ${
                  stepNo <= activeStep
                    ? "bg-yellow-400 text-black cursor-pointer"
                    : "border border-black text-gray-600"
                }
                ${!isClickable && "opacity-50 cursor-not-allowed"}
              `}
            >
              {stepNo}
            </div>

            <span
              onClick={() => isClickable && setActiveStep(stepNo)}
              className={`whitespace-nowrap
                ${
                  stepNo <= activeStep
                    ? "font-medium text-black"
                    : "text-gray-600"
                }
                ${isClickable ? "cursor-pointer" : "opacity-50"}
              `}
            >
              {step}
            </span>

            {idx !== steps.length - 1 && <ChevronsRight size={18} />}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-6 bg-[#FFFDF5] min-h-screen">
      {/* 🔥 HEADER */}
      <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">
            {isView && "View Product"}
            {isEdit && "Edit Product"}
            {isAdd && "Add New Product"}
          </h1>

          {id && <p className="text-xs text-gray-500">Product ID: {id}</p>}
        </div>

        {!isView && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-black text-white px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {isEdit ? "Save Changes" : "Create Product"}
          </button>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded text-red-700">
          {errorMessage}
        </div>
      )}

      <Stepper />
      {renderStep()}
      {/* 🔵 SAVE SUCCESS MODAL */}
      <Modal
        open={saveSuccessOpen}
        onClose={() => setSaveSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          {isEdit ? "Updated!" : "Created!"}
        </h2>
        <div className="flex justify-center mb-4">
          <img src={successImg} alt="Success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          {isEdit
            ? "Product has been successfully updated."
            : "Product has been successfully created."}
        </p>
      </Modal>
    </div>
  );
};

export default AddProduct;
