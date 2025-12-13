
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category?: string; // Changed from enum to string to support custom categories
  duration?: number; // minutes
  scheduledTime?: string; // HH:MM format
  scheduledDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format for tasks ending on a specific date
  completedAt?: string; // ISO Date string for sorting completed tasks
  createdAt: string; // ISO Date string, required for the 24h rename rule
  recurring?: boolean; // If true, this task repeats
}

export interface Template {
  id: string;
  name: string;
  tasks: Task[];
  createdAt?: string;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  completedCount: number;
  totalCount: number;
  steps?: number;
  tasks?: Task[]; // Store the historical tasks
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ShopItem {
  id: string;
  title: string;
  price: number; // Stored as number for calc
  category: string;
  rating: number;
  image: string;
  tag?: string;
  description?: string;
  views: number;
  reviews: Review[];
}

export interface CartItem extends ShopItem {
  quantity: number;
}

export type FastingPlanType = '16:8' | '18:6' | '20:4' | 'OMAD' | 'Custom';

export interface FastingSession {
  id: string;
  name?: string; // Custom name
  startTime: string; // ISO
  endTime?: string; // ISO (if completed)
  targetDuration: number; // hours
  plan: FastingPlanType;
  scheduledStartTime?: string; // ISO, if scheduled for future
}

export interface FastingPreset {
  id: string;
  name: string;
  duration: number; // hours
}

export interface WeightEntry {
  id: string;
  date: string;
  value: number; // kg
}

export interface NoteEntry {
  id: string;
  date: string;
  content: string;
  type: 'journal' | 'electrolytes' | 'blood';
}

export interface AppState {
  tasks: Task[];
  history: DayLog[];
  lastLogin: string;
  categories: string[]; // User defined categories
  templates: Template[];
  steps: number;
  userName?: string;
  theme?: 'light' | 'dark';
  createClicks?: number; // Admin analytics
  cart?: CartItem[];
  fastingHistory?: FastingSession[];
  activeFast?: FastingSession | null;
  fastingPresets?: FastingPreset[];
  weightHistory?: WeightEntry[];
  notes?: NoteEntry[];
  isPro?: boolean;
  hasStoragePermission?: boolean;
}

export type Tab = 'dashboard' | 'mentor' | 'fasting' | 'stats' | 'shop';