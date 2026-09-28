import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { Routes } from '../constants/routes';
import type { Church, OfferingType } from '../types';

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  [Routes.Splash]: undefined;
  [Routes.Onboarding]: undefined;
  [Routes.ChurchSelection]: undefined;
  [Routes.Login]: { church?: Church };
  [Routes.Register]: { church?: Church };
  [Routes.OTPVerification]: { phone: string; purpose: 'login' | 'register' | 'reset' };
  [Routes.ForgotPassword]: undefined;
};

// ─── Mass Stack ───────────────────────────────────────────────────────────────
export type MassStackParamList = {
  [Routes.MassHome]: undefined;
  [Routes.LiveMass]: { videoId: string; title: string };
  [Routes.RecordedMass]: { videoId: string; title: string };
  [Routes.MassTimings]: undefined;
  [Routes.MassCalendar]: undefined;
};

// ─── Bible Stack ──────────────────────────────────────────────────────────────
export type BibleStackParamList = {
  [Routes.BibleHome]: undefined;
  [Routes.BibleReader]: {
    book: string; // localized display name
    bookId: string; // USFM code, e.g. "GEN"
    chapter: number;
    numberOfChapters?: number;
    verse?: number;
  };
  [Routes.DailyReading]: undefined;
  [Routes.Bookmarks]: undefined;
  [Routes.BibleNotes]: undefined;
};

// ─── Donation Stack ───────────────────────────────────────────────────────────
export type DonationStackParamList = {
  [Routes.DonationHome]: undefined;
  [Routes.MakeOffering]: { offeringType?: string; type?: OfferingType };
  [Routes.Subscription]: undefined;
  [Routes.DonationHistory]: undefined;
  [Routes.DonationReceipt]: { donationId: string };
};

// ─── Family Stack ─────────────────────────────────────────────────────────────
export type FamilyStackParamList = {
  [Routes.FamilyCard]: undefined;
  [Routes.Members]: undefined;
  /** Pass memberId to edit an existing member. */
  [Routes.AddMember]: { memberId?: string } | undefined;
  [Routes.Certificates]: undefined;
  [Routes.CertificateRequest]: { certType?: string };
};

// ─── Profile Stack ────────────────────────────────────────────────────────────
export type ProfileStackParamList = {
  [Routes.Profile]: undefined;
  [Routes.Settings]: undefined;
  [Routes.Language]: undefined;
  [Routes.FamilyCard]: undefined;
  [Routes.Members]: undefined;
  /** Pass memberId to edit an existing member. */
  [Routes.AddMember]: { memberId?: string } | undefined;
  [Routes.Certificates]: undefined;
  [Routes.CertificateRequest]: { certType?: string };
  [Routes.ChurchTransfer]: undefined;
};

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────
export type TabParamList = {
  [Routes.Home]: undefined;
  [Routes.MassTab]: undefined;
  [Routes.BibleTab]: NavigatorScreenParams<BibleStackParamList> | undefined;
  [Routes.GiveTab]: undefined;
  [Routes.ProfileTab]: undefined;
};

// ─── Drawer ───────────────────────────────────────────────────────────────────
export type DrawerParamList = {
  MainTabs: undefined;
  [Routes.Notifications]: undefined;
  [Routes.Community]: undefined;
  [Routes.YouthClub]: undefined;
  [Routes.WomensClub]: undefined;
  [Routes.WidowSupport]: undefined;
  [Routes.ChildrenScholarship]: undefined;
  [Routes.Gallery]: undefined;
  [Routes.Volunteers]: undefined;
  [Routes.Jobs]: undefined;
  [Routes.ChurchTransfer]: undefined;
  [Routes.Announcements]: undefined;
  [Routes.Contact]: undefined;
};

// ─── Admin Stack ──────────────────────────────────────────────────────────────
export type AdminStackParamList = {
  [Routes.AdminDashboard]: undefined;
  [Routes.AdminMass]: undefined;
  [Routes.AdminFamilies]: undefined;
  [Routes.AdminDonations]: undefined;
  [Routes.AdminCertificates]: undefined;
  [Routes.AdminTransfers]: undefined;
  [Routes.AdminAnnouncements]: undefined;
};

// ─── Screen Props Helpers ─────────────────────────────────────────────────────
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, T>;

export type DrawerScreenProps2<T extends keyof DrawerParamList> =
  DrawerScreenProps<DrawerParamList, T>;
