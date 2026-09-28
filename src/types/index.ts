// ─── Auth / User ─────────────────────────────────────────────────────────────

export type UserRole =
  | 'super_admin'
  | 'diocese_admin'
  | 'church_admin'
  | 'priest'
  | 'pa'
  | 'volunteer'
  | 'family_head'
  | 'member';

export interface User {
  _id: string;
  phone: string;
  email?: string;
  role: UserRole;
  churchId: string;
  dioceseId: string;
  familyCardId?: string;
  profile: {
    firstName: string;
    lastName: string;
    photoUrl?: string;
    dob?: string;
    gender?: 'M' | 'F' | 'other';
  };
  preferences: {
    language: 'en' | 'ta';
    notifications: {
      mass: boolean;
      donations: boolean;
      announcements: boolean;
      certificates: boolean;
    };
  };
  isVerified: boolean;
}

// ─── Church / Diocese ─────────────────────────────────────────────────────────

export interface Diocese {
  _id: string;
  name: string;
  nameTA: string;
  bishop: { name: string; email: string; phone: string };
  address: Address;
  contactEmail: string;
  contactPhone: string;
}

export interface Church {
  _id: string;
  dioceseId: string;
  name: string;
  nameTA: string;
  code: string;
  address: Address;
  contact: { phone: string; email: string; website?: string };
  youtubeChannelId?: string;
  youtubeChannelUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
  foundedYear?: number;
  patronSaint?: string;
  feastDay?: string;
  stats: { totalFamilies: number; totalMembers: number };
}

export interface Address {
  street: string;
  area?: string;
  city: string;
  state?: string;
  pincode: string;
  coordinates?: { lat: number; lng: number };
}

// ─── Family ───────────────────────────────────────────────────────────────────

export interface Sacrament {
  received: boolean;
  date?: string;
  place?: string;
  priest?: string;
  certificateUrl?: string;
}

export interface FamilyMember {
  _id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  dob?: string;
  gender?: 'M' | 'F';
  relation: 'head' | 'spouse' | 'son' | 'daughter' | 'parent' | 'other';
  occupation?: string;
  photoUrl?: string;
  sacraments: {
    baptism: Sacrament;
    holyCommunion: Sacrament;
    confirmation: Sacrament;
    marriage: Sacrament & { spouseName?: string };
  };
  isDeceased?: boolean;
}

export interface Family {
  _id: string;
  churchId: string;
  cardNumber: string;
  familyName: string;
  headUserId: string;
  address: Address;
  members: FamilyMember[];
  registeredAt: string;
  isActive: boolean;
}

// ─── Mass ─────────────────────────────────────────────────────────────────────

export type MassType = 'regular' | 'special' | 'feast' | 'funeral' | 'wedding';

export interface MassTiming {
  _id: string;
  churchId: string;
  title: string;
  titleTA: string;
  dayOfWeek?: number[];
  specificDate?: string;
  time: string;
  language: 'en' | 'ta' | 'both';
  venue: string;
  priest?: string;
  massType: MassType;
  isActive: boolean;
  notes?: string;
}

export interface LiveStream {
  _id: string;
  churchId: string;
  youtubeVideoId: string;
  title: string;
  scheduledAt: string;
  status: 'scheduled' | 'live' | 'ended';
  recordingUrl?: string;
  thumbnailUrl?: string;
  viewerCount?: number;
}

// ─── Bible ────────────────────────────────────────────────────────────────────

export interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  textEn: string;
  textTa: string;
}

export interface BibleBook {
  id: string;
  name: string;
  nameTA: string;
  shortName: string;
  testament: 'OT' | 'NT';
  chapters: number;
}

export interface DailyReading {
  date: string;
  liturgicalSeason: string;
  feastDay?: string;
  firstReading: { reference: string; text: string; textTA: string };
  responsorialPsalm: { reference: string; antiphon: string; text: string };
  secondReading?: { reference: string; text: string; textTA: string };
  gospel: { reference: string; text: string; textTA: string };
}

export interface Bookmark {
  _id: string;
  userId: string;
  verseId: string;
  book: string;
  /** USFM book code (e.g. "JHN") — needed to reopen the verse in the reader. */
  bookId?: string;
  /** Total chapters in the book, so the reader can paginate straight away. */
  numberOfChapters?: number;
  chapter: number;
  verse: number;
  text: string;
  createdAt: string;
}

// ─── Donation ─────────────────────────────────────────────────────────────────

export type OfferingType =
  | 'offering'
  | 'mass_intention'
  | 'building_fund'
  | 'charity'
  | 'scholarship'
  | 'subscription'
  | 'special';

export interface Donation {
  _id: string;
  churchId: string;
  familyId: string;
  userId: string;
  amount: number;
  currency: string;
  type: OfferingType;
  intention?: string;
  isAnonymous: boolean;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  /** online = paid in the app; others were recorded by the parish office. */
  method?: 'online' | 'cash' | 'cheque' | 'upi' | 'bank_transfer';
  receiptUrl?: string;
  receiptNumber?: string;
  processedAt?: string;
  createdAt: string;
}

export interface DonationSummary {
  year: number;
  total: number;
  monthly: { month: number; amount: number }[];
  byType: { type: OfferingType; amount: number }[];
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export type CertType =
  | 'baptism'
  | 'holy_communion'
  | 'confirmation'
  | 'marriage'
  | 'death'
  | 'transfer'
  | 'general';

export interface CertificateRequest {
  _id: string;
  churchId: string;
  requestedBy: string;
  memberId?: string;
  memberName: string;
  type: CertType;
  purpose: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'ready';
  certificateUrl?: string;
  certificateNumber?: string;
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

// ─── Community ────────────────────────────────────────────────────────────────

export type ClubType = 'youth' | 'women' | 'widows' | 'children' | 'volunteers';

export interface CommunityGroup {
  _id: string;
  churchId: string;
  type: ClubType;
  name: string;
  description: string;
  membersCount: number;
  isActive: boolean;
}

export interface Event {
  _id: string;
  churchId: string;
  communityGroupId?: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  venue: string;
  maxAttendees?: number;
  rsvpCount: number;
  coverImageUrl?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  hasRsvped?: boolean;
}

export interface Announcement {
  _id: string;
  churchId: string;
  title: string;
  titleTA?: string;
  content: string;
  contentTA?: string;
  type: 'general' | 'mass_change' | 'event' | 'emergency' | 'bulletin';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachmentUrl?: string;
  publishedAt: string;
  expiresAt?: string;
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export interface JobPosting {
  _id: string;
  title: string;
  description: string;
  category: 'in_church' | 'around_church' | 'referral';
  contactName: string;
  contactPhone: string;
  location: string;
  type: 'full_time' | 'part_time' | 'volunteer' | 'contract';
  createdAt: string;
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export interface MediaItem {
  _id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl: string;
  title?: string;
  year: number;
  month: number;
  tags?: string[];
}

// ─── Transfer ─────────────────────────────────────────────────────────────────

/** A church as populated on a transfer request (name, code and address only). */
export type TransferChurch = Pick<Church, '_id' | 'name' | 'code'> & { address?: Address };

export interface TransferRequest {
  _id: string;
  familyId: string;
  /** Populated by GET /transfers/me; a bare id elsewhere. */
  sourceChurchId: TransferChurch | string;
  destinationChurchId: TransferChurch | string;
  reason: string;
  rejectionReason?: string;
  status:
    | 'pending_source'
    | 'approved_source'
    | 'pending_destination'
    | 'completed'
    | 'rejected';
  createdAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'announcement'
  | 'mass'
  | 'donation'
  | 'certificate'
  | 'transfer'
  | 'community'
  | 'general';

export interface AppNotification {
  _id: string;
  title: string;
  titleTA?: string;
  body: string;
  bodyTA?: string;
  type: NotificationType;
  read: boolean;
  /** ISO timestamp */
  createdAt: string;
  /** optional in-app route to open when tapped */
  route?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}
