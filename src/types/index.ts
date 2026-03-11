export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  color: string;
  avatar: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  time?: string;
  endTime?: string;
  memberId: string;
  category: 'pickup' | 'work' | 'school' | 'appointment' | 'activity' | 'deadline' | 'other';
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agentId?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  createdBy: string;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string;
  dueDate?: string;
  completed: boolean;
  category: 'chore' | 'errand' | 'homework' | 'other';
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  category: 'groceries' | 'household' | 'school' | 'other';
  addedBy: string;
  checked: boolean;
}

export interface MealPlan {
  id: string;
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner';
  recipe: string;
  prepBy?: string;
  notes?: string;
}

export interface BulletinPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  pinned: boolean;
  category: 'announcement' | 'reminder' | 'note' | 'achievement';
}
