export interface MenuVariation {
  variation_id: string;
  name: string; // e.g., "Half", "Full", "Regular", "Large"
  price: number;
}

export interface MenuAddon {
  addon_id: string;
  name: string; // e.g., "Extra Cheese", "Peri Peri Dip"
  price: number;
}

export interface MenuItem {
  item_id: string; // Petpooja Item ID
  name: string;
  hinglishAliases: string[];
  category: string;
  basePrice: number;
  variations: MenuVariation[];
  addons: MenuAddon[];
  inStock: boolean;
  gstPercent: number;
  prepTimeMins: number;
  isVeg: boolean;
}

export interface RestaurantOutlet {
  id: string;
  petpoojaRestId: string;
  name: string;
  brandGroup: string;
  area: string;
  city: string;
  virtualDidNumber: string;
  forwardedSimNumber: string;
  dayWindow: string;
  rushWindow: string;
  isOpenNow: boolean;
  activeChannels: number;
  ordersTonight: number;
  avgHandleTimeSec: number;
  deliveryCharge: number;
  packagingCharge: number;
  deliveryRadiusKm: number;
  menu: MenuItem[];
}

export interface OrderLineItem {
  item_id: string;
  item_name: string;
  variation_id: string;
  variation_name: string;
  quantity: number;
  unit_price: number;
  addons: { addon_id: string; name: string; price: number }[];
  total_price: number;
}

export type OrderStage =
  | 'greeting'
  | 'collecting_items'
  | 'confirming_address'
  | 'ready_to_push'
  | 'pushed_to_petpooja'
  | 'human_handover';

export interface VoiceOrderDraft {
  customerName: string;
  customerPhone: string;
  isRepeatCustomer: boolean;
  deliveryAddress: string;
  landmark: string;
  locationPinStatus: 'verified' | 'pending_whatsapp_pin' | 'repeat_saved';
  paymentMode: 'UPI_LINK' | 'COD';
  paymentStatus: 'pending' | 'link_sent' | 'paid' | 'cod_confirmed';
  items: OrderLineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  packagingCharge: number;
  deliveryCharge: number;
  grandTotal: number;
  stage: OrderStage;
  confidenceScore: number;
  petpoojaOrderId?: string;
  kotNumber?: string;
  specialInstructions?: string;
}

export interface ConversationTurn {
  id: string;
  speaker: 'customer' | 'ai_agent' | 'system';
  text: string;
  timestamp: string;
  language?: string;
  extractedAction?: string;
}

export interface SipCallChannel {
  channelNumber: number; // 1 to 10
  channelId: string; // e.g., "SIP-TRUNK-01"
  status: 'active_ai' | 'pushing_kot' | 'human_transfer' | 'idle';
  callerPhone: string;
  callerName: string;
  isRepeatCaller: boolean;
  restaurantId: string;
  restaurantName: string;
  durationSec: number;
  language: 'Hinglish' | 'Hindi' | 'English';
  stage: OrderStage;
  liveTranscriptSnippet: string;
  aiResponseSnippet: string;
  orderTotal: number;
  itemCount: number;
  paymentMode: 'UPI_LINK' | 'COD';
  petpoojaKot?: string;
}

export type TrustTier = 'repeat_verified' | 'low_history' | 'new_unknown';

export interface TrustDecision {
  tier: TrustTier;
  allowCOD: boolean;
  requireAdvance: number;
  requirePrepaidFull: boolean;
  maxCODAmount: number;
  reason: string;
}

export type QROrderStatus =
  | 'pending_pay'
  | 'pending_staff_accept'
  | 'accepted'
  | 'pushed_to_petpooja'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export interface QROrder {
  orderId: string;
  outletId: string;
  petpoojaRestId: string;
  customerPhone: string;
  collegeId?: string;
  customerName: string;
  isRepeat: boolean;
  trustTier: TrustTier;
  items: OrderLineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  packagingCharge: number;
  deliveryCharge: number;
  grandTotal: number;
  advancePaid: number;
  paymentMode: 'UPI_PREPAID' | 'COD' | 'COUNTER';
  paymentStatus: 'unpaid' | 'advance_paid' | 'paid' | 'failed';
  status: QROrderStatus;
  tableNo?: string;
  blockNumber: string;
  roomNo?: string;
  instructions?: string;
  deliveryAddress?: string;
  createdAt: string;
  kotNumber?: string;
}

export interface SavedCustomerProfile {
  phone: string;
  collegeId?: string;
  name: string;
  savedAddress: string;
  landmark: string;
  lastOrderedOutletId: string;
  lastOrderSummary: string;
  totalOrders: number;
  successCount?: number;
  failCount?: number;
  blacklisted?: boolean;
  preferredLanguage: 'Hinglish' | 'Hindi' | 'English';
}
