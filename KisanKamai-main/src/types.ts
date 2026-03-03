export enum UserRole {
  OWNER = 'owner',
  RENTER = 'renter',
  ADMIN = 'admin'
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  phoneNumber?: string;
  location?: string;
  address?: string;
  village?: string;
  fieldArea?: number;
}

export interface Equipment {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  category: string;
  pricePerDay?: number;
  pricePerAcre: number;
  location: string;
  description: string;
  imageUrls: string[];
  status?: string;
  createdAt: any;
}

export enum BookingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}

export interface Booking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  ownerId: string;
  renterId: string;
  renterName: string;
  startDate: string;
  endDate?: string;
  time?: string;
  area?: number;
  totalPrice: number;
  status: BookingStatus;
  paymentProofUrl?: string;
  createdAt: any;
}

export interface Dispute {
  id: string;
  bookingId: string;
  raisedBy: string;
  reason: string;
  status: 'open' | 'resolved';
  createdAt: any;
}
