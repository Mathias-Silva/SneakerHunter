export interface Sneaker {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  imageUrl?: string;
  brand?: string;
  gender?: string;
  quantity?: number;
  rating?: number;
  sizes?: number[];
}