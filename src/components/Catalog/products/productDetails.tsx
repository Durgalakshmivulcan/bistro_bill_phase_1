import { useRef, useEffect, useState } from "react";
import Input from "../../form/Input";
import Select from "../../form/Select";
import Toggle from "../../form/Toggle";
import { ChevronRight, RefreshCw } from "lucide-react";
import Textarea from "../../form/Textarea";
import {
  getCategories,
  getBrands,
  getTags,
  getSubCategoriesByCategory,
  getMeasuringUnits,
} from "../../../services/catalogService";
import type {
  Category,
  Brand,
  Tag,
  SubCategory,
  MeasuringUnit,
} from "../../../services/catalogService";
import { getTaxes, Tax } from "../../../services/settingsService";
import { getDiscounts } from "../../../services/marketingService";
import { generateEAN13, isValidBarcode } from "../../../utils/barcode";
import BarcodeDisplay from "./BarcodeDisplay";

const ProductDetails = ({ productData, setProductData, onNext, readOnly }: any) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [measuringUnits, setMeasuringUnits] = useState<MeasuringUnit[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [discountTypeOptions, setDiscountTypeOptions] = useState<Array<{ label: string; value: string }>>([
    { label: "Percentage", value: "percentage" },
    { label: "Flat Amount", value: "fixed" },
  ]);
  const [taxOptions, setTaxOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);

  // Initialize productData with defaults if not set
  useEffect(() => {
    if (!productData) {
     setProductData({
  type: "Regular",
  isVeg: true,
  status: "active",
  includesTax: true,
  eligibleForDiscount: true,
  isAddon: false,
});
    }
  }, [productData, setProductData]);

  // Load dropdown options from API
  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      try {
        const toArray = (value: any, nestedKey?: string): any[] => {
          if (Array.isArray(value)) return value;
          if (nestedKey && Array.isArray(value?.[nestedKey])) return value[nestedKey];
          if (Array.isArray(value?.data)) return value.data;
          if (nestedKey && Array.isArray(value?.data?.[nestedKey])) return value.data[nestedKey];
          return [];
        };

        const [categoriesRes, brandsRes, tagsRes, unitsRes, taxesRes, discountsRes] = await Promise.allSettled([
          getCategories({ status: 'active' }),
          getBrands({ status: 'active' }),
          getTags({ status: 'active' }),
          getMeasuringUnits(),
          getTaxes(),
          getDiscounts({ status: "active" }),
        ]);

        if (categoriesRes.status === "fulfilled" && categoriesRes.value.success && categoriesRes.value.data) {
          setCategories(categoriesRes.value.data.categories);
        }
        if (brandsRes.status === "fulfilled" && brandsRes.value.success && brandsRes.value.data) {
          setBrands(brandsRes.value.data.brands);
        }
        if (tagsRes.status === "fulfilled" && tagsRes.value.success && tagsRes.value.data) {
          setTags(tagsRes.value.data.tags);
        }
        if (unitsRes.status === "fulfilled" && unitsRes.value.success && unitsRes.value.data) {
          setMeasuringUnits(unitsRes.value.data.measuringUnits || []);
        }
        if (taxesRes.status === "fulfilled" && taxesRes.value.success) {
          const fetchedTaxes = toArray(taxesRes.value.data, "taxes");
          const normalizedTaxes = fetchedTaxes.filter(
            (tax) => tax?.id && tax?.name
          ).map((tax) => ({
            ...tax,
            id: String(tax.id),
          }));
          const activeTaxes = normalizedTaxes.filter(
            (tax) => String(tax.status || "").trim().toLowerCase() === "active"
          );
          const resolvedTaxes = activeTaxes.length > 0 ? activeTaxes : normalizedTaxes;
          setTaxes(resolvedTaxes);
          setTaxOptions(
            resolvedTaxes.map((tax) => ({
              label: `${tax.name} (${tax.percentage}%)`,
              value: String(tax.id),
            }))
          );
        // } else if (taxesRes.status === "fulfilled" && !taxesRes.value.success) {
        //   console.warn("Taxes API returned unsuccessful response:", taxesRes.value.error);
        //   setTaxes([]);
        // } else if (taxesRes.status === "rejected") {
        //   console.error("Taxes API request failed:", taxesRes.reason);
        //   setTaxes([]);
        }

        // if (taxesRes.status === "fulfilled" && (!taxesRes.value.success || toArray(taxesRes.value.data, "taxes").length === 0)) {
        //   setTaxOptions([]);
        // }
        if (discountsRes.status === "fulfilled" && discountsRes.value.success && discountsRes.value.data) {
          const valueTypes = Array.from(new Set((discountsRes.value.data || []).map((d) => d.valueType)));
          if (valueTypes.length > 0) {
            setDiscountTypeOptions(
              valueTypes.map((type) => ({
                label: type === "Fixed" ? "Flat Amount" : type,
                value: type.toLowerCase(),
              })),
            );
          }
        }
      } catch (error) {
        console.error('Error loading dropdown options:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  // Reconcile edit-mode values with loaded dynamic option values.
  useEffect(() => {
    if (!productData) return;

    const updates: Record<string, any> = {};

    if ((!productData.tagId || productData.tagId === "") && Array.isArray(productData.tags) && productData.tags.length > 0) {
      updates.tagId = productData.tags[0]?.id || "";
    }

    if (productData.measuringUnit && measuringUnits.length > 0) {
      const raw = String(productData.measuringUnit).trim().toLowerCase();
      const exact = measuringUnits.find((u) => String(u.unit).toLowerCase() === raw);
      const bySymbol = measuringUnits.find((u) => String(u.symbol || "").toLowerCase() === raw);
      const normalized = exact?.unit || bySymbol?.unit || productData.measuringUnit;
      if (normalized !== productData.measuringUnit) {
        updates.measuringUnit = normalized;
      }
    }

    if (productData.discountType && discountTypeOptions.length > 0) {
      const raw = String(productData.discountType).trim().toLowerCase();
      const normalizedRaw = raw === "flat" || raw === "flat amount" ? "fixed" : raw;
      const matched = discountTypeOptions.find((opt) => opt.value.toLowerCase() === normalizedRaw);
      if (matched && matched.value !== productData.discountType) {
        updates.discountType = matched.value;
      }
    }

    if (productData.taxId && taxOptions.length > 0) {
      const normalizedTaxId = String(productData.taxId);
      const taxExists = taxOptions.some((opt) => opt.value === normalizedTaxId);
      if (!taxExists) {
        updates.taxId = "";
      } else if (normalizedTaxId !== productData.taxId) {
        updates.taxId = normalizedTaxId;
      }
    }

    if (Object.keys(updates).length > 0) {
      setProductData((prev: any) => ({ ...prev, ...updates }));
    }
  }, [productData, measuringUnits, discountTypeOptions, taxOptions, setProductData]);

  // Load sub-categories based on selected category
  useEffect(() => {
    const categoryId = productData?.categoryId;

    if (!categoryId) {
      setSubCategories([]);
      if (productData?.subCategoryId) {
        setProductData((prev: any) => ({
          ...prev,
          subCategoryId: "",
        }));
      }
      return;
    }

    const loadSubCategories = async () => {
      setLoadingSubCategories(true);
      try {
        const response = await getSubCategoriesByCategory(categoryId, {
          status: "active",
        });

        if (response.success && response.data) {
          const nextSubCategories = response.data.subCategories || [];
          setSubCategories(nextSubCategories);

          // Reset stale sub-category when switching category
          if (
            productData?.subCategoryId &&
            !nextSubCategories.some((sub) => sub.id === productData.subCategoryId)
          ) {
            setProductData((prev: any) => ({
              ...prev,
              subCategoryId: "",
            }));
          }
        } else {
          setSubCategories([]);
        }
      } catch (error) {
        console.error("Error loading sub-categories:", error);
        setSubCategories([]);
      } finally {
        setLoadingSubCategories(false);
      }
    };

    void loadSubCategories();
  }, [productData?.categoryId, productData?.subCategoryId, setProductData]);
  const handleInputChange = (field: string, value: any) => {
    setProductData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleValidateAndNext = () => {
    // Basic validation
    if (!productData?.name?.trim()) {
      alert('Product Name is required');
      return;
    }
    if (!productData?.categoryId) {
      alert('Category is required');
      return;
    }
    if (!productData?.shortCode?.trim()) {
      alert('POS Short Code is required');
      return;
    }
    onNext();
  };

  return (
    <div className="p-3 bg-bb-bg min-h-screen">
      {/* Form Card */}
      <div className="bg-bb-bg border rounded-xl p-3">
        <h2 className="font-semibold mb-4">Product Details</h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upload Image */}
          <div>
            <label className="text-sm font-medium">
              Product Image
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png, image/jpeg"
              multiple
              className="hidden"
              disabled={readOnly}
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  handleInputChange('imageFile', files[0]);
                }
              }}
            />
            <div className="mt-2 border-2 border-dashed rounded-lg p-4 text-center bg-white">
              {productData?.imageFile ? (
                <div className="relative">
                  {(() => {
                    const imageSrc =
                      productData.imageFile instanceof File
                        ? URL.createObjectURL(productData.imageFile)
                        : String(productData.imageFile);

                    return (
                      <img
                        src={imageSrc}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                    );
                  })()}
                  {!readOnly && (
                    <button
                      type="button"
                      className="text-xs text-bb-primary underline"
                      onClick={() => fileRef.current?.click()}
                    >
                      Change Image
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="bg-yellow-400 text-sm px-4 py-2 rounded disabled:opacity-50"
                    onClick={() => fileRef.current?.click()}
                    disabled={readOnly}
                  >
                    Upload Image
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    (400×280 to 600×300 px. PNG, JPG, JPEG. More images can be added in Step 5.)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Type */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium">
                Product Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4 mt-1 text-sm">
                <label>
                  <input
                    type="radio"
                    name="type"
                    value="Regular"
                    checked={productData?.type === 'Regular'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    disabled={readOnly}
                  />{' '}
                  Regular
                </label>
                <label>
                  <input
                    type="radio"
                    name="type"
                    value="Combo"
                    checked={productData?.type === 'Combo'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    disabled={readOnly}
                  />{' '}
                  Combo
                </label>
                <label>
                  <input
                    type="radio"
                    name="type"
                    value="Retail"
                    checked={productData?.type === 'Retail'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    disabled={readOnly}
                  />{' '}
                  Retail
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Product Name"
                required
                value={productData?.name || ''}
                onChange={(value: string) => handleInputChange('name', value)}
                disabled={readOnly}
              />
            </div>

            <Input
              label="SKU Code"
              value={productData?.sku || ''}
              onChange={(value: string) => handleInputChange('sku', value)}
              disabled={readOnly}
            />

            {/* Barcode */}
            <div className="space-y-1">
              <label className="font-bold text-sm">Barcode</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={productData?.barcode || ''}
                  placeholder="Enter barcode or auto-generate"
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  disabled={readOnly}
                  className={`flex-1 border rounded-md px-3 py-2 bg-bb-bg text-sm ${
                    readOnly ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    productData?.barcode && !isValidBarcode(productData.barcode)
                      ? 'border-red-400'
                      : ''
                  }`}
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleInputChange('barcode', generateEAN13())}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-yellow-400 rounded hover:bg-yellow-500 shrink-0"
                    title="Generate EAN-13 barcode"
                  >
                    <RefreshCw size={14} />
                    Generate
                  </button>
                )}
              </div>
              {productData?.barcode && !isValidBarcode(productData.barcode) && (
                <p className="text-xs text-red-500">
                  Invalid barcode. Use 13-digit EAN-13 or 4-48 alphanumeric characters.
                </p>
              )}
              {productData?.barcode && isValidBarcode(productData.barcode) && (
                <div className="mt-2">
                  <BarcodeDisplay
                    value={productData.barcode}
                    height={40}
                    width={1.5}
                    showDownload={readOnly}
                    productName={productData?.name}
                  />
                </div>
              )}
            </div>

            <Select
              label="Category"
              required
              value={productData?.categoryId || ''}
              onChange={(value: string) => {
                handleInputChange('categoryId', value);
                handleInputChange('subCategoryId', '');
              }}
              options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
              disabled={readOnly || loading}
            />

            <Select
              label="Sub-Category"
              value={productData?.subCategoryId || ''}
              onChange={(value: string) => handleInputChange('subCategoryId', value)}
              options={subCategories.map((subCategory) => ({
                label: subCategory.name,
                value: subCategory.id,
              }))}
              disabled={readOnly || loadingSubCategories || !productData?.categoryId}
            />

            <Select
              label="Brand"
              value={productData?.brandId || ''}
              onChange={(value: string) => handleInputChange('brandId', value)}
              options={brands.map((brand) => ({ label: brand.name, value: brand.id }))}
              disabled={readOnly || loading}
            />

            <Select
              label="Tags"
              value={productData?.tagId || ''}
              onChange={(value: string) => handleInputChange('tagId', value)}
              options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
              disabled={readOnly || loading}
            />

            <Input
              label="POS Short Code"
              required
              value={productData?.shortCode || ''}
              onChange={(value: string) => handleInputChange('shortCode', value)}
              disabled={readOnly}
            />

            <Input
              label="HSN Code"
              value={productData?.hsnCode || ''}
              onChange={(value: string) => handleInputChange('hsnCode', value)}
              disabled={readOnly}
            />

            <Input
              label="Preparation Time (mins)"
              type="number"
              value={productData?.preparationTime?.toString() || ''}
              onChange={(value: string) => handleInputChange('preparationTime', value ? parseInt(value) : undefined)}
              disabled={readOnly}
            />

            <Input
              label="Serves Count"
              type="number"
              value={productData?.servesCount?.toString() || ''}
              onChange={(value: string) => handleInputChange('servesCount', value ? parseInt(value) : undefined)}
              disabled={readOnly}
            />
{/* Display Order */}
<Input
  label="Display Order"
  value={productData?.displayOrder?.toString() ?? ""}
  onChange={(value: string) => {
    const trimmed = value.trim();
    const parsed = Number(trimmed);
    handleInputChange("displayOrder", trimmed === "" || Number.isNaN(parsed) ? "" : parsed);
  }}
  disabled={readOnly}
/>

{/* Measuring Unit */}
<Select
  label="Measuring Unit"
  required
  value={productData?.measuringUnit || ""}
  onChange={(value: string) => handleInputChange("measuringUnit", value)}
  options={measuringUnits.map((unit) => ({
    label: unit.symbol ? `${unit.unit} (${unit.symbol})` : unit.unit,
    value: unit.unit,
  }))}
  disabled={readOnly || loading}
/>

{/* Includes Tax */}
<div className="flex items-center gap-4">
  <label className="text-sm font-medium">
    Includes Tax <span className="text-red-500">*</span>
  </label>

  <label>
    <input
      type="radio"
      name="includesTax"
      checked={productData?.includesTax === true}
      onChange={() => handleInputChange("includesTax", true)}
      disabled={readOnly}
    />{" "}
    Yes
  </label>

  <label>
    <input
      type="radio"
      name="includesTax"
      checked={productData?.includesTax === false}
      onChange={() => handleInputChange("includesTax", false)}
      disabled={readOnly}
    />{" "}
    No
  </label>
</div>

{/* Taxes */}
<Select
  label="Taxes"
  required
  value={productData?.taxId || ""}
  onChange={(value: string) => handleInputChange("taxId", value)}
  options={taxOptions}
  disabled={readOnly || loading}
/>

{/* Eligible For Discount */}
<div className="flex items-center gap-4">
  <label className="text-sm font-medium">Eligible for Discount</label>

  <label>
    <input
      type="radio"
      name="eligibleForDiscount"
      checked={productData?.eligibleForDiscount === true}
      onChange={() => handleInputChange("eligibleForDiscount", true)}
      disabled={readOnly}
    />{" "}
    Yes
  </label>

  <label>
    <input
      type="radio"
      name="eligibleForDiscount"
      checked={productData?.eligibleForDiscount === false}
      onChange={() => handleInputChange("eligibleForDiscount", false)}
      disabled={readOnly}
    />{" "}
    No
  </label>
</div>

{/* Discount Type */}
<Select
  label="Discount Type"
  value={productData?.discountType || ""}
  onChange={(value: string) => handleInputChange("discountType", value)}
  options={discountTypeOptions}
  disabled={readOnly || loading}
/>

{/* Mark as Addon */}
<div className="flex items-center gap-2 mt-2">
  <input
    type="checkbox"
    checked={productData?.isAddon || false}
    onChange={(e) => handleInputChange("isAddon", e.target.checked)}
    disabled={readOnly}
  />

  <label className="text-sm">Mark as Addon</label>
</div>
            {/* Is Veg Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Is Vegetarian?</label>
              <input
                type="checkbox"
                checked={productData?.isVeg ?? true}
                onChange={(e) => handleInputChange('isVeg', e.target.checked)}
                disabled={readOnly}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <Textarea
            label="Description"
            placeholder="Add Description..."
            value={productData?.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
        </div>

        {/* Footer Buttons */}
        {!readOnly && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              className="border px-4 py-2 rounded border-black"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-yellow-400 px-4 py-2 rounded"
              onClick={handleValidateAndNext}
            >
              Save & Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
