export interface Product {
  title: string;
  store: string;
  price: string;
  url: string;
  description?: string;
}

export interface ClothingItem {
  name: string;
  description: string;
  color: string;
  style: string;
  estimatedPrice: string;
  searchTerms: string;
  products?: Product[];
}

export interface AnalysisResult {
  items: ClothingItem[];
  overallStyle: string;
}

export interface FallbackUrl {
  store: string;
  url: string;
}