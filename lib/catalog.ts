export type Product = {
  id: number;
  name: string;
  category: string;
  subtitle: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  shade: string;
  accent: string;
  form: "pump" | "tube" | "jar";
  badge?: string;
  size: string;
  concern: string;
};

export const products: Product[] = [
  { id: 1, name: "Royal Oat Body Wash", category: "Body Wash", subtitle: "Oat milk + ceramides", price: 399, oldPrice: 499, rating: 4.8, reviews: 214, shade: "#eaded2", accent: "#6f4436", form: "pump", badge: "Launch preview", size: "250 ml", concern: "Dry & normal skin" },
  { id: 2, name: "Vitamin Glow Face Wash", category: "Face Wash", subtitle: "Vitamin C + green tea", price: 299, oldPrice: 349, rating: 4.7, reviews: 182, shade: "#e2eac8", accent: "#53632e", form: "tube", badge: "Launch preview", size: "100 ml", concern: "Dull skin" },
  { id: 3, name: "Coffee Polish Body Scrub", category: "Body Scrub", subtitle: "Coffee + cocoa butter", price: 449, oldPrice: 549, rating: 4.9, reviews: 308, shade: "#c89270", accent: "#59301d", form: "jar", badge: "Launch preview", size: "200 g", concern: "Rough skin" },
  { id: 4, name: "Aqua Calm Body Wash", category: "Body Wash", subtitle: "Aloe + sea minerals", price: 379, rating: 4.6, reviews: 96, shade: "#b9dcd6", accent: "#245c58", form: "pump", size: "250 ml", concern: "Sensitive skin" },
  { id: 5, name: "Berry Bright Face Wash", category: "Face Wash", subtitle: "Berry enzymes + rice water", price: 329, oldPrice: 399, rating: 4.7, reviews: 127, shade: "#ddb6c2", accent: "#703b50", form: "tube", size: "100 ml", concern: "Uneven tone" },
  { id: 6, name: "Sandal Smooth Scrub", category: "Body Scrub", subtitle: "Sandalwood + almond", price: 499, rating: 4.8, reviews: 155, shade: "#e1c092", accent: "#76502b", form: "jar", size: "200 g", concern: "Tired skin" },
  { id: 7, name: "Niacinamide Gel Cream", category: "Moisturizer", subtitle: "Niacinamide + hyaluronic acid", price: 449, oldPrice: 549, rating: 4.6, reviews: 84, shade: "#d6ddeb", accent: "#3d4f70", form: "jar", badge: "Coming soon", size: "50 g", concern: "Oily skin" },
  { id: 8, name: "Rose Barrier Serum", category: "Serum", subtitle: "Rose water + peptides", price: 599, oldPrice: 699, rating: 4.8, reviews: 73, shade: "#eccfd4", accent: "#75404b", form: "pump", badge: "Coming soon", size: "30 ml", concern: "Barrier care" },
];

export const categories = [
  { name: "Body Wash", icon: "✦", note: "Daily freshness", color: "#f1dfd2" },
  { name: "Face Wash", icon: "◌", note: "Clean & calm", color: "#dfe8d0" },
  { name: "Body Scrub", icon: "✺", note: "Smooth & renew", color: "#dfc2a8" },
  { name: "Moisturizer", icon: "☁", note: "Seal in hydration", color: "#dce3ed" },
  { name: "Serum", icon: "◇", note: "Targeted care", color: "#ead8dc" },
  { name: "Gift Sets", icon: "♕", note: "Made to delight", color: "#e8dce8" },
];

export function catalogItems(ids: number[]) {
  return ids.map((id) => products.find((product) => product.id === id)).filter((product): product is Product => Boolean(product));
}
