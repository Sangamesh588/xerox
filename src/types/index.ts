export type PrintColorMode = 'bw' | 'color';
export type PrintSideMode = 'single' | 'double';
export type NUpMode = '1in1' | '2in1' | '4in1'; // 4in1 = 4 pages per sheet (2 front, 2 back)
export type PaperSize = 'A4' | 'A3' | 'Legal' | 'Letter';
export type PaperGSM = '70' | '80' | '100';
export type BindingType = 'none' | 'staple' | 'spiral' | 'hardcover' | 'corner_clip';
export type OrderStatus = 'pending' | 'printing' | 'ready' | 'completed' | 'cancelled';
export type FulfillmentType = 'pickup';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
}

export interface XeroxShop {
  id: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerUsername: string; // Login ID for Shop Owner
  ownerPassword?: string; // Login Password for Shop Owner
  address: string;
  lat: number;
  lng: number;
  googleMapsUrl?: string; // Custom Google Maps link for the shop location
  distanceKm?: number;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  openingHours: string;
  rates: {
    bwSingle: number;       // e.g. ₹1.50
    bwDouble: number;       // e.g. ₹2.50
    colorSingle: number;    // e.g. ₹6.00
    colorDouble: number;    // e.g. ₹10.00
    spiralBinding: number;  // e.g. ₹30.00
    hardBinding: number;    // e.g. ₹80.00
    cornerClip: number;     // e.g. ₹15.00
  };
  features: string[];
}

export interface PrintConfiguration {
  colorMode: PrintColorMode;
  sideMode: PrintSideMode;
  nUp: NUpMode;
  paperSize: PaperSize;
  paperGsm: PaperGSM;
  binding: BindingType;
  pageRangeType: 'all' | 'custom';
  startPage: number;
  endPage: number;
  customPageRange: string;
  copies: number;
  orientation: 'portrait' | 'landscape' | 'auto';
}

export interface DocumentDetails {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl?: string;
  totalPages: number;
}

export interface PriceBreakdown {
  effectivePages: number;
  sheetsNeeded: number;
  printCost: number;
  bindingCost: number;
  gsmCost: number;
  paperSizeCost: number;
  deliveryFee: number;
  totalCost: number;
}

export interface XeroxOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shopId: string;
  shopName: string;
  document: DocumentDetails;
  config: PrintConfiguration;
  pricing: PriceBreakdown;
  fulfillment: FulfillmentType;
  deliveryAddress?: string;
  status: OrderStatus;
  paymentId?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: string;
  updatedAt: string;
  otpForPickup?: string;
}

export interface ShopEarningsAnalytics {
  timeframe: '1week' | '1month' | '1year';
  totalEarnings: number;
  totalOrders: number;
  totalPrintedPages: number;
  chartData: {
    label: string;
    earnings: number;
    pages: number;
  }[];
}

export interface AuthSession {
  role: 'customer' | 'owner' | 'admin';
  shopId?: string;
  username?: string;
}
