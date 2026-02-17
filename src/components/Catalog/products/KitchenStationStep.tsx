import { useState, useEffect } from "react";
import { ChefHat } from "lucide-react";
import { getKitchens, getBranches, Kitchen, Branch } from "../../../services/branchService";

const KitchenStationStep = ({
  productData,
  setProductData,
  readOnly,
  onNext,
  onPrev,
}: any) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedKitchenIds, setSelectedKitchenIds] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingKitchens, setLoadingKitchens] = useState(false);

  // Initialize from productData
  useEffect(() => {
    if (productData?.kitchens && productData.kitchens.length > 0) {
      setSelectedKitchenIds(productData.kitchens.map((k: any) => k.id));
    } else if (productData?.kitchenIds && productData.kitchenIds.length > 0) {
      setSelectedKitchenIds(productData.kitchenIds);
    }
  }, [productData?.kitchens, productData?.kitchenIds]);

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const response = await getBranches({ status: "Active" });
        if (response.success && response.data) {
          setBranches(response.data.branches);
          if (response.data.branches.length > 0) {
            // If product has kitchen assignments, pick the branch from the first kitchen
            if (productData?.kitchens && productData.kitchens.length > 0) {
              const firstBranchId = productData.kitchens[0].branchId;
              if (response.data.branches.some((b: Branch) => b.id === firstBranchId)) {
                setSelectedBranchId(firstBranchId);
              } else {
                setSelectedBranchId(response.data.branches[0].id);
              }
            } else {
              setSelectedBranchId(response.data.branches[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error loading branches:", error);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // Fetch kitchens when branch changes
  useEffect(() => {
    if (!selectedBranchId) return;

    const fetchKitchens = async () => {
      setLoadingKitchens(true);
      try {
        const response = await getKitchens(selectedBranchId, "active");
        if (response.success && response.data) {
          setKitchens(response.data.kitchens);
        }
      } catch (error) {
        console.error("Error loading kitchens:", error);
      } finally {
        setLoadingKitchens(false);
      }
    };
    fetchKitchens();
  }, [selectedBranchId]);

  const toggleKitchen = (kitchenId: string) => {
    if (readOnly) return;
    const updated = selectedKitchenIds.includes(kitchenId)
      ? selectedKitchenIds.filter((id) => id !== kitchenId)
      : [...selectedKitchenIds, kitchenId];
    setSelectedKitchenIds(updated);
    setProductData((prev: any) => ({
      ...prev,
      kitchenIds: updated,
    }));
  };

  const isCombo = productData?.type === "Combo";

  return (
    <div className="bg-bb-bg border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <ChefHat size={18} className="text-bb-textSoft" />
        <h2 className="font-semibold">Kitchen Station Assignment</h2>
      </div>

      <p className="text-sm text-bb-textSoft mb-5">
        Assign this product to one or more kitchen stations for KOT routing.
        {isCombo && (
          <span className="block mt-1 text-bb-primary font-medium">
            Combo products can be assigned to multiple kitchens.
          </span>
        )}
      </p>

      {/* Branch Selector */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-bb-text mb-1.5">
          Branch
        </label>
        <select
          className="w-full max-w-xs px-3 py-2 text-sm rounded-md border border-gray-300 bg-white disabled:opacity-60"
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          disabled={readOnly || loadingBranches || branches.length === 0}
        >
          {loadingBranches ? (
            <option value="">Loading branches...</option>
          ) : branches.length === 0 ? (
            <option value="">No branches available</option>
          ) : (
            branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Kitchen Station Selection */}
      <div>
        <label className="block text-sm font-medium text-bb-text mb-2">
          Kitchen Stations
        </label>

        {loadingKitchens ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : kitchens.length === 0 ? (
          <p className="text-sm text-bb-textSoft italic py-4">
            No kitchens found for this branch. Please add kitchens in Business
            Settings.
          </p>
        ) : (
          <div className="space-y-2">
            {kitchens.map((kitchen) => {
              const isSelected = selectedKitchenIds.includes(kitchen.id);
              return (
                <label
                  key={kitchen.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-colors ${
                    isSelected
                      ? "bg-yellow-50 border-bb-primary"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  } ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleKitchen(kitchen.id)}
                    disabled={readOnly}
                    className="w-4 h-4 accent-yellow-400"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-bb-text">
                      {kitchen.name}
                    </span>
                    {kitchen.description && (
                      <span className="block text-xs text-bb-textSoft truncate">
                        {kitchen.description}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      kitchen.status === "active"
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {kitchen.status === "active" ? "Active" : "Inactive"}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Summary */}
      {selectedKitchenIds.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-bb-textSoft uppercase">
            Assigned Kitchens ({selectedKitchenIds.length})
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {selectedKitchenIds.map((id) => {
              const kitchen = kitchens.find((k) => k.id === id);
              const kitchenFromProduct = productData?.kitchens?.find(
                (k: any) => k.id === id
              );
              const name =
                kitchen?.name || kitchenFromProduct?.name || id.slice(0, 8);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 rounded px-2 py-0.5"
                >
                  <ChefHat size={10} />
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6">
        {onPrev && (
          <button
            onClick={onPrev}
            className="border border-black px-4 py-2 rounded"
          >
            Previous
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default KitchenStationStep;
