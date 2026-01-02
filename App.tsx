
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Home as HomeIcon, 
  User as UserIcon, 
  PlusCircle, 
  Truck, 
  CheckCircle, 
  XCircle,
  Package,
  Clock,
  Search,
  MapPin,
  Edit2,
  Trash2,
  Upload,
  Camera,
  X,
  Info,
  ShieldCheck,
  BarChart3,
  PhoneCall,
  Store,
  Plus,
  Minus,
  Maximize2,
  ArrowLeft,
  Check,
  Navigation,
  Filter,
  AlertTriangle
} from 'lucide-react';

import { 
  User, 
  UserRole, 
  Flower, 
  Order, 
  CartItem, 
  OrderStatus, 
  FloristStatus,
  Address,
  DeliveryType
} from './types';
import { INITIAL_FLOWERS, MOCK_USERS, TRANSLATIONS } from './constants';
import { supabase, mapProfile, mapFlower, mapOrder, uploadImage } from './supabase';

const saveToStorage = (key: string, data: any) => localStorage.setItem(`pushpa_${key}`, JSON.stringify(data));
const getFromStorage = (key: string, fallback: any) => {
  const saved = localStorage.getItem(`pushpa_${key}`);
  try {
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const openInMaps = (address: string, lat?: number, lng?: number) => {
  let url = '';
  if (lat !== undefined && lng !== undefined) {
    url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  } else {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  window.open(url, '_blank');
};

// --- Shared Components ---

const StatusAlert = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  const colors = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-rose-600 border-rose-500',
    info: 'bg-blue-600 border-blue-500'
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl text-white text-[11px] font-bold uppercase tracking-wider shadow-xl border animate-in slide-in-from-top-4 ${colors[type]}`}>
      <div className="flex items-center gap-2">
        {type === 'success' ? <CheckCircle size={14}/> : type === 'error' ? <XCircle size={14}/> : <Info size={14}/>}
        {message}
      </div>
    </div>
  );
};

const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 active:scale-95 transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-xs font-bold bg-rose-500 text-white active:scale-95 transition">Confirm</button>
        </div>
      </div>
    </div>
  );
};

// --- Logic Components ---

const OrderTimeline = ({ status, type }: { status: OrderStatus, type: DeliveryType }) => {
  const steps = type === 'DELIVERY' 
    ? [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.AWAITING_CONFIRMATION, OrderStatus.COMPLETED]
    : [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.READY_FOR_PICKUP, OrderStatus.AWAITING_CONFIRMATION, OrderStatus.COMPLETED];

  const currentIdx = steps.indexOf(status);

  return (
    <div className="flex items-center justify-between w-full py-6 relative">
      <div className="absolute top-[35px] left-0 right-0 h-0.5 bg-slate-100 mx-4"></div>
      <div className="absolute top-[35px] left-0 h-0.5 bg-rose-500 transition-all duration-700 mx-4" style={{ width: `calc(${(currentIdx / (steps.length - 1)) * 100}% - 32px)` }}></div>
      
      {steps.map((step, idx) => (
        <div key={step} className="flex flex-col items-center z-10 w-1/5">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${idx <= currentIdx ? 'bg-rose-500 text-white' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>
             {idx < currentIdx ? <Check size={12} /> : idx === currentIdx ? <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> : <div className="w-1 h-1 bg-slate-200 rounded-full"></div>}
          </div>
          <span className={`text-[7px] mt-2 font-black uppercase text-center tracking-tighter ${idx <= currentIdx ? 'text-rose-600' : 'text-slate-400'}`}>{step.replace(/_/g, ' ')}</span>
        </div>
      ))}
    </div>
  );
};

const Navbar = ({ t, user, cartCount, onLogout }: { t: any, user: User, cartCount: number, onLogout: () => void }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-slate-100 z-[100] h-14 flex items-center justify-between px-4 shadow-sm">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">P</div>
        <span className="font-serif font-bold text-slate-800 text-sm hidden sm:block">Pushpa Market</span>
      </Link>
      
      <div className="flex items-center gap-3">
        {user.role === UserRole.CUSTOMER && (
          <Link to="/cart" className="relative p-2 text-slate-400 hover:text-rose-500 transition">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>
        )}
        <Link to="/profile" className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 overflow-hidden border border-slate-200">
          {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} />}
        </Link>
      </div>
    </nav>
  );
};

const BottomNav = ({ t, user }: { t: any, user: User }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-around items-center z-[100] pb-6 shadow-lg">
      {user.role === UserRole.CUSTOMER && (
        <>
          <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-rose-500' : 'text-slate-300'}`}>
            <HomeIcon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{t.home}</span>
          </Link>
          <Link to="/orders" className={`flex flex-col items-center gap-1 ${isActive('/orders') ? 'text-rose-500' : 'text-slate-300'}`}>
            <Package size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{t.orders}</span>
          </Link>
          <Link to="/cart" className={`flex flex-col items-center gap-1 ${isActive('/cart') ? 'text-rose-500' : 'text-slate-300'}`}>
            <ShoppingBag size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{t.basket}</span>
          </Link>
        </>
      )}
      {user.role === UserRole.FLORIST && (
        <>
          <Link to="/seller/dashboard" className={`flex flex-col items-center gap-1 ${isActive('/seller/dashboard') ? 'text-rose-500' : 'text-slate-300'}`}>
            <BarChart3 size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{t.dashboard}</span>
          </Link>
        </>
      )}
      {user.role === UserRole.ADMIN && (
        <>
          <Link to="/admin" className={`flex flex-col items-center gap-1 ${isActive('/admin') ? 'text-rose-500' : 'text-slate-300'}`}>
            <ShieldCheck size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{t.admin}</span>
          </Link>
        </>
      )}
      <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-rose-500' : 'text-slate-300'}`}>
        <UserIcon size={20} />
        <span className="text-[9px] font-bold uppercase tracking-tighter">{t.profile}</span>
      </Link>
    </div>
  );
};

const ZoomModal = ({ imageUrl, onClose }: { imageUrl: string, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200" onClick={onClose}>
      <button className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition" onClick={onClose}>
        <X size={24} />
      </button>
      <img src={imageUrl} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
    </div>
  );
};

// --- Pages ---

const Login = ({ onLogin, onRegister, globalError, showAlert }: { onLogin: (m: string, p: string, r: UserRole) => void, onRegister: (m: string, p: string, extra: Partial<User>) => void, globalError?: string | null, showAlert: (m: string, t?: any) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (globalError) setLocalError(globalError);
  }, [globalError]);

  useEffect(() => {
    if (role === UserRole.ADMIN && isRegister) {
      setIsRegister(false);
    }
  }, [role, isRegister]);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(value);
    if (localError) setLocalError(null);
  };

  const handleSubmit = () => {
    if (mobile.length !== 10) {
      const msg = "Mobile number must be exactly 10 digits.";
      setLocalError(msg);
      showAlert(msg, "error");
      return;
    }
    if (!password) {
      const msg = "Please enter your PIN Code.";
      setLocalError(msg);
      showAlert(msg, "error");
      return;
    }

    if (isRegister) {
      if (!name) { 
        const msg = "Please enter your name.";
        setLocalError(msg);
        showAlert(msg, "error");
        return; 
      }
      if (role === UserRole.FLORIST && (!shopName || !shopAddress)) { 
        const msg = "Please enter shop details.";
        setLocalError(msg);
        showAlert(msg, "error");
        return; 
      }
      onRegister(mobile, password, { 
        name, 
        role, 
        shopName, 
        shopAddress, 
        floristStatus: role === UserRole.FLORIST ? FloristStatus.PENDING : undefined 
      });
    } else {
      onLogin(mobile, password, role);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-lg">P</div>
          <h1 className="text-2xl font-serif font-bold text-slate-800">Pushpa Market</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Indian Flowers Hub</p>
        </div>

        <div className="space-y-3">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-2">
            <button onClick={() => setRole(UserRole.CUSTOMER)} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition ${role === UserRole.CUSTOMER ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Customer</button>
            <button onClick={() => setRole(UserRole.FLORIST)} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition ${role === UserRole.FLORIST ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Florist</button>
            <button onClick={() => setRole(UserRole.ADMIN)} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition ${role === UserRole.ADMIN ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Admin</button>
          </div>

          {localError && (
            <div className="bg-rose-50 text-rose-600 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2 border border-rose-100">
               <AlertTriangle size={14} />
               {localError}
            </div>
          )}

          {isRegister && (
            <>
              <input placeholder="Your Name" className="w-full p-4 bg-slate-50 border border-transparent focus:border-rose-100 rounded-xl text-sm outline-none" value={name} onChange={e => { setName(e.target.value); setLocalError(null); }} />
              {role === UserRole.FLORIST && (
                <>
                  <input placeholder="Shop Name" className="w-full p-4 bg-slate-50 border border-transparent focus:border-rose-100 rounded-xl text-sm outline-none" value={shopName} onChange={e => { setShopName(e.target.value); setLocalError(null); }} />
                  <textarea placeholder="Shop Address with Landmark (for easy pickup)" className="w-full p-4 bg-slate-50 border border-transparent focus:border-rose-100 rounded-xl text-sm outline-none h-20" value={shopAddress} onChange={e => { setShopAddress(e.target.value); setLocalError(null); }} />
                </>
              )}
            </>
          )}
          <input 
            type="tel"
            placeholder="Mobile Number (10 digits)" 
            className="w-full p-4 bg-slate-50 border border-transparent focus:border-rose-100 rounded-xl text-sm outline-none" 
            value={mobile} 
            onChange={handleMobileChange}
            maxLength={10}
          />
          <input type="password" placeholder="Enter Password" className="w-full p-4 bg-slate-50 border border-transparent focus:border-rose-100 rounded-xl text-sm outline-none" value={password} onChange={e => { setPassword(e.target.value); setLocalError(null); }} />
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl mt-8 text-xs uppercase tracking-widest shadow-lg active:scale-95 transition"
        >
          {isRegister ? 'Create Account' : 'Sign In'}
        </button>

        {role !== UserRole.ADMIN && (
          <button onClick={() => { setIsRegister(!isRegister); setLocalError(null); }} className="w-full text-center mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isRegister ? 'Already have an account? Login' : 'New here? Register'}
          </button>
        )}
      </div>
    </div>
  );
};

const CustomerHome = ({ t, flowers }: { t: any, flowers: Flower[] }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'relevance' | 'lowToHigh' | 'highToLow'>('relevance');

  const categories = ['All', 'Puja', 'Garland', 'Rose', 'Daily', 'Wedding'];

  const filtered = useMemo(() => {
    let result = flowers.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.localName.toLowerCase().includes(search.toLowerCase());
      const matchesCat = category === 'All' || f.category === category;
      return matchesSearch && matchesCat;
    });

    if (sortBy === 'lowToHigh') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'highToLow') {
      result.sort((a, b) => b.price - a.price);
    }
    
    return result;
  }, [flowers, search, category, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 animate-in fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-serif font-bold text-slate-800 mb-1">Pushpa Market</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Fresh. Daily. Delivered.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input 
            type="text" 
            placeholder={t.search_placeholder} 
            className="w-full bg-white border border-slate-100 py-4 pl-12 pr-6 rounded-2xl text-sm font-medium shadow-sm outline-none focus:border-rose-200 transition"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center bg-white border border-slate-100 rounded-2xl px-4 py-2 shadow-sm gap-2">
          <Filter size={16} className="text-slate-300" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-bold text-slate-600 outline-none bg-transparent uppercase cursor-pointer"
          >
            <option value="relevance">Relevance</option>
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
        {categories.map(c => (
          <button 
            key={c} 
            onClick={() => setCategory(c)}
            className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition shrink-0 ${category === c ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-50'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(f => (
          <Link key={f.id} to={`/flower/${f.id}`} className="bg-white rounded-3xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-50 group flex flex-col">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-3 relative">
              <img src={f.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute top-2 left-2 flex gap-1">
                 {f.availability.includes('DELIVERY') && <div className="bg-white/90 p-1.5 rounded-lg shadow-sm text-rose-500"><Truck size={12}/></div>}
                 {f.availability.includes('PICKUP') && <div className="bg-white/90 p-1.5 rounded-lg shadow-sm text-blue-500"><Store size={12}/></div>}
              </div>
              <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 rounded-lg text-[7px] font-bold uppercase text-slate-800">{f.category}</div>
            </div>
            <div className="px-1 flex-1">
              <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{f.name}</h3>
              <p className="text-[10px] font-bold text-rose-500 mb-1">{f.localName}</p>
            </div>
            <div className="flex justify-between items-center px-1 mt-auto">
              <p className="text-sm font-bold text-slate-900">₹{f.price}<span className="text-[9px] text-slate-400 font-normal">/{f.unit}</span></p>
              <div className="w-7 h-7 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition"><ShoppingBag size={12}/></div>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="font-serif text-xl text-slate-300">No matching flowers found.</p>
        </div>
      )}
    </div>
  );
};

const SellerDashboard = ({ flowers, orders, users, onAddFlower, onEditFlower, onDeleteFlower, onUpdateOrderStatus, showAlert }: { flowers: Flower[], orders: Order[], users: User[], onAddFlower: (f: Partial<Flower>) => void, onEditFlower: (id: string, data: Partial<Flower>) => void, onDeleteFlower: (id: string) => void, onUpdateOrderStatus: (id: string, status: OrderStatus) => void, showAlert: (m: string, t?: any) => void }) => {
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null);
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [formData, setFormData] = useState<Partial<Flower>>({ name: '', localName: '', category: 'Puja', price: 0, unit: 'kg', stock: 10, description: '', image: '', availability: ['DELIVERY', 'PICKUP'] });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.REJECTED);
  const history = orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED || o.status === OrderStatus.REJECTED);

  const filteredOrders = useMemo(() => {
    const list = showHistory ? history : active;
    if (!orderSearch) return list;
    return list.filter(o => {
      const customer = users.find(u => u.id === o.customerId);
      return o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
             customer?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
             o.items.some(i => i.name.toLowerCase().includes(orderSearch.toLowerCase()));
    });
  }, [showHistory, active, history, orderSearch, users]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Total Sales</p>
          <p className="text-xl font-bold text-slate-800">₹{orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((a, b) => a + b.total, 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Active Orders</p>
          <p className="text-xl font-bold text-slate-800">{active.length}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-800">My Shop</h1>
        <button onClick={() => { setFormData({ name: '', localName: '', category: 'Puja', price: 0, unit: 'kg', stock: 10, description: '', image: '', availability: ['DELIVERY', 'PICKUP'] }); setShowModal('add'); }} className="bg-rose-500 text-white p-4 rounded-2xl shadow-xl active:scale-95 transition hover:bg-rose-600">
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-8">
        <div>
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Orders Management</h3>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                 <button onClick={() => setShowHistory(false)} className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase transition ${!showHistory ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Current</button>
                 <button onClick={() => setShowHistory(true)} className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase transition ${showHistory ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>History</button>
              </div>
           </div>
           
           <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Find orders or customers..." 
                className="w-full bg-white border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-xs font-medium outline-none"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
              />
           </div>

           <div className="space-y-3">
             {filteredOrders.map(o => {
               const customer = users.find(u => u.id === o.customerId);
               const customerAddressObj = customer?.addresses.find(a => a.details === o.address);
               return (
                 <div key={o.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <span className="text-[8px] bg-slate-800 text-white px-2 py-0.5 rounded-full font-bold">#{o.id.split('-')[0].slice(-4)}</span>
                         <p className="text-[9px] text-slate-400 mt-1 font-medium">{new Date(o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-bold text-rose-500">₹{o.total}</p>
                          <p className={`text-[8.5px] font-bold uppercase px-2 py-0.5 rounded-lg inline-block mt-1 ${o.status === OrderStatus.COMPLETED ? 'bg-green-50 text-green-600' : o.status === OrderStatus.REJECTED ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>{o.status.replace(/_/g, ' ')}</p>
                       </div>
                    </div>
                    
                    <div className="mb-3 pb-3 border-b border-slate-50">
                       <div className="flex justify-between items-center">
                       <p className="text-xs font-bold text-slate-800">{customer?.name}</p>
                       <a href={`tel:+91${customer?.mobile}`} className="flex items-center gap-1.5 bg-grey-50 text-grey-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase shadow-sm border border-grey-100 hover:bg-grey-100 transition">
                         <PhoneCall size={15}/>Call 
                       </a>
                    </div>
                       <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5 mt-1"><PhoneCall size={10}/> +91 {customer?.mobile}</p>
                       <p className="text-[10px] font-medium text-slate-500 flex items-start gap-1.5 leading-tight mt-1">
                         <MapPin size={10} className="mt-0.5 shrink-0"/> {o.deliveryType === 'PICKUP' ? 'PICKUP Order' : o.address}
                       </p>
                       {o.deliveryType === 'DELIVERY' && o.address && (
                          <button 
                            onClick={() => openInMaps(o.address, customerAddressObj?.lat, customerAddressObj?.lng)}
                            className="mt-2 flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase shadow-sm border border-blue-100 hover:bg-blue-100 transition"
                          >
                            <Navigation size={15}/> Use Map
                          </button>
                       )}
                    </div>

                    <h4 className="text-[10px] font-bold text-slate-700">{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</h4>
                    
                    {!showHistory && (
                       <div className="flex justify-end gap-3 mt-4">
                            {o.status === OrderStatus.PLACED && (
                               <>
                                 <button onClick={() => onUpdateOrderStatus(o.id, OrderStatus.ACCEPTED)} className="px-5 py-3 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase shadow-md hover:bg-rose-600 transition min-w-[80px]">Accept</button>
                                 <button onClick={() => onUpdateOrderStatus(o.id, OrderStatus.REJECTED)} className="px-5 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase shadow-md hover:bg-slate-200 transition min-w-[80px]">Reject</button>
                               </>
                            )}
                            {o.status === OrderStatus.ACCEPTED && <button onClick={() => onUpdateOrderStatus(o.id, o.deliveryType === 'DELIVERY' ? OrderStatus.OUT_FOR_DELIVERY : OrderStatus.READY_FOR_PICKUP)} className="px-5 py-3 bg-blue-500 text-white rounded-xl text-xs font-bold uppercase shadow-md hover:bg-blue-600 transition min-w-[80px]">Ready</button>}
                            {(o.status === OrderStatus.OUT_FOR_DELIVERY || o.status === OrderStatus.READY_FOR_PICKUP) && <button onClick={() => onUpdateOrderStatus(o.id, OrderStatus.AWAITING_CONFIRMATION)} className="px-5 py-3 bg-green-500 text-white rounded-xl text-xs font-bold uppercase shadow-md hover:bg-green-600 transition min-w-[80px]">Handover</button>}
                       </div>
                    )}
                 </div>
               );
             })}
           </div>
        </div>

        <div>
           <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">My Catalog</h3>
           <div className="grid grid-cols-2 gap-3">
             {flowers.map(f => (
               <div key={f.id} onClick={() => { setSelectedFlower(f); setFormData({...f}); setShowModal('edit'); }} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm relative group cursor-pointer hover:border-rose-200 transition">
                  <img src={f.image} className="aspect-square w-full object-cover rounded-xl mb-2" />
                  <div className="absolute top-4 right-4 flex gap-1">
                     <button onClick={(e) => { e.stopPropagation(); setSelectedFlower(f); setFormData({...f}); setShowModal('edit'); }} className="p-1.5 bg-white/90 rounded-lg text-rose-500 shadow-sm active:scale-90 transition"><Edit2 size={12}/></button>
                     <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(f.id); }} className="p-1.5 bg-white/90 rounded-lg text-red-500 shadow-sm active:scale-90 transition"><Trash2 size={12}/></button>
                  </div>
                  <h4 className="text-[11px] font-bold text-slate-800 truncate">{f.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                     <span className="text-[10px] font-bold">₹{f.price}</span>
                     <span className="text-[8px] font-medium text-slate-400">{f.stock} left</span>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Flower Details</h3>
                <button onClick={() => setShowModal(null)}><X size={20}/></button>
             </div>
             <div className="space-y-3">
                <div className="relative group mx-auto w-20 h-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                   {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <Camera size={24} className="text-slate-300"/>}
                   <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/20 flex items-center justify-center text-white"><Upload size={16}/></button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <input placeholder="Flower Name" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input placeholder="Local Name (Hindi/Tamil...)" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium outline-none" value={formData.localName} onChange={e => setFormData({...formData, localName: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase px-1">Category</label>
                      <select 
                        className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value as any})}
                      >
                         <option value="Puja">Puja</option>
                         <option value="Garland">Garland</option>
                         <option value="Rose">Rose</option>
                         <option value="Daily">Daily</option>
                         <option value="Wedding">Wedding</option>
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase px-1">Unit</label>
                      <select 
                        className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" 
                        value={formData.unit} 
                        onChange={e => setFormData({...formData, unit: e.target.value})}
                      >
                         <option value="piece">piece</option>
                         <option value="bunch">bunch</option>
                         <option value="dozen">dozen</option>
                         <option value="kg">kg</option>
                         <option value="pair">pair</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <input type="number" placeholder="Price (₹)" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium outline-none" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                   <input type="number" placeholder="Total Stock" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium outline-none" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                </div>

                <textarea placeholder="Tell more about this flower..." className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium outline-none h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />

                <div className="bg-slate-50 p-3 rounded-xl">
                   <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Offer Mode</p>
                   <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" className="w-4 h-4 rounded text-rose-500" checked={formData.availability?.includes('DELIVERY')} onChange={e => {
                            const current = formData.availability || [];
                            setFormData({...formData, availability: e.target.checked ? [...current, 'DELIVERY'] : current.filter(x => x !== 'DELIVERY')});
                         }} />
                         <span className="text-[10px] font-medium text-slate-600">Delivery</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" className="w-4 h-4 rounded text-rose-500" checked={formData.availability?.includes('PICKUP')} onChange={e => {
                            const current = formData.availability || [];
                            setFormData({...formData, availability: e.target.checked ? [...current, 'PICKUP'] : current.filter(x => x !== 'PICKUP')});
                         }} />
                         <span className="text-[10px] font-medium text-slate-600">Pickup</span>
                      </label>
                   </div>
                </div>

                <button 
                  onClick={() => {
                    if (formData.name && formData.price) {
                      if (showModal === 'add') onAddFlower(formData);
                      else onEditFlower(selectedFlower!.id, formData);
                      setShowModal(null);
                    } else {
                      showAlert("Please fill name and price.", "error");
                    }
                  }} 
                  className="w-full bg-rose-500 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-wider mt-2 shadow-lg"
                >
                  Save to Catalog
                </button>
             </div>
          </div>
        </div>
      )}

      <ConfirmationDialog 
        isOpen={!!confirmDelete} 
        title="Delete?" 
        message="Remove this from your shop?" 
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { if(confirmDelete){ onDeleteFlower(confirmDelete); setConfirmDelete(null); } }}
      />
    </div>
  );
};

const AdminPanel = ({ users, orders, onBlockUser, onApproveFlorist }: { users: User[], orders: Order[], onBlockUser: (id: string) => void, onApproveFlorist: (id: string, status: FloristStatus) => void }) => {
  const [tab, setTab] = useState<'REVENUE' | 'USERS' | 'FLORISTS' | 'ORDERS'>('REVENUE');
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(u => u.role === UserRole.CUSTOMER && (u.name?.toLowerCase().includes(search.toLowerCase()) || u.mobile.includes(search)));
  const filteredFlorists = users.filter(u => u.role === UserRole.FLORIST && (u.name?.toLowerCase().includes(search.toLowerCase()) || u.shopName?.toLowerCase().includes(search.toLowerCase()) || u.mobile.includes(search)));
  const filteredOrders = orders.filter(o => {
    const seeker = users.find(u => u.id === o.customerId);
    const master = users.find(u => u.id === o.floristId);
    return o.id.toLowerCase().includes(search.toLowerCase()) || 
           seeker?.name?.toLowerCase().includes(search.toLowerCase()) ||
           master?.shopName?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
         <h1 className="text-2xl font-serif font-bold text-slate-800">Admin Control</h1>
         <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner overflow-x-auto no-scrollbar max-w-full">
            {['REVENUE', 'USERS', 'FLORISTS', 'ORDERS'].map(t => (
               <button key={t} onClick={() => { setTab(t as any); setSearch(''); }} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition shrink-0 ${tab === t ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>{t}</button>
            ))}
         </div>
      </div>

      <div className="relative mb-6">
         <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
         <input 
            type="text" 
            placeholder={`Search ${tab.toLowerCase()} records...`} 
            className="w-full bg-white border border-slate-100 py-3 pl-10 pr-4 rounded-xl text-xs font-medium shadow-sm outline-none focus:border-rose-100"
            value={search}
            onChange={e => setSearch(e.target.value)}
         />
      </div>

      {tab === 'REVENUE' && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Bazaar Value</p>
               <p className="text-2xl font-bold text-slate-800">₹{orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((a, b) => a + b.total, 0)}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Active Requests</p>
               <p className="text-2xl font-bold text-slate-800">{orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED).length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Members</p>
               <p className="text-2xl font-bold text-slate-800">{users.length}</p>
            </div>
         </div>
      )}

      {tab === 'USERS' && (
         <div className="space-y-3">
            {filteredUsers.map(u => (
               <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                     <p className="text-sm font-bold text-slate-800">{u.name}</p>
                     <p className="text-[10px] text-slate-400">+91 {u.mobile}</p>
                  </div>
                  <button onClick={() => onBlockUser(u.id)} className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase transition ${u.isBlocked ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                     {u.isBlocked ? 'Unblock' : 'Block'}
                  </button>
               </div>
            ))}
         </div>
      )}

      {tab === 'FLORISTS' && (
         <div className="space-y-3">
            {filteredFlorists.map(u => (
               <div key={u.id} className="bg-white p-5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h4 className="text-sm font-bold text-slate-800">{u.shopName}</h4>
                        <p className="text-[10px] text-slate-400">Master: {u.name} • +91 {u.mobile}</p>
                     </div>
                     <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${u.floristStatus === FloristStatus.APPROVED ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                        {u.floristStatus}
                     </span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mb-4 leading-tight">{u.shopAddress}</p>
                  <div className="flex gap-2">
                     {u.floristStatus === FloristStatus.PENDING && (
                        <button onClick={() => onApproveFlorist(u.id, FloristStatus.APPROVED)} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-[9px] font-bold uppercase">Approve Shop</button>
                     )}
                     <button onClick={() => onBlockUser(u.id)} className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase ${u.isBlocked ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {u.isBlocked ? 'Restore' : 'Block Access'}
                     </button>
                  </div>
               </div>
            ))}
         </div>
      )}

      {tab === 'ORDERS' && (
         <div className="space-y-4">
            {filteredOrders.map(o => {
               const seeker = users.find(u => u.id === o.customerId);
               const master = users.find(u => u.id === o.floristId);
               return (
                  <div key={o.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                     <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">Offer ID: #{o.id.split('-')[0].slice(-6)}</p>
                           <p className="text-[9px] text-slate-300">{new Date(o.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="text-lg font-bold text-rose-500">₹{o.total}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                           <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Customer</p>
                           <p className="text-xs font-bold text-slate-800">{seeker?.name}</p>
                           <p className="text-[10px] text-slate-500">+91 {seeker?.mobile}</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Seller</p>
                           <p className="text-xs font-bold text-slate-800">{master?.shopName}</p>
                        </div>
                     </div>
                     <div className="mb-4">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Items</p>
                        <p className="text-[10px] font-medium text-slate-600">{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                     </div>
                     <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                        <span className="text-[8px] font-bold uppercase text-slate-400">{o.deliveryType} • {o.paymentMethod}</span>
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${o.status === OrderStatus.COMPLETED ? 'bg-green-50 text-white' : 'bg-slate-200 text-slate-500'}`}>{o.status}</span>
                     </div>
                  </div>
               );
            })}
         </div>
      )}
    </div>
  );
};

// --- App Core ---

const App = () => {
  const [user, setUser] = useState<User | null>(getFromStorage('user', null));
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initial Sync and Realtime Listeners
  useEffect(() => {
    const fetchInitialData = async () => {
      // Profiles
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (profiles) setUsers(profiles.map(mapProfile));

      // Flowers
      const { data: fls } = await supabase.from('flowers').select('*');
      if (fls) setFlowers(fls.map(mapFlower));

      // Orders
      const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (ords) setOrders(ords.map(mapOrder));
    };

    fetchInitialData();

    // Subscribe to changes
    const profilesSub = supabase.channel('profiles-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        setUsers(prev => {
          if (payload.eventType === 'INSERT') return [...prev, mapProfile(payload.new)];
          if (payload.eventType === 'UPDATE') return prev.map(u => u.id === payload.new.id ? mapProfile(payload.new) : u);
          if (payload.eventType === 'DELETE') return prev.filter(u => u.id !== payload.old.id);
          return prev;
        });
      }).subscribe();

    const flowersSub = supabase.channel('flowers-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flowers' }, (payload) => {
        setFlowers(prev => {
          if (payload.eventType === 'INSERT') return [mapFlower(payload.new), ...prev];
          if (payload.eventType === 'UPDATE') return prev.map(f => f.id === payload.new.id ? mapFlower(payload.new) : f);
          if (payload.eventType === 'DELETE') return prev.filter(f => f.id !== payload.old.id);
          return prev;
        });
      }).subscribe();

    const ordersSub = supabase.channel('orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        setOrders(prev => {
          if (payload.eventType === 'INSERT') return [mapOrder(payload.new), ...prev];
          if (payload.eventType === 'UPDATE') return prev.map(o => o.id === payload.new.id ? mapOrder(payload.new) : o);
          if (payload.eventType === 'DELETE') return prev.filter(o => o.id !== payload.old.id);
          return prev;
        });
      }).subscribe();

    return () => {
      supabase.removeChannel(profilesSub);
      supabase.removeChannel(flowersSub);
      supabase.removeChannel(ordersSub);
    };
  }, []);

  // Update session user if users list changes
  useEffect(() => {
    if (user) {
      const refreshed = users.find(u => u.id === user.id);
      if (refreshed) {
        setUser(refreshed);
        saveToStorage('user', refreshed);
      }
    }
  }, [users]);

  // New order detection for florists
  useEffect(() => {
    if (user?.role === UserRole.FLORIST) {
       const myActiveOrders = orders.filter(o => o.floristId === user.id && o.status === OrderStatus.PLACED);
       const lastCount = Number(localStorage.getItem(`last_order_count_${user.id}`) || 0);
       
       if (myActiveOrders.length > lastCount) {
          showAlert("🔔 New Order Received! Check your dashboard.", "info");
          if ("Notification" in window && Notification.permission === "granted") {
             new Notification("New Pushpa Order!", { body: "A new floral request has arrived." });
          }
       }
       localStorage.setItem(`last_order_count_${user.id}`, myActiveOrders.length.toString());
    }
  }, [orders, user]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
       Notification.requestPermission();
    }
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => console.log("Location permission granted"),
        () => console.warn("Location permission denied")
      );
    }
  }, []);

  const currentT = TRANSLATIONS[user?.settings?.language || 'English'] || TRANSLATIONS.English;
  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => setAlert({ message, type });

  const completeOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    for (const item of order.items) {
      const flower = flowers.find(f => f.id === item.id);
      if (flower) {
        await supabase.from('flowers').update({ stock: Math.max(0, flower.stock - item.quantity) }).eq('id', item.id);
      }
    }

    const { error } = await supabase.from('orders').update({ status: OrderStatus.COMPLETED }).eq('id', id);
    if (!error) showAlert("Order completed.", "success");
    else showAlert("Failed to complete order.", "error");
  };

  const handleUpdateProfile = async (u: User) => {
    const { error } = await supabase.from('profiles').update({
      name: u.name,
      shop_name: u.shopName,
      shop_address: u.shopAddress,
      lat: u.lat,
      lng: u.lng,
      avatar: u.avatar,
      florist_status: u.floristStatus,
      is_blocked: u.isBlocked,
      addresses: u.addresses,
      settings: u.settings
    }).eq('id', u.id);

    if (!error) {
      setUser(u);
      showAlert("Profile updated.", "success");
    } else {
      showAlert("Profile update failed.", "error");
    }
  };

  if (!user) return (
    <Router>
      <Login 
        globalError={authError}
        showAlert={showAlert}
        onLogin={async (m, p, r) => {
          setAuthError(null);
          const { data: existing } = await supabase.from('profiles').select('*').eq('mobile', m).eq('role', r).maybeSingle();
          if (existing) {
            const u = mapProfile(existing);
            if (u.isBlocked) { setAuthError("Blocked by admin."); return; }
            if (u.password !== p) { setAuthError("Invalid PIN."); return; }
            setUser(u);
            saveToStorage('user', u);
          } else {
            setAuthError(`Account as ${r} not found.`);
          }
        }} 
        onRegister={async (m, p, extra) => {
          setAuthError(null);
          const profileId = `u${Date.now()}`;
          const newProfile = { 
            id: profileId, mobile: m, password: p, role: extra.role, name: extra.name,
            shop_name: extra.shopName, shop_address: extra.shopAddress, is_blocked: false, 
            addresses: [], settings: { theme: 'light', language: 'English', notifications: true },
            florist_status: extra.role === UserRole.FLORIST ? FloristStatus.PENDING : undefined 
          };
          const { error } = await supabase.from('profiles').insert([newProfile]);
          if (!error) {
            const u = mapProfile(newProfile);
            setUser(u);
            saveToStorage('user', u);
          } else {
            setAuthError("Registration failed.");
          }
        }}
      />
    </Router>
  );

  const themeClass = user.settings?.theme === 'dark' ? 'bg-slate-950 text-slate-100' : user.settings?.theme === 'sepia' ? 'bg-[#f8f1e1] text-[#5b4636]' : 'bg-slate-50 text-slate-900';

  return (
    <Router>
      <div className={`min-h-screen pt-14 pb-20 transition-colors duration-500 ${themeClass}`}>
        <Navbar t={currentT} user={user} cartCount={cart.reduce((s,i)=>s+i.quantity,0)} onLogout={() => { setUser(null); localStorage.removeItem('pushpa_user'); }} />
        {alert && <StatusAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        
        <Routes>
          {user.role === UserRole.CUSTOMER && (
            <>
              <Route path="/" element={<CustomerHome t={currentT} flowers={flowers.filter(f => {
                const florist = users.find(u => u.id === f.floristId);
                return florist?.floristStatus === FloristStatus.APPROVED;
              })} />} />
              <Route path="/flower/:id" element={<FlowerDetails t={currentT} flowers={flowers} onAddToCart={f => setCart(prev => {
                const existing = prev.find(i => i.id === f.id);
                if(existing) return prev.map(i => i.id === f.id ? {...i, quantity: i.quantity+1} : i);
                return [...prev, {...f, quantity: 1}];
              })} users={users} />} />
              <Route path="/cart" element={<Cart user={user} showAlert={showAlert} items={cart} onUpdateQty={(id,d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: i.quantity+d} : i).filter(i=>i.quantity>0))} onCheckout={async (a,ty) => {
                const activeItems = cart.filter(i => i.availability.includes(ty));
                if(activeItems.length === 0) return showAlert("Items not available for this mode.", "error");
                const floristGroups = activeItems.reduce((acc, item) => {
                  if (!acc[item.floristId]) acc[item.floristId] = [];
                  acc[item.floristId].push(item);
                  return acc;
                }, {} as Record<string, CartItem[]>);
                for (const floristId of Object.keys(floristGroups)) {
                  const floristItems = floristGroups[floristId];
                  await supabase.from('orders').insert([{
                    id: `ord${Date.now()}-${floristId}`, customer_id: user.id, florist_id: floristId,
                    items: floristItems, total: floristItems.reduce((s,i)=>s+(i.price*i.quantity),0)+(ty==='DELIVERY'?35:0),
                    status: OrderStatus.PLACED, address: a, delivery_type: ty, payment_method: 'COD', confirmed_by_customer: false
                  }]);
                }
                setCart(prev => prev.filter(i => !activeItems.some(ai => ai.id === i.id)));
                showAlert("Order placed!", "success");
              }} onUpdateProfile={handleUpdateProfile} />} />
              <Route path="/orders" element={<OrdersPage orders={orders.filter(o=>o.customerId===user.id)} onConfirmReceipt={completeOrder} t={currentT} onCancelOrder={async (id) => { 
                await supabase.from('orders').update({ status: OrderStatus.CANCELLED }).eq('id', id);
              }} onUpdateAddress={async (id, addr) => { 
                await supabase.from('orders').update({ address: addr }).eq('id', id);
              }} user={user} onUpdateProfile={handleUpdateProfile} users={users} />} />
            </>
          )}

          {user.role === UserRole.FLORIST && (
            <Route path="/seller/dashboard" element={<SellerDashboard flowers={flowers.filter(f=>f.floristId===user.id)} orders={orders.filter(o=>o.floristId===user.id)} users={users} showAlert={showAlert} onAddFlower={async (f) => { 
              if(user.floristStatus !== FloristStatus.APPROVED) return showAlert("Pending approval.", "error"); 
              let imageUrl = f.image;
              if (f.image?.startsWith('data:')) imageUrl = await uploadImage(f.image) || f.image;
              await supabase.from('flowers').insert([{
                id: `f${Date.now()}`, florist_id: user.id, name: f.name, local_name: f.localName,
                category: f.category, price: f.price, unit: f.unit, description: f.description,
                image: imageUrl, stock: f.stock, availability: f.availability
              }]);
            }} onEditFlower={async (id, d) => { 
              let imageUrl = d.image;
              if (d.image?.startsWith('data:')) imageUrl = await uploadImage(d.image) || d.image;
              await supabase.from('flowers').update({
                name: d.name, local_name: d.localName, category: d.category, price: d.price,
                unit: d.unit, description: d.description, image: imageUrl, stock: d.stock, availability: d.availability
              }).eq('id', id);
            }} onDeleteFlower={async id => { 
              await supabase.from('flowers').delete().eq('id', id);
            }} onUpdateOrderStatus={async (id,s) => { 
              if(s === OrderStatus.AWAITING_CONFIRMATION) await completeOrder(id); 
              else await supabase.from('orders').update({ status: s }).eq('id', id);
            }} />} />
          )}

          {user.role === UserRole.ADMIN && (
            <Route path="/admin" element={<AdminPanel users={users} orders={orders} onBlockUser={async id => { 
              const target = users.find(u => u.id === id);
              await supabase.from('profiles').update({ is_blocked: !target?.isBlocked }).eq('id', id);
            }} onApproveFlorist={async (id, s) => { 
              await supabase.from('profiles').update({ florist_status: s }).eq('id', id);
            }} />} />
          )}

          <Route path="/profile" element={<Profile user={user} onLogout={() => { setUser(null); localStorage.removeItem('pushpa_user'); }} onUpdateProfile={handleUpdateProfile} showAlert={showAlert} t={currentT} />} />
          <Route path="*" element={<Navigate to={user.role === UserRole.FLORIST ? "/seller/dashboard" : user.role === UserRole.ADMIN ? "/admin" : "/"} />} />
        </Routes>
        <BottomNav t={currentT} user={user} />
      </div>
    </Router>
  );
};

// --- Sub-Pages (Existing Components Kept Identical in UI) ---

const OrdersPage = ({ orders, onConfirmReceipt, t, onCancelOrder, onUpdateAddress, user, onUpdateProfile, users }: { orders: Order[], onConfirmReceipt: (id: string) => void, t: any, onCancelOrder: (id: string) => void, onUpdateAddress: (id: string, addr: string) => void, user: User, onUpdateProfile: (u: User) => void, users: User[] }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const active = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.REJECTED);
  const history = orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED || o.status === OrderStatus.REJECTED);

  const filtered = useMemo(() => {
    const list = showHistory ? history : active;
    if (!search) return list;
    return list.filter(o => 
      o.id.toLowerCase().includes(search.toLowerCase()) || 
      o.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [showHistory, active, history, search]);

  const selectedFlorist = useMemo(() => {
    if (!selectedOrder) return null;
    return users.find(u => u.id === selectedOrder.floristId);
  }, [selectedOrder, users]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-serif font-bold text-slate-800">My Orders</h1>
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button onClick={() => setShowHistory(false)} className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase transition ${!showHistory ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Active</button>
             <button onClick={() => setShowHistory(true)} className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase transition ${showHistory ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>History</button>
          </div>
        </div>
        <div className="relative">
           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
            type="text" 
            placeholder="Search orders..." 
            className="w-full bg-white border border-slate-100 py-3 pl-10 pr-4 rounded-xl text-xs font-medium shadow-sm outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
           />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(order => (
          <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm cursor-pointer hover:border-rose-100 transition animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-start mb-3">
              <span className="bg-slate-800 text-white px-2 py-0.5 rounded-full text-[8px] font-bold">#{order.id.split('-')[0].slice(-6)}</span>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900 tracking-tight">₹{order.total}</p>
                <p className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-lg inline-block mt-1 ${order.status === OrderStatus.COMPLETED ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>{order.status.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <h3 className="text-xs font-bold text-slate-800 mb-1.5">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</h3>
            <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5"><Clock size={12}/> {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-20 opacity-20 font-serif text-xl">No orders here.</div>}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
           <div className="bg-white w-full max-md rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in duration-200 overflow-y-auto no-scrollbar max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800">Track Order</h3>
                 <button onClick={() => setSelectedOrder(null)}><X size={20}/></button>
              </div>
              
              <OrderTimeline status={selectedOrder.status} type={selectedOrder.deliveryType} />

              <div className="space-y-4 mt-8 bg-slate-50 p-4 rounded-2xl">
                 <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Items Ordered</p>
                    <p className="text-xs font-bold text-slate-800 mt-1">{selectedOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                 </div>
                 
                 {selectedOrder.deliveryType === 'PICKUP' ? (
                   <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Shop Pickup Location</p>
                      <div className="mt-1 p-3 bg-white rounded-xl border border-slate-200">
                         <p className="text-xs font-bold text-rose-500">{selectedFlorist?.shopName}</p>
                         <p className="text-[10px] text-slate-600 mt-1 font-medium leading-relaxed italic">
                           {selectedFlorist?.shopAddress || "Address details not provided by shop."}
                         </p>
                         <div className="flex items-center gap-1.5 mt-2 text-[9px] text-slate-400 font-bold uppercase">
                            <PhoneCall size={10} className="text-slate-300"/> Call: +91 {selectedFlorist?.mobile}
                         </div>
                         <button 
                            onClick={() => openInMaps(selectedFlorist?.shopAddress || selectedFlorist?.lat, selectedFlorist?.lng)}
                            className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-xl text-[10px] font-bold uppercase shadow-md hover:bg-blue-600 transition"
                         >
                            <Navigation size={12}/> Use Map
                         </button>
                      </div>
                   </div>
                 ) : (
                   <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Delivery Destination</p>
                      <p className="text-xs font-bold text-slate-800 mt-1 flex items-start gap-1.5">
                        <MapPin size={12} className="mt-0.5 shrink-0 text-rose-500"/> {selectedOrder.address}
                      </p>
                   </div>
                 )}

                 <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total Offer</p>
                    <p className="text-sm font-bold text-rose-500">₹{selectedOrder.total}</p>
                 </div>
              </div>

              {!showHistory && selectedOrder.status === OrderStatus.PLACED && (
                 <button onClick={() => { onCancelOrder(selectedOrder.id); setSelectedOrder(null); }} className="w-full bg-slate-100 text-slate-400 py-3 rounded-xl text-xs font-bold uppercase mt-6">Cancel Order</button>
              )}
              {selectedOrder.status === OrderStatus.AWAITING_CONFIRMATION && (
                 <button onClick={() => { onConfirmReceipt(selectedOrder.id); setSelectedOrder(null); }} className="w-full bg-rose-500 text-white py-3 rounded-xl text-xs font-bold uppercase mt-6 shadow-lg">Confirm Receipt</button>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const Cart = ({ items, user, onUpdateQty, onCheckout, onUpdateProfile, showAlert }: { items: CartItem[], user: User, onUpdateQty: (id: string, delta: number) => void, onCheckout: (addr: string, type: DeliveryType) => void, onUpdateProfile: (u: User) => void, showAlert: (m: string, t?: any) => void }) => {
  const navigate = useNavigate();
  const deliveryItems = items.filter(i => i.availability.includes('DELIVERY'));
  const pickupItems = items.filter(i => i.availability.includes('PICKUP'));
  const [selectedFlow, setSelectedFlow] = useState<DeliveryType>('DELIVERY');
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddrData, setNewAddrData] = useState<Address>({ id: '', tag: '', details: '', isDefault: false });

  const activeItems = selectedFlow === 'DELIVERY' ? deliveryItems : pickupItems;
  const subtotal = activeItems.reduce((s, i) => s + (i.price * i.quantity), 0);
  const fee = selectedFlow === 'DELIVERY' ? 35 : 0;
  const total = subtotal + fee;

  const currentAddress = user.addresses.find(a => a.isDefault)?.details || (user.addresses.length > 0 ? user.addresses[0].details : 'No address set');

  if (items.length === 0) return <div className="p-40 text-center font-serif text-slate-300 text-2xl">Your bag is empty.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-in fade-in">
      <h1 className="text-2xl font-serif font-bold mb-6">Your Basket</h1>
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
         <button onClick={() => setSelectedFlow('DELIVERY')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition ${selectedFlow === 'DELIVERY' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Delivery ({deliveryItems.length})</button>
         <button onClick={() => setSelectedFlow('PICKUP')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition ${selectedFlow === 'PICKUP' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Pickup ({pickupItems.length})</button>
      </div>

      <div className="space-y-3 mb-8">
         {activeItems.map(item => (
           <div key={item.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
              <img src={item.image} className="w-14 h-14 rounded-xl object-cover" />
              <div className="flex-1">
                 <h4 className="text-[11px] font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                 <p className="text-[10px] font-bold text-rose-500">₹{item.price * item.quantity}</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg">
                 <button onClick={() => onUpdateQty(item.id, -1)} className="p-1 text-rose-500"><Minus size={12}/></button>
                 <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                 <button onClick={() => onUpdateQty(item.id, 1)} className="p-1 text-rose-500"><Plus size={12}/></button>
              </div>
           </div>
         ))}
      </div>

      {activeItems.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
           {selectedFlow === 'DELIVERY' && (
             <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-xl">
               <div className="flex items-start gap-2 overflow-hidden">
                 <MapPin size={14} className="text-rose-500 shrink-0 mt-0.5"/>
                 <p className="text-[10px] font-medium text-slate-500 truncate">{currentAddress}</p>
               </div>
               <button onClick={() => setShowAddressPicker(true)} className="text-[10px] font-bold uppercase text-rose-500 shrink-0 ml-3">Change</button>
             </div>
           )}
           <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-slate-400"><span>Items</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between text-xs text-slate-400"><span>Delivery Fee</span><span>₹{fee}</span></div>
              <div className="border-t border-dashed pt-3 flex justify-between text-lg font-bold text-slate-900"><span>Grand Total</span><span>₹{total}</span></div>
           </div>
           <button 
            onClick={() => {
              const addr = selectedFlow === 'DELIVERY' ? currentAddress : 'Shop Pickup';
              if (selectedFlow === 'DELIVERY' && currentAddress === 'No address set') return showAlert("Set address.", "error");
              onCheckout(addr, selectedFlow);
              navigate('/orders');
            }} 
            className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl text-xs uppercase shadow-lg active:scale-95 transition"
           >
             Place Order
           </button>
        </div>
      )}

      {showAddressPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
           <div className="bg-white w-full max-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in duration-200">
              {!isAddingNew ? (
                <>
                  <h3 className="text-md font-bold text-slate-800 mb-4">Choose Address</h3>
                  <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto no-scrollbar">
                     {user.addresses.map(a => (
                        <button 
                          key={a.id} 
                          onClick={() => { 
                            onUpdateProfile({...user, addresses: user.addresses.map(ad => ({...ad, isDefault: ad.id === a.id}))});
                            setShowAddressPicker(false);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition ${a.isDefault ? 'border-rose-500 bg-rose-50' : 'border-slate-100 hover:border-rose-200'}`}
                        >
                           <p className="text-xs font-bold text-slate-800">{a.tag}</p>
                           <p className="text-[10px] text-slate-500 truncate">{a.details}</p>
                        </button>
                     ))}
                     <button onClick={() => setIsAddingNew(true)} className="w-full p-3 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-2"><Plus size={14}/> Add New</button>
                  </div>
                  <button onClick={() => setShowAddressPicker(false)} className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-bold uppercase">Back</button>
                </>
              ) : (
                <>
                  <h3 className="text-md font-bold text-slate-800 mb-4">New Address</h3>
                  <div className="space-y-3">
                    <input placeholder="Label" className="w-full p-4 bg-slate-50 rounded-xl text-sm font-medium outline-none" value={newAddrData.tag} onChange={e => setNewAddrData({...newAddrData, tag: e.target.value})} />
                    <textarea placeholder="Address details..." className="w-full p-4 bg-slate-50 rounded-xl text-sm font-medium outline-none h-24" value={newAddrData.details} onChange={e => setNewAddrData({...newAddrData, details: e.target.value})} />
                    <div className="flex gap-2">
                       <button onClick={() => setIsAddingNew(false)} className="flex-1 py-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 uppercase">Cancel</button>
                       <button onClick={() => {
                          if(!newAddrData.tag || !newAddrData.details) return;
                          onUpdateProfile({...user, addresses: [...user.addresses, {...newAddrData, id: Date.now().toString(), isDefault: user.addresses.length === 0}]});
                          setIsAddingNew(false);
                       }} className="flex-1 py-3 rounded-xl text-xs font-bold bg-rose-500 text-white uppercase shadow-md">Add</button>
                    </div>
                  </div>
                </>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const FlowerDetails = ({ flowers, onAddToCart, t, users }: { flowers: Flower[], onAddToCart: (f: Flower) => void, t: any, users: User[] }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const flower = flowers.find(f => f.id === id);
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState(false);
  const florist = users.find(u => u.id === flower?.floristId);
  if (!flower) return <div className="p-20 text-center">Not found.</div>;
  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase"><ArrowLeft size={14} /> Back</button>
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-50 flex flex-col md:flex-row mb-6">
        <div className="md:w-1/2 relative">
          <img src={flower.image} className="w-full aspect-[4/3] md:aspect-square object-cover" />
          <button onClick={() => setZoom(true)} className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-xl shadow-md"><Maximize2 size={14} /></button>
        </div>
        <div className="p-5 md:p-8 flex flex-col justify-between flex-1">
          <div>
            <div className="flex justify-between items-start mb-2">
               <span className="bg-rose-50 text-rose-600 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">{flower.category}</span>
               {florist && <span className="text-[9px] font-bold text-slate-400 uppercase">{florist.shopName}</span>}
            </div>
            <h1 className="text-xl font-bold text-slate-800">{flower.name}</h1>
            <p className="text-xs text-rose-500 font-bold mb-3">{flower.localName}</p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-slate-900">₹{flower.price}</span>
              <span className="text-[10px] text-slate-400">/ {flower.unit}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal mb-6">{flower.description}</p>
          </div>
          <div className="flex flex-col gap-3">
             <div className="flex gap-2">
               <button onClick={() => { onAddToCart(flower); setAdded(true); setTimeout(() => setAdded(false), 2000); }} className={`flex-1 font-bold py-3.5 rounded-xl text-[10px] uppercase flex items-center justify-center gap-2 ${added ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{added ? 'Added' : 'Add to Basket'}</button>
               <button onClick={() => { onAddToCart(flower); navigate('/cart'); }} className="flex-[1.2] bg-rose-500 text-white font-bold py-3.5 rounded-xl text-[10px] uppercase">Buy Now</button>
             </div>
          </div>
        </div>
      </div>
      {zoom && <ZoomModal imageUrl={flower.image} onClose={() => setZoom(false)} />}
    </div>
  );
};

const Profile = ({ user, onLogout, onUpdateProfile, t, showAlert }: { user: User, onLogout: () => void, onUpdateProfile: (u: User) => void, t: any, showAlert: (m: string, t?: any) => void }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'address' | 'settings'>('info');
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <div className="bg-white rounded-3xl p-6 mb-6 flex flex-col items-center">
        <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-3">{user.name?.[0]}</div>
        <h2 className="text-lg font-bold text-slate-800">{user.name}</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">+91 {user.mobile}</p>
        <button onClick={onLogout} className="bg-rose-50 text-rose-600 px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase">Logout</button>
      </div>
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
         {['info', 'address', 'settings'].map(tab => (
           <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition ${activeTab === tab ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>{tab}</button>
         ))}
      </div>
      <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
        {activeTab === 'info' && (
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 block">Full Name</label>
            <input type="text" className="w-full p-4 bg-slate-50 rounded-xl text-sm font-medium outline-none" value={user.name || ''} onChange={e => onUpdateProfile({...user, name: e.target.value})} />
          </div>
        )}
        {activeTab === 'address' && (
          <div className="space-y-3">
             {user.role === UserRole.FLORIST ? (
                <textarea placeholder="Shop Address..." className="w-full p-4 bg-slate-50 rounded-xl text-sm h-32 outline-none" value={user.shopAddress} onChange={e => onUpdateProfile({...user, shopAddress: e.target.value})} />
             ) : (
                user.addresses.map(addr => (
                  <div key={addr.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center">
                     <div><p className="text-xs font-bold">{addr.tag}</p><p className="text-[10px] text-slate-500">{addr.details}</p></div>
                     <button onClick={() => onUpdateProfile({...user, addresses: user.addresses.filter(a => a.id !== addr.id)})} className="text-red-400"><Trash2 size={14}/></button>
                  </div>
                ))
             )}
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">Language</p>
                <select value={user.settings.language} onChange={e => onUpdateProfile({...user, settings: {...user.settings, language: e.target.value as any}})} className="bg-slate-50 p-2 rounded-lg text-xs font-bold">
                  <option value="English">English</option><option value="Hindi">Hindi</option><option value="Marathi">Marathi</option><option value="Tamil">Tamil</option>
                </select>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
