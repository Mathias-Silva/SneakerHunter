// src/app/models/sneaker.ts
export interface Sneaker {
  id: number;
  name: string;
  price: number;
  brand: string;
  description: string;
  imageUrl: string;
  gender?: 'masculino' | 'feminino' | 'unissex';
}