const BLOG_CATEGORY_IMAGE_STORAGE_KEY = "bb_blog_category_images";

type CategoryImageMap = Record<string, string>;

function readCategoryImageMap(): CategoryImageMap {
  try {
    const raw = localStorage.getItem(BLOG_CATEGORY_IMAGE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CategoryImageMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCategoryImageMap(map: CategoryImageMap): void {
  localStorage.setItem(BLOG_CATEGORY_IMAGE_STORAGE_KEY, JSON.stringify(map));
}

export function getBlogCategoryImage(categoryId: string): string | null {
  if (!categoryId) return null;
  const map = readCategoryImageMap();
  return map[categoryId] || null;
}

export function setBlogCategoryImage(categoryId: string, imageDataUrl: string): void {
  if (!categoryId || !imageDataUrl) return;
  const map = readCategoryImageMap();
  map[categoryId] = imageDataUrl;
  writeCategoryImageMap(map);
}

export function removeBlogCategoryImage(categoryId: string): void {
  if (!categoryId) return;
  const map = readCategoryImageMap();
  if (map[categoryId]) {
    delete map[categoryId];
    writeCategoryImageMap(map);
  }
}
