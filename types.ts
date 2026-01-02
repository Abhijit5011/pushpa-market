
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  FLORIST = 'FLORIST',
  ADMIN = 'ADMIN'
}

export enum FloristStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum OrderStatus {
  PLACED = 'PLACED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION', 
  COMPLETED = 'COMPLETED', 
  CANCELLED = 'CANCELLED'
}

export type DeliveryType = 'DELIVERY' | 'PICKUP';

export interface Address {
  id: string;
  tag: string; 
  details: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'sepia';
  language: 'English' | 'Hindi' | 'Marathi' | 'Tamil';
  notifications: boolean;
}

export interface User {
  id: string;
  mobile: string;
  password?: string; 
  role: UserRole;
  name?: string;
  shopName?: string;
  shopAddress?: string;
  lat?: number;
  lng?: number;
  avatar?: string;
  floristStatus?: FloristStatus;
  isBlocked: boolean;
  addresses: Address[];
  settings: UserSettings;
}

export interface Flower {
  id: string;
  name: string;
  localName: string;
  category: 'Puja' | 'Garland' | 'Rose' | 'Daily' | 'Wedding';
  price: number;
  unit: string;
  description: string;
  image: string;
  floristId: string;
  stock: number;
  availability: DeliveryType[]; 
  flower_name?: string;
}

export interface CartItem extends Flower {
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  floristId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
  address: string;
  deliveryType: DeliveryType;
  paymentMethod: 'COD';
  confirmedByCustomer: boolean;
}

export interface AppState {
  currentUser: User | null;
  flowers: Flower[];
  orders: Order[];
  cart: CartItem[];
}