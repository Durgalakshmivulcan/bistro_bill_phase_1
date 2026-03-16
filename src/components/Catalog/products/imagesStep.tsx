import { useEffect, useRef, useState } from "react";
import { ImageIcon, Pencil, Trash2, Upload } from "lucide-react";
import Swal from "sweetalert2";
import { compressImages } from "../../../utils/imageCompression";
import { Channel, getChannels } from "../../../services/settingsService";

interface LocalImage {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface ChannelImageRow {
  id: string;
  channelId: string;
  channelName: string;
  imageId: string;
}

interface ImagesStepProps {
  productData: any;
  setProductData: (fn: (prev: any) => any) => void;
  readOnly?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

const ImagesStep = ({
  productData,
  setProductData,
  readOnly,
  onNext,
  onPrev,
}: ImagesStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelEditFileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<LocalImage[]>(() => {
    const existing: LocalImage[] = (productData?.images || []).map(
      (img: any, idx: number) => ({
        id: img.id || `existing-${idx}`,
        file: null as any,
        preview: img.url || "",
        isPrimary: img.isPrimary ?? idx === 0,
        sortOrder: img.sortOrder ?? idx,
      })
    );

    const localFiles: LocalImage[] = (productData?.imageFiles || []).map(
      (entry: any) => ({
        id: entry.id,
        file: entry.file,
        preview: entry.preview,
        isPrimary: entry.isPrimary,
        sortOrder: entry.sortOrder,
      })
    );

    const merged = [...existing, ...localFiles].sort(
      (a, b) => a.sortOrder - b.sortOrder
    );

    return merged.filter(
      (img, idx, arr) => arr.findIndex((x) => x.id === img.id) === idx
    );
  });

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [channelRows, setChannelRows] = useState<ChannelImageRow[]>(
    (productData?.channelImageMappings || []) as ChannelImageRow[]
  );
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [pendingEditRowId, setPendingEditRowId] = useState<string | null>(null);

  useEffect(() => {
    const existing: LocalImage[] = (productData?.images || []).map(
      (img: any, idx: number) => ({
        id: img.id || `existing-${idx}`,
        file: null as any,
        preview: img.url || "",
        isPrimary: img.isPrimary ?? idx === 0,
        sortOrder: img.sortOrder ?? idx,
      })
    );

    const localFiles: LocalImage[] = (productData?.imageFiles || []).map(
      (entry: any, idx: number) => ({
        id: entry.id || `local-${idx}`,
        file: entry.file ?? null,
        preview: entry.preview || "",
        isPrimary: entry.isPrimary ?? false,
        sortOrder: entry.sortOrder ?? existing.length + idx,
      })
    );

    const merged = [...existing, ...localFiles]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter(
        (img, idx, arr) => arr.findIndex((candidate) => candidate.id === img.id) === idx
      );

    setImages(merged);
    setChannelRows((productData?.channelImageMappings || []) as ChannelImageRow[]);
  }, [productData?.images, productData?.imageFiles, productData?.channelImageMappings]);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const response = await getChannels();
        if (response.success && Array.isArray(response.data)) {
          setChannels(response.data.filter((c) => c.status === "active"));
          return;
        }
      } catch (error) {
        console.error("Failed to load channels for image step:", error);
      }

      setChannels([
        { id: "dinein", name: "Dine In", status: "active" },
        { id: "takeaway", name: "Take Away", status: "active" },
        { id: "delivery", name: "Delivery", status: "active" },
        { id: "zomato", name: "Zomato", status: "active" },
        { id: "swiggy", name: "Swiggy", status: "active" },
      ]);
    };

    loadChannels();
  }, []);

  const syncToProductData = (
    updatedImages: LocalImage[],
    updatedRows: ChannelImageRow[]
  ) => {
    setProductData((prev: any) => ({
      ...prev,
      imageFiles: updatedImages.map((img) => ({
        id: img.id,
        file: img.file,
        preview: img.preview,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
      })),
      channelImageMappings: updatedRows,
    }));
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) return;

    const compressed = await compressImages(valid);

    const newImages: LocalImage[] = compressed.map((file, idx) => ({
      id: `local-${Date.now()}-${idx}`,
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0 && idx === 0,
      sortOrder: images.length + idx,
    }));

    const updatedImages = [...images, ...newImages].map((img, idx) => ({
      ...img,
      sortOrder: idx,
    }));

    const updatedRows = channelRows.map((row) => {
      if (!row.imageId && updatedImages.length > 0) {
        return { ...row, imageId: updatedImages[0].id };
      }
      return row;
    });

    setImages(updatedImages);
    setChannelRows(updatedRows);
    syncToProductData(updatedImages, updatedRows);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateGrid = () => {
    if (selectedChannelIds.length === 0) return;

    const fallbackImageId =
      images.find((img) => img.isPrimary)?.id || images[0]?.id || "";

    const selectedChannelMap = new Map(channels.map((c) => [c.id, c]));

    const existingByChannel = new Set(channelRows.map((row) => row.channelId));

    const newRows: ChannelImageRow[] = selectedChannelIds
      .filter((cid) => !existingByChannel.has(cid))
      .map((cid) => ({
        id: `channel-row-${Date.now()}-${cid}`,
        channelId: cid,
        channelName: selectedChannelMap.get(cid)?.name || cid,
        imageId: fallbackImageId,
      }));

    const updatedRows = [...channelRows, ...newRows];
    setChannelRows(updatedRows);
    syncToProductData(images, updatedRows);
  };

  const handleDeleteChannelRow = (rowId: string) => {
    const updatedRows = channelRows.filter((row) => row.id !== rowId);
    setChannelRows(updatedRows);
    syncToProductData(images, updatedRows);
    if (editingRowId === rowId) {
      setEditingRowId(null);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    Swal.fire({
      title: "Delete Image",
      text: "Are you sure you want to remove this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    }).then((result) => {
      if (!result.isConfirmed) return;

      const deleted = images.find((img) => img.id === imageId);
      let updatedImages = images.filter((img) => img.id !== imageId);

      if (deleted?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(deleted.preview);
      }

      if (deleted?.isPrimary && updatedImages.length > 0) {
        updatedImages = updatedImages.map((img, idx) => ({
          ...img,
          isPrimary: idx === 0,
        }));
      }

      updatedImages = updatedImages.map((img, idx) => ({ ...img, sortOrder: idx }));

      const fallbackImageId =
        updatedImages.find((img) => img.isPrimary)?.id || updatedImages[0]?.id || "";

      const updatedRows = channelRows.map((row) => ({
        ...row,
        imageId:
          row.imageId === imageId
            ? fallbackImageId
            : row.imageId,
      }));

      setImages(updatedImages);
      setChannelRows(updatedRows);
      syncToProductData(updatedImages, updatedRows);
    });
  };

  const handleSetPrimary = (imageId: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === imageId,
    }));

    setImages(updatedImages);
    syncToProductData(updatedImages, channelRows);
  };

  const handleChangeRowImage = (rowId: string, imageId: string) => {
    const updatedRows = channelRows.map((row) =>
      row.id === rowId ? { ...row, imageId } : row
    );

    setChannelRows(updatedRows);
    syncToProductData(images, updatedRows);
  };

  const handleUploadForChannel = async (files: FileList | null) => {
    if (!files || files.length === 0 || !pendingEditRowId) return;

    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) return;

    const compressed = await compressImages([valid[0]]);
    const file = compressed[0];

    const newImage: LocalImage = {
      id: `local-${Date.now()}-channel`,
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0,
      sortOrder: images.length,
    };

    const updatedImages = [...images, newImage].map((img, idx) => ({
      ...img,
      sortOrder: idx,
    }));

    const updatedRows = channelRows.map((row) =>
      row.id === pendingEditRowId ? { ...row, imageId: newImage.id } : row
    );

    setImages(updatedImages);
    setChannelRows(updatedRows);
    syncToProductData(updatedImages, updatedRows);

    setPendingEditRowId(null);
    if (channelEditFileInputRef.current) {
      channelEditFileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-bb-bg border border-blue-500 rounded-xl p-4 md:p-6">
      <div className="border-2 border-dashed border-sky-400 p-4">
        <h2 className="font-semibold text-2xl mb-2">images</h2>
        <p className="text-gray-700 mb-4 leading-6">
          Add the item&apos;s base image or image for any specific channel of the item.
          Click on Create Grid after selecting the channels to which the image is
          different from the base image.
        </p>

        {!readOnly && (
          <div
            className="bg-[#FFF2CC] border border-yellow-300 p-3 mb-4 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex items-center gap-2 text-[#5c4b00]">
              <Upload size={16} />
              <span className="font-medium">Upload Image</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>
        )}

        {images.length > 0 && (
          <div className="mb-6">
            <p className="font-semibold mb-2">Base Images</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.id} className="border rounded overflow-hidden bg-white">
                  <div className="aspect-[4/3]">
                    <img
                      src={img.preview}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {!readOnly && (
                    <div className="p-2 flex justify-between items-center gap-2 text-xs">
                      <button
                        className={`px-2 py-1 rounded border ${
                          img.isPrimary
                            ? "bg-yellow-400 border-yellow-500"
                            : "border-gray-300"
                        }`}
                        onClick={() => handleSetPrimary(img.id)}
                      >
                        {img.isPrimary ? "Primary" : "Set Primary"}
                      </button>
                      <button
                        className="text-red-500"
                        onClick={() => handleDeleteImage(img.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-xl font-semibold mb-3">Channel Specific Images</h3>

        <label className="block text-sm font-semibold mb-2">Channel</label>
        <select
          multiple
          disabled={readOnly}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-3 bg-white"
          value={selectedChannelIds}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions).map((o) => o.value);
            setSelectedChannelIds(values);
          }}
        >
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name}
            </option>
          ))}
        </select>

        {!readOnly && (
          <button
            onClick={handleCreateGrid}
            className="w-full border border-gray-300 py-2 rounded mb-4"
          >
            Create Grid
          </button>
        )}

        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="text-left p-3">Channel</th>
                <th className="text-left p-3">Image</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {channelRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">
                    No channel-specific image rows yet.
                  </td>
                </tr>
              ) : (
                channelRows.map((row) => {
                  const rowImage = images.find((img) => img.id === row.imageId);
                  return (
                    <tr key={row.id} className="border-t align-top">
                      <td className="p-3">{row.channelName}</td>
                      <td className="p-3">
                        {rowImage ? (
                          <img
                            src={rowImage.preview}
                            alt={row.channelName}
                            className="w-36 h-20 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-36 h-20 border rounded flex items-center justify-center text-xs text-gray-400">
                            <ImageIcon size={16} className="mr-1" /> No Image
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {readOnly ? null : (
                          <div className="space-y-2">
                            <div className="flex gap-4">
                              <button
                                className="flex items-center gap-1 text-blue-600"
                                onClick={() =>
                                  setEditingRowId(editingRowId === row.id ? null : row.id)
                                }
                              >
                                <Pencil size={14} /> Edit
                              </button>
                              <button
                                className="flex items-center gap-1 text-red-600"
                                onClick={() => handleDeleteChannelRow(row.id)}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>

                            {editingRowId === row.id && (
                              <div className="border rounded p-2 bg-gray-50 space-y-2">
                                <select
                                  className="w-full border rounded px-2 py-1"
                                  value={row.imageId}
                                  onChange={(e) =>
                                    handleChangeRowImage(row.id, e.target.value)
                                  }
                                >
                                  <option value="">Select Image</option>
                                  {images.map((img) => (
                                    <option key={img.id} value={img.id}>
                                      {img.isPrimary ? "Primary Image" : `Image ${img.sortOrder + 1}`}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  className="text-sm border px-3 py-1 rounded"
                                  onClick={() => {
                                    setPendingEditRowId(row.id);
                                    channelEditFileInputRef.current?.click();
                                  }}
                                >
                                  Upload New For This Channel
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <input
        ref={channelEditFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => handleUploadForChannel(e.target.files)}
      />

      <div className="flex justify-end gap-3 mt-6 border-2 border-dashed border-sky-400 p-3">
        {onPrev && (
          <button
            onClick={onPrev}
            className="border px-6 py-2 rounded border-black"
          >
            Previous
          </button>
        )}
        {onNext && (
          <button onClick={onNext} className="bg-yellow-400 px-6 py-2 rounded">
            Save & Next
          </button>
        )}
      </div>
    </div>
  );
};

export default ImagesStep;
