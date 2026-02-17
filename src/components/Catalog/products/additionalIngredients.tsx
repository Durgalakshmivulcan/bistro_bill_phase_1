import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../form/Input";
import Select from "../../form/Select";
import Modal from "../../../components/ui/Modal";
import { upsertProductNutrition } from "../../../services/catalogService";

import tickImg from "../../../assets/tick.png";

const AdditionalIngredients = ({ onPrev, onNext, productData }: any) => {
  const navigate = useNavigate();

  const [form, setForm] = useState<any>({});
  const [successOpen, setSuccessOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [key]: value }));

  /* FINAL SAVE */
  const handleCreate = async () => {
    const productId = productData?.id;

    if (productId) {
      setSaving(true);
      try {
        // Build vitamins and minerals objects from form fields
        const vitamins: Record<string, string> = {};
        const minerals: Record<string, string> = {};
        for (let i = 1; i <= 5; i++) {
          if (form[`vitamin${i}`]) vitamins[form[`vitamin${i}`]] = form[`vitamin${i}Amt`] || "0";
          if (form[`mineral${i}`]) minerals[form[`mineral${i}`]] = form[`mineral${i}Amt`] || "0";
        }

        await upsertProductNutrition(productId, {
          calories: form.kcal ? parseFloat(form.kcal) : undefined,
          protein: form.protein ? parseFloat(form.protein) : undefined,
          carbs: form.carbs ? parseFloat(form.carbs) : undefined,
          fat: form.totalFat ? parseFloat(form.totalFat) : undefined,
          fiber: form.fiber ? parseFloat(form.fiber) : undefined,
          sugar: form.sugar ? parseFloat(form.sugar) : undefined,
          sodium: form.sodium ? parseFloat(form.sodium) : undefined,
          vitamins: Object.keys(vitamins).length > 0 ? vitamins : undefined,
          minerals: Object.keys(minerals).length > 0 ? minerals : undefined,
        });
      } catch (err) {
        console.error("Failed to save nutrition data:", err);
      } finally {
        setSaving(false);
      }
    }

    // Show success and navigate
    setSuccessOpen(true);
    setTimeout(() => {
      setSuccessOpen(false);
      if (onNext) {
        onNext();
      } else {
        navigate("/catalog/products");
      }
    }, 2000);
  };

  return (
    <div className="bg-bb-bg border rounded-xl p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between my-3">
        <h2 className="font-semibold text-lg">
          Additional Ingredients
        </h2>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            onChange={(e) =>
              update("seasonalMandatory", e.target.checked)
            }
          />
          <label className="text-sm">
            Show All Mandatory Fields
          </label>
        </div>
      </div>

      {/* FORM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BASIC NUTRITION */}
        <Select
          label="Portion Size Unit"
          onChange={(v) => update("portionUnit", v)}
        />
        <Input
          label="Kilo Calories"
          onChange={(v) => update("kcal", v)}
        />

        <Input
          label="Carbohydrates (g)"
          onChange={(v) => update("carbs", v)}
        />
        <Input
          label="Sugar (g)"
          onChange={(v) => update("sugar", v)}
        />

        <Input
          label="Protein (g)"
          onChange={(v) => update("protein", v)}
        />
        <Input
          label="Lipid (g)"
          onChange={(v) => update("lipid", v)}
        />

        <Input
          label="Sodium (mg)"
          onChange={(v) => update("sodium", v)}
        />
        <Input
          label="Total Fat (g)"
          onChange={(v) => update("totalFat", v)}
        />

        <Input
          label="Monounsaturated Fatty Acids (g)"
          onChange={(v) => update("monoFat", v)}
        />
        <Input
          label="Polyunsaturated Fatty Acids (g)"
          onChange={(v) => update("polyFat", v)}
        />

        <Input
          label="Saturated Fatty Acids (g)"
          onChange={(v) => update("satFat", v)}
        />
        <Input
          label="Trans Fat (g)"
          onChange={(v) => update("transFat", v)}
        />

        <Input
          label="Cholesterol (mg)"
          onChange={(v) => update("cholesterol", v)}
        />
        <Input
          label="Fiber (g)"
          onChange={(v) => update("fiber", v)}
        />

        {/* PROPERTIES */}
        <Select
          label="Spice Level"
          onChange={(v) => update("spice", v)}
        />
        <Select
          label="Sweet Level"
          onChange={(v) => update("sweet", v)}
        />

        <Select
          label="Bone Property"
          onChange={(v) => update("bone", v)}
        />
        <Select
          label="Gravy Property"
          onChange={(v) => update("gravy", v)}
        />

        {/* ACCOMPANIMENTS */}
        <Input
          label="Accompaniments"
          onChange={(v) =>
            update("accompaniments", v)
          }
        />

        <div className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            onChange={(e) =>
              update(
                "containsSeasonal",
                e.target.checked
              )
            }
          />
          <label className="text-sm">
            Contains Seasonal Ingredients
          </label>
        </div>

        {/* ADDITIONAL NUTRITION */}
        <Input
          label="Polyols (g)"
          onChange={(v) =>
            update("polyols", v)
          }
        />
        <Input
          label="Polydextrose (g)"
          onChange={(v) =>
            update("polydextrose", v)
          }
        />

        <Input
          label="Caffeine (g)"
          onChange={(v) =>
            update("caffeine", v)
          }
        />
        <Input
          label="Artificial Sweetener (g)"
          onChange={(v) =>
            update("artSweetener", v)
          }
        />

        <Input
          label="Mono Sodium Glutamate (g)"
          onChange={(v) => update("msg", v)}
        />

        {/* MINERALS */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={`mineral-${i}`} className="contents">
            <Input
              label={`${i}. Mineral Name`}
              onChange={(v) =>
                update(`mineral${i}`, v)
              }
            />
            <Input
              label={`${i}. Mineral Amount (mg)`}
              onChange={(v) =>
                update(
                  `mineral${i}Amt`,
                  v
                )
              }
            />
          </div>
        ))}

        {/* VITAMINS */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={`vitamin-${i}`} className="contents">
            <Input
              label={`${i}. Vitamin Name`}
              onChange={(v) =>
                update(`vitamin${i}`, v)
              }
            />
            <Input
              label={`${i}. Vitamin Amount (mg)`}
              onChange={(v) =>
                update(
                  `vitamin${i}Amt`,
                  v
                )
              }
            />
          </div>
        ))}

        {/* INGREDIENT DETAILS */}
        <Input
          label="Star Ingredients"
          onChange={(v) =>
            update("starIngredients", v)
          }
        />
        <Input
          label="Main Ingredients"
          onChange={(v) =>
            update("mainIngredients", v)
          }
        />

        <Input
          label="Primary Health Benefits"
          onChange={(v) =>
            update("primaryBenefits", v)
          }
        />
        <Input
          label="Secondary Health Benefits"
          onChange={(v) =>
            update("secondaryBenefits", v)
          }
        />

        <Input
          label="Lifestyle Diet Info"
          onChange={(v) =>
            update("dietInfo", v)
          }
        />
        <Input
          label="Dish Preparation Style"
          onChange={(v) =>
            update("prepStyle", v)
          }
        />

        <Input
          label="Manufacturing Details"
          onChange={(v) =>
            update("manufacturing", v)
          }
        />
        <Input
          label="Storage Information"
          onChange={(v) =>
            update("storage", v)
          }
        />

        <Input
          label="Shelf Life"
          onChange={(v) =>
            update("shelfLife", v)
          }
        />
        <Select
          label="Shelf Life Unit"
          onChange={(v) =>
            update("shelfUnit", v)
          }
        />

        <Input
          label="Pieces per Kg (Min)"
          onChange={(v) =>
            update("piecesMin", v)
          }
        />
        <Input
          label="Pieces per Kg (Max)"
          onChange={(v) =>
            update("piecesMax", v)
          }
        />
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onPrev}
          className="border px-4 py-2 rounded"
        >
          Previous
        </button>
        <button
          className="bg-yellow-400 px-6 py-2 rounded disabled:opacity-50"
          onClick={handleCreate}
          disabled={saving}
        >
          {saving ? "Saving..." : onNext ? "Save & Next" : "Create"}
        </button>
      </div>

      {/* 🔵 SUCCESS MODAL */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          Product Created!
        </h2>

        <div className="flex justify-center mb-6">
          <img
            src={tickImg}
            alt="Success"
            className="w-16 h-16"
          />
        </div>

        <p className="text-sm text-gray-600">
          Your product has been successfully saved.
        </p>
      </Modal>
    </div>
  );
};

export default AdditionalIngredients;
