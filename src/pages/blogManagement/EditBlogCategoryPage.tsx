import DashboardLayout from "../../layout/DashboardLayout";

const EditBlogCategoryPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold">
          Edit Blog Category
        </h1>

        {/* Form Card */}
        <div className="bg-[#FFFDF5] rounded-lg p-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue="Point of Sale"
                className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>

            {/* Category Image */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Category Image <span className="text-red-500">*</span>
              </label>
              <label className="w-full flex items-center gap-2 border rounded-md px-4 py-2 cursor-pointer text-gray-600 hover:bg-gray-50">
                <span className="text-lg">⬆️</span>
                <span>Upload category Image</span>
                <input type="file" className="hidden" />
              </label>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-10">
            {/* Deactivate */}
            <button className="bg-black text-white px-6 py-2 rounded-md w-fit">
              Deactivate
            </button>

            {/* Right Buttons */}
            <div className="flex gap-4">
              <button className="border px-6 py-2 rounded-md">
                Cancel
              </button>
              <button className="bg-yellow-400 px-6 py-2 rounded-md font-medium">
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditBlogCategoryPage;
