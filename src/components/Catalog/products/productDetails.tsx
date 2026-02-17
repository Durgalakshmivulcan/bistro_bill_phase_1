import { useRef, useEffect, useState } from "react";
import Input from "../../form/Input";
import Select from "../../form/Select";
import Toggle from "../../form/Toggle";
import { ChevronRight, RefreshCw } from "lucide-react";
import Textarea from "../../form/Textarea";
import { getCategories, getBrands, getTags } from "../../../services/catalogService";
import type { Category, Brand, Tag } from "../../../services/catalogService";
import { generateEAN13, isValidBarcode } from "../../../utils/barcode";
import BarcodeDisplay from "./BarcodeDisplay";

const ProductDetails = ({ productData, setProductData, onNext, readOnly }: any) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize productData with defaults if not set
  useEffect(() => {
    if (!productData) {
      setProductData({
        type: 'Regular',
        isVeg: true,
        status: 'active',
      });
    }
  }, [productData, setProductData]);

  // Load dropdown options from API
  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      try {
        const [categoriesRes, brandsRes, tagsRes] = await Promise.all([
          getCategories({ status: 'active' }),
          getBrands({ status: 'active' }),
          getTags({ status: 'active' }),
        ]);

        if (categoriesRes.success && categoriesRes.data) {
          setCategories(categoriesRes.data.categories);
        }
        if (brandsRes.success && brandsRes.data) {
          setBrands(brandsRes.data.brands);
        }
        if (tagsRes.success && tagsRes.data) {
          setTags(tagsRes.data.tags);
        }
      } catch (error) {
        console.error('Error loading dropdown options:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

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
                  <img
                    src={URL.createObjectURL(productData.imageFile)}
                    alt="Preview"
                    className="w-full h-24 object-cover rounded mb-2"
                  />
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
              onChange={(value: string) => handleInputChange('categoryId', value)}
              options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
              disabled={readOnly || loading}
            />

            <Select
              label="Sub-Category"
              value={productData?.subCategoryId || ''}
              onChange={(value: string) => handleInputChange('subCategoryId', value)}
              options={[]}
              disabled={readOnly}
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
