import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { selectChurch } from '../../store/slices/auth.slice';
import { callParish, emailParish, openDirections, formatAddress } from '../../utils/contact';

export default function ContactScreen() {
  const navigation = useNavigation<any>();
  const church = useAppSelector(selectChurch);
  const address = formatAddress(church?.address);

  // Only the details the parish has entered; nothing is shown for the rest.
  const contacts = [
    church?.contact?.phone && {
      icon: 'phone-outline', label: 'Parish Phone', value: church.contact.phone,
      action: () => callParish(church.contact.phone),
    },
    church?.contact?.email && {
      icon: 'email-outline', label: 'Email', value: church.contact.email,
      action: () => emailParish(church.contact.email, 'Parish enquiry'),
    },
    church?.contact?.website && {
      icon: 'web', label: 'Website', value: church.contact.website,
      action: () => Linking.openURL(/^https?:/.test(church.contact.website!) ? church.contact.website! : `https://${church.contact.website}`),
    },
    address && {
      icon: 'map-marker-outline', label: 'Address', value: address,
      action: () => openDirections(church),
    },
  ].filter(Boolean) as { icon: string; label: string; value: string; action: () => void }[];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.navyDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" style={styles.backIcon} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Church</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.churchBanner}>
          <MaterialCommunityIcons name="church" style={styles.churchIcon} />
          <Text style={styles.churchName}>{church?.name}</Text>
          {!!church?.nameTA && <Text style={styles.churchTA}>{church.nameTA}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          <View style={styles.card}>
            {!contacts.length && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>
                  Your parish hasn't added its contact details yet.
                </Text>
              </View>
            )}
            {contacts.map((c, i) => (
              <TouchableOpacity
                key={c.label}
                style={[styles.contactRow, i < contacts.length - 1 && styles.rowBorder]}
                onPress={c.action}>
                <MaterialCommunityIcons name={c.icon} style={styles.contactIcon} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>{c.label}</Text>
                  <Text style={[styles.contactValue, styles.contactValueLink]}>{c.value}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" style={styles.rowArrow} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary.navy, paddingHorizontal: Spacing.screen, paddingVertical: 14 },
  backIcon: { color: Colors.neutral.white, fontSize: 22, marginRight: Spacing.md },
  headerTitle: { flex: 1, color: Colors.neutral.white, fontSize: 18, fontWeight: '700' },
  churchBanner: { backgroundColor: Colors.primary.navyLight, padding: Spacing.xl, alignItems: 'center' },
  churchIcon: { fontSize: 48, marginBottom: Spacing.sm , color: Colors.accent.gold},
  churchName: { color: Colors.neutral.white, fontSize: 20, fontWeight: '700' },
  churchTA: { color: Colors.accent.gold, fontSize: 15, marginTop: 4 },
  section: { padding: Spacing.screen },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary.navy, marginBottom: Spacing.sm },
  card: { backgroundColor: Colors.neutral.white, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.neutral.gray100 },
  contactIcon: { fontSize: 22, marginRight: Spacing.md , color: Colors.primary.navy},
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 11, color: Colors.neutral.gray400, marginBottom: 2 },
  contactValue: { fontSize: 14, color: Colors.neutral.gray800 },
  contactValueLink: { color: Colors.sky.blue },
  rowArrow: { fontSize: 22, color: Colors.neutral.gray300 },
  priestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.neutral.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  priestAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary.navy, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  priestAvatarText: { color: Colors.neutral.white, fontWeight: '700', fontSize: 18 },
  priestName: { fontSize: 15, fontWeight: '600', color: Colors.primary.navy },
  priestRole: { fontSize: 13, color: Colors.neutral.gray400, marginTop: 2 },
});
