export interface SubCategory {
  id: number;
  name: string;
  image: string;
  category: string;
  description: string;
  status: "Active" | "Inactive";
}

export const subCategoryData: SubCategory[] = [
  {
    id: 1,
    name: "Biryani",
    image:
      "https://images.unsplash.com/photo-1600628422019-46b8f6b7f6b6",
    category: "Rice Dishes",
    description: "Aromatic, spiced rice dish.",
    status: "Active",
  },
  {
    id: 2,
    name: "Pulao",
    image:
      "https://images.unsplash.com/photo-1605475128504-34e07cdd4a6c",
    category: "Rice Dishes",
    description: "Flavored rice with vegetables.",
    status: "Active",
  },
  {
    id: 3,
    name: "Fried Rice",
    image:
      "https://images.unsplash.com/photo-1604908554025-4a0dfc89e1c4",
    category: "Rice Dishes",
    description: "Stir-fried rice with vegetables.",
    status: "Active",
  },
  {
    id: 4,
    name: "Khichdi",
    image:
      "https://images.unsplash.com/photo-1625937282474-2a4d65a7b6e7",
    category: "Rice Dishes",
    description: "Comforting rice and lentils.",
    status: "Active",
  },
  {
    id: 5,
    name: "Risotto",
    image:
      "https://images.unsplash.com/photo-1589308078055-4c6bda6a2d98",
    category: "Rice Dishes",
    description: "Creamy, rich Italian rice.",
    status: "Active",
  },
  {
    id: 6,
    name: "Sushi Rice",
    image:
      "https://images.unsplash.com/photo-1562967916-eb82221dfb36",
    category: "Rice Dishes",
    description: "Vinegared rice for sushi.",
    status: "Inactive",
  },
  {
    id: 7,
    name: "Steamed Rice",
    image:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d",
    category: "Rice Dishes",
    description: "Simple, fluffy white rice.",
    status: "Active",
  },
];
