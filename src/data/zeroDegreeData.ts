export interface ZDVariant {
  label: string;
  price: number;
}

export interface ZDItem {
  id: string;
  name: string;
  desc?: string;
  veg: boolean;
  variants: ZDVariant[];
  tag?: string;
}

export interface ZDCategory {
  title: string;
  color: string;
  items: ZDItem[];
}

export const ZERO_DEGREE_OUTLET = {
  id: 'zd-main',
  name: 'ZERO DEGREE CAFE',
  sub: 'Sip & Eat | Estd 2023',
  address: 'G1 Block near Chief Warden Office, GHS Hostel, Manipal University Jaipur',
  phone: '+91 82336 73311',
  hours: 'Open 11 AM - 11 PM, all days',
};

// Pilot staff directory: cafe names per outlet (no secrets — PINs live server-side).
export const OUTLET_CREDENTIALS: { outletId: string; cafeName: string }[] = [
  { outletId: 'zd-main', cafeName: 'ZERO DEGREE CAFE' },
];

export const ZERO_DEGREE_MENU: ZDCategory[] = [
  {
    title: 'PIZZA - Freshly Authentic Hand Tossed 7 / 11 / 16',
    color: '#8b5cf6',
    items: [
      { id: 'pz1', name: 'Classic Margarita (Plain Cheese)', veg: true, variants: [{ label: '7"', price: 130 }, { label: '11"', price: 230 }, { label: '16"', price: 420 }] },
      { id: 'pz2', name: 'Double Cheese (Cheese on Cheese)', veg: true, variants: [{ label: '7"', price: 170 }, { label: '11"', price: 230 }, { label: '16"', price: 450 }] },
      { id: 'pz3', name: 'Farmhouse Pizza (Onion Tomato Capsicum)', veg: true, variants: [{ label: '7"', price: 190 }, { label: '11"', price: 280 }, { label: '16"', price: 450 }] },
      { id: 'pz4', name: 'Kadhai Paneer Pizza', veg: true, variants: [{ label: '7"', price: 210 }, { label: '11"', price: 310 }, { label: '16"', price: 500 }] },
      { id: 'pz5', name: 'Makhani Paneer Tikka', veg: true, variants: [{ label: '7"', price: 210 }, { label: '11"', price: 310 }, { label: '16"', price: 500 }] },
      { id: 'pz6', name: 'Exotica (Olive Jalapeno Corn)', veg: true, variants: [{ label: '7"', price: 220 }, { label: '11"', price: 330 }, { label: '16"', price: 550 }] },
      { id: 'pz7', name: 'Chicken BBQ Tikka (Onion Paprika BBQ Chicken)', veg: false, variants: [{ label: '7"', price: 220 }, { label: '11"', price: 330 }, { label: '16"', price: 550 }] },
      { id: 'pz8', name: 'Spicy Chicken Delight', veg: false, variants: [{ label: '7"', price: 220 }, { label: '11"', price: 330 }, { label: '16"', price: 550 }] },
      { id: 'pz9', name: 'Chicken Keema Feast', veg: false, variants: [{ label: '7"', price: 220 }, { label: '11"', price: 330 }, { label: '16"', price: 550 }] },
      { id: 'pz10', name: 'Chicken Pepperoni', veg: false, variants: [{ label: '7"', price: 220 }, { label: '11"', price: 350 }, { label: '16"', price: 650 }] },
      { id: 'pz11', name: 'Chicken Supreme (Tikka Meatball Salami)', veg: false, variants: [{ label: '7"', price: 220 }, { label: '11"', price: 350 }, { label: '16"', price: 650 }] },
      { id: 'pz12', name: 'Chicken Sausage Pizza', veg: false, variants: [{ label: '7"', price: 210 }, { label: '11"', price: 330 }, { label: '16"', price: 600 }] },
    ],
  },
  {
    title: 'COLD COFFEE FRAPPES',
    color: '#0ea5e9',
    items: [
      { id: 'cc1', name: 'Cold Coffee (Best Buy)', veg: true, tag: 'Best Buy', variants: [{ label: 'Regular', price: 70 }] },
      { id: 'cc2', name: 'Caramel - Hazelnut Frappe', veg: true, variants: [{ label: 'Regular', price: 80 }, { label: 'Large', price: 100 }] },
    ],
  },
  {
    title: 'FRENCH FRIES',
    color: '#16a34a',
    items: [
      { id: 'fr1', name: 'Salted Fries', veg: true, variants: [{ label: '', price: 80 }] },
      { id: 'fr2', name: 'Masala Fries', veg: true, variants: [{ label: '', price: 90 }] },
      { id: 'fr3', name: 'Peri Peri Fries', veg: true, variants: [{ label: '', price: 100 }] },
      { id: 'fr4', name: 'Melted Cheese Fries', veg: true, variants: [{ label: '', price: 150 }] },
      { id: 'fr5', name: 'Chicken Fries', veg: false, variants: [{ label: '', price: 130 }] },
    ],
  },
];

export const HOSTEL_BLOCKS = [
  'B1', 'B2', 'B3', 'B4', 'B5',
  'G1', 'G2', 'G3', 'G4',
  'Mess pickup',
];
