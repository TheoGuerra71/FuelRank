export interface FuelPrice {
  type: string;
  price: number;
  updatedAt: string;
}

export interface Station {
  id: string;
  name: string;
  brand: string;
  address: string;
  distance: string;
  rating: number;
  reviewCount: number;
  prices: FuelPrice[];
  hasPromotion: boolean;
  promotionText?: string;
  seal: "trusted" | "observation" | "complaints";
  complaints: number;
  lat: number;
  lng: number;
}

export const mockStations: Station[] = [
  {
    id: "1",
    name: "Posto Shell Centro",
    brand: "Shell",
    address: "Av. Paulista, 1000 - São Paulo",
    distance: "0.8 km",
    rating: 4.5,
    reviewCount: 234,
    prices: [
      { type: "Gasolina Comum", price: 5.89, updatedAt: "Há 2h" },
      { type: "Gasolina Aditivada", price: 6.19, updatedAt: "Há 2h" },
      { type: "Etanol", price: 3.79, updatedAt: "Há 3h" },
      { type: "Diesel", price: 5.49, updatedAt: "Há 5h" },
    ],
    hasPromotion: true,
    promotionText: "Etanol R$3,49 até sexta!",
    seal: "trusted",
    complaints: 2,
    lat: -23.5615,
    lng: -46.6559,
  },
  {
    id: "2",
    name: "Posto Ipiranga Consolação",
    brand: "Ipiranga",
    address: "R. da Consolação, 2500 - São Paulo",
    distance: "1.2 km",
    rating: 4.2,
    reviewCount: 189,
    prices: [
      { type: "Gasolina Comum", price: 5.79, updatedAt: "Há 1h" },
      { type: "Gasolina Aditivada", price: 6.09, updatedAt: "Há 1h" },
      { type: "Etanol", price: 3.89, updatedAt: "Há 2h" },
      { type: "Diesel", price: 5.39, updatedAt: "Há 4h" },
      { type: "GNV", price: 4.29, updatedAt: "Há 6h" },
    ],
    hasPromotion: false,
    seal: "trusted",
    complaints: 1,
    lat: -23.5547,
    lng: -46.6621,
  },
  {
    id: "3",
    name: "Posto BR Vila Mariana",
    brand: "Petrobras",
    address: "Av. Domingos de Morais, 800 - São Paulo",
    distance: "2.1 km",
    rating: 3.8,
    reviewCount: 156,
    prices: [
      { type: "Gasolina Comum", price: 5.99, updatedAt: "Há 5h" },
      { type: "Gasolina Aditivada", price: 6.29, updatedAt: "Há 5h" },
      { type: "Etanol", price: 3.99, updatedAt: "Há 8h" },
      { type: "Diesel", price: 5.59, updatedAt: "Há 12h" },
    ],
    hasPromotion: true,
    promotionText: "Ganhe 5pts no app a cada abastecimento",
    seal: "observation",
    complaints: 8,
    lat: -23.5875,
    lng: -46.6378,
  },
  {
    id: "4",
    name: "Auto Posto Jardins",
    brand: "Bandeira Branca",
    address: "R. Oscar Freire, 450 - São Paulo",
    distance: "1.5 km",
    rating: 4.7,
    reviewCount: 312,
    prices: [
      { type: "Gasolina Comum", price: 5.69, updatedAt: "Há 30min" },
      { type: "Gasolina Aditivada", price: 5.99, updatedAt: "Há 30min" },
      { type: "Etanol", price: 3.69, updatedAt: "Há 1h" },
    ],
    hasPromotion: true,
    promotionText: "Menor preço da região!",
    seal: "trusted",
    complaints: 0,
    lat: -23.5631,
    lng: -46.6716,
  },
  {
    id: "5",
    name: "Posto Ale Liberdade",
    brand: "Ale",
    address: "Av. da Liberdade, 1200 - São Paulo",
    distance: "3.0 km",
    rating: 3.2,
    reviewCount: 87,
    prices: [
      { type: "Gasolina Comum", price: 6.09, updatedAt: "Há 1d" },
      { type: "Etanol", price: 4.19, updatedAt: "Há 1d" },
      { type: "Diesel", price: 5.69, updatedAt: "Há 2d" },
    ],
    hasPromotion: false,
    seal: "complaints",
    complaints: 15,
    lat: -23.5586,
    lng: -46.6344,
  },
];

export interface UserProfile {
  name: string;
  level: string;
  points: number;
  rank: number;
  badge: string;
  totalRefuels: number;
  totalSpent: number;
  reviewsCount: number;
  priceUpdates: number;
}

export const mockUser: UserProfile = {
  name: "Lucas Mendes",
  level: "Colaborador",
  points: 1250,
  rank: 47,
  badge: "🔥",
  totalRefuels: 34,
  totalSpent: 4820,
  reviewsCount: 12,
  priceUpdates: 28,
};

export const influenceLevels = [
  { name: "Iniciante", minPoints: 0, icon: "🌱" },
  { name: "Colaborador", minPoints: 500, icon: "🔥" },
  { name: "Influente", minPoints: 2000, icon: "⭐" },
  { name: "Especialista", minPoints: 5000, icon: "💎" },
  { name: "Embaixador", minPoints: 10000, icon: "👑" },
];
