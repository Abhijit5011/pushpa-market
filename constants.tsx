
import { Flower, User, UserRole, FloristStatus, UserSettings } from './types';

export const INITIAL_FLOWERS: Flower[] = [
  {
    id: 'f1',
    name: 'Marigold (Orange)',
    localName: 'Genda Phool',
    category: 'Puja',
    price: 40,
    unit: 'kg',
    description: 'Fresh bright orange marigolds, perfect for daily puja and decoration.',
    image: 'https://images.unsplash.com/photo-1596700770281-9b2243f75860?auto=format&fit=crop&w=400&q=80',
    floristId: 's1',
    stock: 50,
    availability: ['DELIVERY', 'PICKUP']
  },
  {
    id: 'f2',
    name: 'Jasmine (Mogra)',
    localName: 'Mogra',
    category: 'Daily',
    price: 120,
    unit: 'kg',
    description: 'Highly fragrant Mogra flowers, ideal for venis and offering.',
    image: 'https://images.unsplash.com/photo-1596043428185-356a68f0798e?auto=format&fit=crop&w=400&q=80',
    floristId: 's1',
    stock: 20,
    availability: ['PICKUP']
  },
  {
    id: 'f3',
    name: 'Lotus',
    localName: 'Kamal',
    category: 'Puja',
    price: 50,
    unit: 'piece',
    description: 'Sacred pink lotus for special festivals and Laxmi Puja.',
    image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=400&q=80',
    floristId: 's2',
    stock: 10,
    availability: ['DELIVERY', 'PICKUP']
  },
  {
    id: 'f4',
    name: 'Wedding Garland',
    localName: 'Varmala',
    category: 'Garland',
    price: 1500,
    unit: 'pair',
    description: 'Premium rose and orchid garland for weddings.',
    image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?auto=format&fit=crop&w=400&q=80',
    floristId: 's2',
    stock: 5,
    availability: ['DELIVERY']
  },
  {
    id: 'f5',
    name: 'Red Roses',
    localName: 'Gulab',
    category: 'Rose',
    price: 200,
    unit: 'bunch',
    description: 'Fresh red roses from Bangalore gardens.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    floristId: 's1',
    stock: 30,
    availability: ['DELIVERY', 'PICKUP']
  }
];

export const TRANSLATIONS: Record<string, any> = {
  English: {
    home: "Home",
    orders: "Orders",
    profile: "Profile",
    dashboard: "Dashboard",
    admin: "Admin",
    basket: "Basket",
    logout: "Logout",
    search_placeholder: "Search Mogra, Genda, Marigold...",
    add_to_basket: "Add to Basket",
    added: "Added to Basket",
    pickup_only: "Pickup Only",
    delivery_only: "Delivery Only",
    both_available: "Delivery & Pickup"
  },
  Hindi: {
    home: "मुख्य पृष्ठ",
    orders: "मेरे आदेश",
    profile: "प्रोफ़ाइल",
    dashboard: "डैशबोर्ड",
    admin: "व्यवस्थापक",
    basket: "टोकरी",
    logout: "लॉगआउट",
    search_placeholder: "मोगरा, गेंदा, गुलाब खोजें...",
    add_to_basket: "टोकरी में डालें",
    added: "टोकरी में जोड़ा गया",
    pickup_only: "केवल पिकअप",
    delivery_only: "केवल डिलीवरी",
    both_available: "डिलीवरी और पिकअप"
  },
  Marathi: {
    home: "मुख्य पृष्ठ",
    orders: "माझे आदेश",
    profile: "प्रोफाइल",
    dashboard: "डॅशबोर्ड",
    admin: "प्रशासक",
    basket: "बास्केट",
    logout: "बाहेर पडा",
    search_placeholder: "मोगरा, झेंडू शोधा...",
    add_to_basket: "बास्केटमध्ये जोडा",
    added: "बास्केटमध्ये जोडले",
    pickup_only: "फक्त पिकअप",
    delivery_only: "फक्त डिलिव्हरी",
    both_available: "डिलिव्हरी आणि पिकअप"
  },
  Tamil: {
    home: "முகப்பு",
    orders: "ஆர்டர்கள்",
    profile: "சுயவிவரம்",
    dashboard: "டாஷ்போர்டு",
    admin: "நிர்வாகம்",
    basket: "கூடை",
    logout: "வெளியேறு",
    search_placeholder: "மல்லிகை, சாமந்தி தேடுங்கள்...",
    add_to_basket: "கூடையில் சேர்",
    added: "கூடையில் சேர்க்கப்பட்டது",
    pickup_only: "பிக்கப் மட்டும்",
    delivery_only: "டெலிவரி மட்டும்",
    both_available: "டெலிவரி மற்றும் பிக்கப்"
  }
};

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  language: 'English',
  notifications: true
};

export const MOCK_USERS: User[] = [
  { id: 'admin1', mobile: '9999999999', password: '1234', role: UserRole.ADMIN, name: 'Main Admin', isBlocked: false, addresses: [], settings: DEFAULT_SETTINGS },
  { id: 's1', mobile: '8888888888', password: '1234', role: UserRole.FLORIST, name: 'Krishna Florals', shopName: 'Krishna Florals Boutique', shopAddress: '123 Temple Road, Varanasi, UP', lat: 25.3176, lng: 82.9739, floristStatus: FloristStatus.APPROVED, isBlocked: false, addresses: [], settings: DEFAULT_SETTINGS },
  { id: 's2', mobile: '7777777777', password: '1234', role: UserRole.FLORIST, name: 'Ganga Flowers', shopName: 'Ganga Floral Hub', shopAddress: 'Near Ganga Ghat, Varanasi, UP', lat: 25.2800, lng: 83.0100, floristStatus: FloristStatus.PENDING, isBlocked: false, addresses: [], settings: DEFAULT_SETTINGS },
  { id: 'c1', mobile: '1111111111', password: '1234', role: UserRole.CUSTOMER, name: 'Rahul Sharma', isBlocked: false, addresses: [{ id: 'a1', tag: 'Home', details: 'Flat 402, Lotus Towers, Mumbai, MH', lat: 19.0760, lng: 72.8777, isDefault: true }], settings: DEFAULT_SETTINGS }
];
