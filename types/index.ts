// BillSnap Types

// Shop Mode - Quick for street vendors, Normal for full receipts
export type ShopMode = 'quick' | 'normal';

export const SHOP_MODES: { value: ShopMode; label: string; labelTh: string; icon: string; description: string; descriptionTh: string }[] = [
  {
    value: 'quick',
    label: 'Quick Mode',
    labelTh: 'โหมดเร็ว',
    icon: 'flash',
    description: 'Perfect for street vendors & fast sales. Just tap the amount and go - no items, no customer names, just quick transactions.',
    descriptionTh: 'เหมาะสำหรับแผงลอยและขายเร็ว แค่กดจำนวนเงินแล้วเสร็จ ไม่ต้องใส่รายการสินค้า ไม่ต้องใส่ชื่อลูกค้า',
  },
  {
    value: 'normal',
    label: 'Full Mode',
    labelTh: 'โหมดเต็ม',
    icon: 'receipt',
    description: 'For shops that need detailed receipts. Add items, customer names, VAT, and share professional receipts via LINE.',
    descriptionTh: 'สำหรับร้านค้าที่ต้องการใบเสร็จละเอียด เพิ่มรายการสินค้า ชื่อลูกค้า VAT และแชร์ใบเสร็จผ่าน LINE',
  },
];

// Store Types
export type StoreType = 'street_food' | 'drinks' | 'clothing' | 'food' | 'grocery' | 'market' | 'beauty' | 'electronics' | 'repair' | 'general' | 'service';

export const STORE_TYPES: { value: StoreType; label: string; labelTh: string; icon: string }[] = [
  { value: 'street_food', label: 'Food', labelTh: 'อาหาร', icon: 'flame-outline' },
  { value: 'drinks', label: 'Café', labelTh: 'คาเฟ่', icon: 'cafe-outline' },
  { value: 'food', label: 'Diner', labelTh: 'ร้านอาหาร', icon: 'restaurant-outline' },
  { value: 'clothing', label: 'Clothes', labelTh: 'เสื้อผ้า', icon: 'shirt-outline' },
  { value: 'beauty', label: 'Beauty', labelTh: 'ความงาม', icon: 'sparkles-outline' },
  { value: 'grocery', label: 'Grocery', labelTh: 'ของชำ', icon: 'cart-outline' },
  { value: 'market', label: 'Market', labelTh: 'ตลาด', icon: 'pricetag-outline' },
  { value: 'electronics', label: 'Tech', labelTh: 'เทค', icon: 'phone-portrait-outline' },
  { value: 'repair', label: 'Repair', labelTh: 'ซ่อม', icon: 'build-outline' },
  { value: 'general', label: 'Store', labelTh: 'ร้านค้า', icon: 'storefront-outline' },
  { value: 'service', label: 'Services', labelTh: 'บริการ', icon: 'construct-outline' },
];

export const CATEGORIES_BY_STORE_TYPE: Record<StoreType, { value: string; label: string; labelTh: string }[]> = {
  street_food: [
    { value: 'grilled', label: 'Grilled', labelTh: 'ปิ้งย่าง' },
    { value: 'noodles', label: 'Noodles', labelTh: 'ก๋วยเตี๋ยว' },
    { value: 'rice', label: 'Rice Dishes', labelTh: 'ข้าว' },
    { value: 'snacks', label: 'Snacks', labelTh: 'ของทานเล่น' },
    { value: 'desserts', label: 'Desserts', labelTh: 'ของหวาน' },
  ],
  drinks: [
    { value: 'coffee', label: 'Coffee', labelTh: 'กาแฟ' },
    { value: 'tea', label: 'Tea/Milk Tea', labelTh: 'ชา/ชานม' },
    { value: 'smoothie', label: 'Smoothie/Frappe', labelTh: 'สมูทตี้/ปั่น' },
    { value: 'juice', label: 'Fresh Juice', labelTh: 'น้ำผลไม้' },
    { value: 'other', label: 'Other', labelTh: 'อื่นๆ' },
  ],
  clothing: [
    { value: 'tops', label: 'Tops', labelTh: 'เสื้อ' },
    { value: 'bottoms', label: 'Bottoms', labelTh: 'กางเกง/กระโปรง' },
    { value: 'dresses', label: 'Dresses', labelTh: 'ชุดเดรส' },
    { value: 'accessories', label: 'Accessories', labelTh: 'เครื่องประดับ' },
    { value: 'shoes', label: 'Shoes', labelTh: 'รองเท้า' },
    { value: 'bags', label: 'Bags', labelTh: 'กระเป๋า' },
  ],
  food: [
    { value: 'main', label: 'Main Dishes', labelTh: 'อาหารจานหลัก' },
    { value: 'drinks', label: 'Drinks', labelTh: 'เครื่องดื่ม' },
    { value: 'desserts', label: 'Desserts', labelTh: 'ของหวาน' },
    { value: 'appetizers', label: 'Appetizers', labelTh: 'อาหารเรียกน้ำย่อย' },
    { value: 'sets', label: 'Set Meals', labelTh: 'ชุดเซ็ต' },
  ],
  grocery: [
    { value: 'fresh', label: 'Fresh Food', labelTh: 'อาหารสด' },
    { value: 'snacks', label: 'Snacks', labelTh: 'ขนม' },
    { value: 'drinks', label: 'Drinks', labelTh: 'เครื่องดื่ม' },
    { value: 'household', label: 'Household', labelTh: 'ของใช้ในบ้าน' },
    { value: 'other', label: 'Other', labelTh: 'อื่นๆ' },
  ],
  market: [
    { value: 'produce', label: 'Produce', labelTh: 'ผักผลไม้' },
    { value: 'meat', label: 'Meat', labelTh: 'เนื้อสัตว์' },
    { value: 'seafood', label: 'Seafood', labelTh: 'อาหารทะเล' },
    { value: 'dry_goods', label: 'Dry Goods', labelTh: 'ของแห้ง' },
    { value: 'other', label: 'Other', labelTh: 'อื่นๆ' },
  ],
  beauty: [
    { value: 'haircut', label: 'Haircut', labelTh: 'ตัดผม' },
    { value: 'nails', label: 'Nails', labelTh: 'ทำเล็บ' },
    { value: 'facial', label: 'Facial', labelTh: 'ดูแลผิวหน้า' },
    { value: 'makeup', label: 'Makeup', labelTh: 'แต่งหน้า' },
    { value: 'products', label: 'Products', labelTh: 'ผลิตภัณฑ์' },
  ],
  electronics: [
    { value: 'phones', label: 'Phones', labelTh: 'โทรศัพท์' },
    { value: 'accessories', label: 'Accessories', labelTh: 'อุปกรณ์เสริม' },
    { value: 'repairs', label: 'Repairs', labelTh: 'ซ่อม' },
    { value: 'computers', label: 'Computers', labelTh: 'คอมพิวเตอร์' },
    { value: 'other', label: 'Other', labelTh: 'อื่นๆ' },
  ],
  repair: [
    { value: 'phone', label: 'Phone Repair', labelTh: 'ซ่อมมือถือ' },
    { value: 'computer', label: 'Computer Repair', labelTh: 'ซ่อมคอม' },
    { value: 'appliance', label: 'Appliance Repair', labelTh: 'ซ่อมเครื่องใช้ไฟฟ้า' },
    { value: 'vehicle', label: 'Vehicle Repair', labelTh: 'ซ่อมรถ' },
    { value: 'other', label: 'Other', labelTh: 'อื่นๆ' },
  ],
  general: [
    { value: 'electronics', label: 'Electronics', labelTh: 'อิเล็กทรอนิกส์' },
    { value: 'home', label: 'Home', labelTh: 'ของใช้ในบ้าน' },
    { value: 'beauty', label: 'Beauty', labelTh: 'ความงาม' },
    { value: 'food', label: 'Food', labelTh: 'อาหาร' },
    { value: 'other', label: 'Other', labelTh: 'อื่นๆ' },
  ],
  service: [
    { value: 'basic', label: 'Basic Service', labelTh: 'บริการพื้นฐาน' },
    { value: 'premium', label: 'Premium Service', labelTh: 'บริการพรีเมียม' },
    { value: 'package', label: 'Package', labelTh: 'แพ็คเกจ' },
    { value: 'addon', label: 'Add-on', labelTh: 'บริการเสริม' },
    { value: 'consultation', label: 'Consultation', labelTh: 'ปรึกษา' },
  ],
};

export interface Shop {
  id: string;
  user_id: string | null;
  name: string;
  contact: string | null;
  promptpay_id: string | null;
  logo_url: string | null;
  is_pro: boolean;
  receipts_this_month: number;
  created_at: string;
  store_type?: StoreType;
  shop_mode?: ShopMode;
  onboarding_completed_at?: string | null;
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Receipt {
  id: string;
  shop_id: string;
  receipt_number: string;
  items: ReceiptItem[];
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  customer_name?: string;
  status: 'paid' | 'pending' | 'refunded';
  created_at: string;
}

// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          contact: string | null;
          promptpay_id: string | null;
          logo_url: string | null;
          is_pro: boolean;
          receipts_this_month: number;
          created_at: string;
          store_type: StoreType;
          shop_mode: ShopMode;
          onboarding_completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          contact?: string | null;
          promptpay_id?: string | null;
          logo_url?: string | null;
          is_pro?: boolean;
          receipts_this_month?: number;
          created_at?: string;
          store_type?: StoreType;
          shop_mode?: ShopMode;
          onboarding_completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          contact?: string | null;
          promptpay_id?: string | null;
          logo_url?: string | null;
          is_pro?: boolean;
          receipts_this_month?: number;
          created_at?: string;
          store_type?: StoreType;
          shop_mode?: ShopMode;
          onboarding_completed_at?: string | null;
        };
        Relationships: [];
      };
      receipts: {
        Row: {
          id: string;
          shop_id: string;
          receipt_number: string;
          items: Json;
          subtotal: number;
          vat: number;
          total: number;
          notes: string | null;
          customer_name: string | null;
          status: 'paid' | 'pending' | 'refunded';
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          receipt_number: string;
          items: Json;
          subtotal: number;
          vat: number;
          total: number;
          notes?: string | null;
          customer_name?: string | null;
          status?: 'paid' | 'pending' | 'refunded';
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          receipt_number?: string;
          items?: Json;
          subtotal?: number;
          vat?: number;
          total?: number;
          notes?: string | null;
          customer_name?: string | null;
          status?: 'paid' | 'pending' | 'refunded';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipts_shop_id_fkey";
            columns: ["shop_id"];
            referencedRelation: "shops";
            referencedColumns: ["id"];
          }
        ];
      };
      preset_items: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          price: number;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          price: number;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          price?: number;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "preset_items_shop_id_fkey";
            columns: ["shop_id"];
            referencedRelation: "shops";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Preset Item (saved items for quick receipt creation)
export interface PresetItem {
  id: string;
  shop_id?: string;
  name: string;
  price: number;
  category?: string | null;
  created_at?: string;
}

// Item Categories
export const ITEM_CATEGORIES = [
  'เสื้อผ้า',
  'กระเป๋า',
  'เครื่องประดับ',
  'อื่นๆ',
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];

// Form types
export interface NewReceiptItem {
  name: string;
  price: string;
  quantity: string;
}

// Constants
export const VAT_RATE = 0.07;
export const FREE_TIER_LIMIT = 30;
