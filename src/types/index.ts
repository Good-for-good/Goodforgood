export type TrusteeRole = 
  | 'President'
  | 'Vice President'
  | 'Secretary Treasurer'
  | 'Managing Trustee'
  | 'Program Director'
  | 'Logistics Coordinator'
  | 'Digital Engagement Coordinator'
  | 'Volunteer Coordinator'
  | 'Volunteer'
  | 'IT Team'
  | 'Social Media Team'
  | 'General Trustee';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: Date;
  contributions: Contribution[];
  trusteeRole?: TrusteeRole;
  roleStartDate?: any; // Firestore Timestamp
  roleEndDate?: any;   // Firestore Timestamp
}

export interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  date: Date;
  month: string;
  year: number;
}

export interface Donation {
  id: string;
  donor: string;
  amount: number;
  date: any; // Firestore Timestamp
  purpose: string;
  notes?: string;
  type?: 'member' | 'general';
  memberId?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: any; // Firestore Timestamp
  category: string;
  paymentMethod: string;
  paidTo: string;
  billNumber?: string;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: any; // Firestore Timestamp
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizer: string;
  maxParticipants?: number;
  currentParticipants?: number;
  participants?: string[]; // Array of member IDs
  budget?: number;
  actualAmount?: number; // Amount actually spent/contributed
  contributionDate?: any; // When the contribution was made
  contributionNotes?: string; // Any notes about the contribution
  expenses?: number;
  notes?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface WorkshopResource {
  id?: string;
  name: string;
  specialization: string;
  type: 'member' | 'external';
  expertise: string[];
  reference: {
    name: string;
    relationship: string;
    contactDetails: {
      email: string;
      phone: string;
    };
  };
  contactDetails: {
    email: string;
    phone: string;
    address: string;
  };
  availability: string;
  previousWorkshops: string;
  notes: string;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

export interface Meeting {
  id?: string;
  title: string;
  date: any; // Firestore Timestamp
  startTime: string;
  endTime: string;
  location: string;
  attendees: {
    id: string;
    name: string;
    role?: string;
    present: boolean;
  }[];
  agenda: string;
  minutes: string;
  decisions: string[];
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  createdAt?: any;
  updatedAt?: any;
}

export interface Link {
  id: string;
  title: string;          // e.g., "GG Docs", "GG Files"
  url: string;            // The actual URL to the resource
  category: string;       // e.g., "Documents", "Media", "Events"
  description?: string;   // Optional description of what this link contains
  icon?: string;         // Optional icon identifier
  createdAt: any;        // Firestore Timestamp
  updatedAt: any;        // Firestore Timestamp
} 