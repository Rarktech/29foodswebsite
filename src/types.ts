export type FoodType = 
  | 'rice' 
  | 'yam' 
  | 'afang' 
  | 'egusi' 
  | 'chicken' 
  | 'beef' 
  | 'plantain' 
  | 'eggsauce'
  | 'scallion'
  | 'chili'
  | 'cilantro';

export interface FoodParticle {
  id: string;
  type: FoodType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  omega: number; // Angular velocity
  size: number;
  mass: number;
  color: string;
  highlightColor: string;
  restX: number; // Platter rest X position
  restY: number; // Platter rest Y position
  restAngle: number;
  isGrabbed?: boolean;
  scale?: number; // scale transition animation
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number; // in Naira (₦)
  calories: string;
  tags: string[];
  category: 'base' | 'protein' | 'side' | 'classic';
  ingredients: FoodType[];
}

export type ActiveDishId = string;

export interface PlatterConfiguration {
  dishId: ActiveDishId;
  hasPlantain: boolean;
  selectedToppingIds: string[];
  toppingQuantities?: Record<string, number>;
  quantity: number;
  ownerName?: string;
}

export interface TakeawayOrderData {
  id?: string;
  name: string;
  phone: string;
  address?: string; // Optional delivery address
  method: 'pickup' | 'delivery';
  time: string;
  dietaryNotes: string;
  customPlatterOrder?: PlatterConfiguration; // Link custom platter to order
  customPlatterns_v2?: PlatterConfiguration[]; // Support multiple custom platters (typo compat)
  customPlatters_v2?: PlatterConfiguration[]; // Support multiple custom platters in one order
  totalPrice: number;
  paymentStatus?: 'pending' | 'success' | 'failed';
  paymentReference?: string;
}
