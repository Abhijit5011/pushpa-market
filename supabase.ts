
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://lcgrrtiubhfgcblomwzb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZ3JydGl1YmhmZ2NibG9td3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNzI1NTMsImV4cCI6MjA4Mjg0ODU1M30.3JXCNQUipjQc___OG_WyEfVEY02L9cvJArHeEjQGo8M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility to upload images to Supabase Storage Buckets
export const uploadImage = async (file: File | string, bucket: string = 'pushpa-media'): Promise<string | null> => {
  try {
    let fileBody: any = file;
    let fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    let extension = 'png';

    if (typeof file === 'string' && file.startsWith('data:')) {
      // Convert base64 to Blob
      const res = await fetch(file);
      fileBody = await res.blob();
      const mime = file.split(';')[0].split(':')[1];
      extension = mime.split('/')[1] || 'png';
    } else if (file instanceof File) {
      extension = file.name.split('.').pop() || 'png';
    }

    const path = `${fileName}.${extension}`;
    const { data, error } = await supabase.storage.from(bucket).upload(path, fileBody);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  } catch (err) {
    console.error("Supabase Storage Upload failed:", err);
    return null;
  }
};

// Helper for mapping DB snake_case to JS camelCase
export const mapProfile = (p: any) => ({
  id: p.id,
  mobile: p.mobile,
  password: p.password,
  role: p.role,
  name: p.name,
  shopName: p.shop_name,
  shopAddress: p.shop_address,
  lat: p.lat,
  lng: p.lng,
  avatar: p.avatar,
  floristStatus: p.florist_status,
  isBlocked: p.is_blocked,
  addresses: p.addresses || [],
  settings: p.settings || { theme: 'light', language: 'English', notifications: true }
});

export const mapFlower = (f: any) => ({
  id: f.id,
  name: f.name,
  localName: f.local_name,
  category: f.category,
  price: f.price,
  unit: f.unit,
  description: f.description,
  image: f.image,
  floristId: f.florist_id,
  stock: f.stock,
  availability: f.availability || []
});

export const mapOrder = (o: any) => ({
  id: o.id,
  customerId: o.customer_id,
  floristId: o.florist_id,
  items: o.items,
  total: o.total,
  status: o.status,
  createdAt: o.created_at,
  address: o.address,
  deliveryType: o.delivery_type,
  paymentMethod: o.payment_method,
  confirmedByCustomer: o.confirmed_by_customer
});
