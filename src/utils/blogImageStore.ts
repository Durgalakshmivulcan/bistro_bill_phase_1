const BLOG_IMAGE_STORAGE_KEY = "bb_blog_images";

type BlogImageMap = Record<string, string>;

function readBlogImageMap(): BlogImageMap {
  try {
    const raw = localStorage.getItem(BLOG_IMAGE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BlogImageMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeBlogImageMap(map: BlogImageMap): void {
  localStorage.setItem(BLOG_IMAGE_STORAGE_KEY, JSON.stringify(map));
}

export function getBlogImage(blogId: string): string | null {
  if (!blogId) return null;
  const map = readBlogImageMap();
  return map[blogId] || null;
}

export function setBlogImage(blogId: string, imageDataUrl: string): void {
  if (!blogId || !imageDataUrl) return;
  const map = readBlogImageMap();
  map[blogId] = imageDataUrl;
  writeBlogImageMap(map);
}

export function removeBlogImage(blogId: string): void {
  if (!blogId) return;
  const map = readBlogImageMap();
  if (map[blogId]) {
    delete map[blogId];
    writeBlogImageMap(map);
  }
}
