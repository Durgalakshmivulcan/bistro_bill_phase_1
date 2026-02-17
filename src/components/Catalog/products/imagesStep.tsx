import { useState, useRef, useCallback, DragEvent } from "react";
import { Upload, X, Star, GripVertical, ImageIcon } from "lucide-react";
import Swal from "sweetalert2";
import { compressImages } from "../../../utils/imageCompression";

interface LocalImage {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface ImagesStepProps {
  productData: any;
  setProductData: (fn: (prev: any) => any) => void;
  readOnly?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

const ImagesStep = ({ productData, setProductData, readOnly, onNext, onPrev }: ImagesStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<LocalImage[]>(() => {
    // Initialize from productData if editing existing product
    const existing: LocalImage[] = (productData?.images || []).map((img: any, idx: number) => ({
      id: img.id || `existing-${idx}`,
      file: null as any,
      preview: img.url || "",
      isPrimary: img.isPrimary ?? idx === 0,
      sortOrder: img.sortOrder ?? idx,
    }));
    // Also include any locally added imageFiles
    const localFiles: LocalImage[] = (productData?.imageFiles || []).map((entry: any) => ({
      id: entry.id,
      file: entry.file,
      preview: entry.preview,
      isPrimary: entry.isPrimary,
      sortOrder: entry.sortOrder,
    }));
    return [...existing, ...localFiles].sort((a, b) => a.sortOrder - b.sortOrder);
  });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const syncToProductData = useCallback(
    (updated: LocalImage[]) => {
      setProductData((prev: any) => ({
        ...prev,
        imageFiles: updated.map((img) => ({
          id: img.id,
          file: img.file,
          preview: img.preview,
          isPrimary: img.isPrimary,
          sortOrder: img.sortOrder,
        })),
      }));
    },
    [setProductData]
  );

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (fileArray.length === 0) return;

    // Compress images before adding
    const compressed = await compressImages(fileArray);

    const newImages: LocalImage[] = compressed.map((file, idx) => ({
      id: `local-${Date.now()}-${idx}`,
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0 && idx === 0, // First image is primary if none exist
      sortOrder: images.length + idx,
    }));

    const updated = [...images, ...newImages];
    setImages(updated);
    syncToProductData(updated);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: "Delete Image",
      text: "Are you sure you want to remove this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    }).then((result) => {
      if (result.isConfirmed) {
        const deleted = images.find((img) => img.id === id);
        let updated = images.filter((img) => img.id !== id);

        // Revoke preview URL for local files
        if (deleted?.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(deleted.preview);
        }

        // If deleted image was primary, set first remaining as primary
        if (deleted?.isPrimary && updated.length > 0) {
          updated = updated.map((img, idx) => ({
            ...img,
            isPrimary: idx === 0,
          }));
        }

        // Recalculate sort orders
        updated = updated.map((img, idx) => ({ ...img, sortOrder: idx }));

        setImages(updated);
        syncToProductData(updated);
      }
    });
  };

  const handleSetPrimary = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    setImages(updated);
    syncToProductData(updated);
  };

  // Drag and drop reordering
  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDragEnd = () => {
    if (dragIdx === null || dragOverIdx === null || dragIdx === dragOverIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }

    const updated = [...images];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(dragOverIdx, 0, moved);

    // Recalculate sort orders
    const reordered = updated.map((img, idx) => ({ ...img, sortOrder: idx }));

    setImages(reordered);
    syncToProductData(reordered);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDropZone = (e: DragEvent) => {
    e.preventDefault();
    if (readOnly) return;
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleDropZoneDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="bg-bb-bg border rounded-xl p-6">
      {/* Header */}
      <h2 className="font-semibold mb-2">Product Images</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload multiple images for your product. Drag to reorder. The primary
        image is used as the thumbnail across the catalog.
      </p>

      {/* Upload Area */}
      {!readOnly && (
        <div
          className="border-2 border-dashed border-bb-primary/50 rounded-lg p-8 text-center bg-bb-primary/5 mb-6 cursor-pointer hover:bg-bb-primary/10 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDropZone}
          onDragOver={handleDropZoneDragOver}
        >
          <Upload size={32} className="mx-auto text-bb-textSoft mb-2" />
          <p className="text-sm font-medium text-bb-text">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-bb-textSoft mt-1">
            PNG, JPG, JPEG up to 5MB each. Multiple files supported.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </div>
      )}

      {/* Image Gallery Grid */}
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-bb-textSoft">
          <ImageIcon size={48} className="mb-3 opacity-40" />
          <p className="text-sm">No images uploaded yet</p>
          {!readOnly && (
            <p className="text-xs mt-1">
              Upload images using the area above
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img, idx) => (
            <div
              key={img.id}
              draggable={!readOnly}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-lg border-2 overflow-hidden bg-white transition-all ${
                img.isPrimary
                  ? "border-bb-primary shadow-md"
                  : "border-gray-200"
              } ${
                dragOverIdx === idx && dragIdx !== idx
                  ? "border-blue-400 scale-105"
                  : ""
              } ${dragIdx === idx ? "opacity-50" : ""}`}
            >
              {/* Image */}
              <div className="aspect-[4/3] relative">
                <img
                  src={img.preview}
                  alt={`Product image ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Drag handle overlay */}
                {!readOnly && (
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 rounded p-0.5 cursor-grab active:cursor-grabbing">
                      <GripVertical size={14} className="text-white" />
                    </div>
                  </div>
                )}

                {/* Delete button */}
                {!readOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(img.id);
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 rounded-full p-0.5"
                  >
                    <X size={14} className="text-white" />
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs text-bb-textSoft">
                  {img.isPrimary ? "Primary" : `#${idx + 1}`}
                </span>
                {!readOnly && (
                  <button
                    onClick={() => handleSetPrimary(img.id)}
                    title={
                      img.isPrimary
                        ? "Primary image"
                        : "Set as primary image"
                    }
                    className={`p-0.5 rounded ${
                      img.isPrimary
                        ? "text-bb-primary"
                        : "text-gray-300 hover:text-bb-primary"
                    }`}
                  >
                    <Star
                      size={16}
                      fill={img.isPrimary ? "currentColor" : "none"}
                    />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image count */}
      {images.length > 0 && (
        <p className="text-xs text-bb-textSoft mt-3">
          {images.length} image{images.length !== 1 ? "s" : ""} uploaded
        </p>
      )}

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        {onPrev && (
          <button
            onClick={onPrev}
            className="border px-4 py-2 rounded border-black"
          >
            Previous
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="bg-yellow-400 px-4 py-2 rounded"
          >
            Save & Next
          </button>
        )}
      </div>
    </div>
  );
};

export default ImagesStep;
