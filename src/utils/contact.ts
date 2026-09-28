import { Alert, Linking, Platform } from 'react-native';
import type { Address, Church } from '../types';

async function open(url: string, failureMessage: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unavailable', failureMessage);
  }
}

/** Strips spaces/dashes so `tel:` gets a dialable number. */
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Contact actions use only the parish's own record. When a detail is missing
 * we say so — never fall back to another parish's number or address.
 */
export function callParish(phone?: string): void {
  if (!phone) {
    Alert.alert('No phone number', "Your parish hasn't added a phone number yet.");
    return;
  }
  void open(`tel:${normalizePhone(phone)}`, 'No phone app is available on this device.');
}

export function emailParish(email?: string, subject?: string): void {
  if (!email) {
    Alert.alert('No email address', "Your parish hasn't added an email address yet.");
    return;
  }
  const address = email;
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  void open(
    `mailto:${address}${query}`,
    'No email app is set up on this device.',
  );
}

/** Formats a church address into a single line for maps/search. */
export function formatAddress(address?: Address): string {
  if (!address) return '';
  return [address.street, address.area, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(', ');
}

/**
 * Opens the platform maps app at the parish. Uses coordinates when the church
 * record has them, otherwise falls back to a text search on the address.
 */
export function openDirections(church?: Church | null): void {
  if (!church?.address && !church?.name) {
    Alert.alert('No address', "Your parish hasn't added its address yet.");
    return;
  }
  const coords = church?.address?.coordinates;
  const label = church?.name ?? '';
  const query = coords
    ? `${coords.lat},${coords.lng}`
    : formatAddress(church?.address);

  const url = coords
    ? Platform.select({
        ios: `maps://?daddr=${query}&q=${encodeURIComponent(label)}`,
        default: `geo:${query}?q=${query}(${encodeURIComponent(label)})`,
      })!
    : Platform.select({
        ios: `maps://?q=${encodeURIComponent(query)}`,
        default: `geo:0,0?q=${encodeURIComponent(query)}`,
      })!;

  Linking.openURL(url).catch(() => {
    // No maps app registered (common on emulators) — fall back to the web.
    void open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      'No maps app is available on this device.',
    );
  });
}
