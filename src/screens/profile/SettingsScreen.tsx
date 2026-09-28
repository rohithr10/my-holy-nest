import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, TouchableOpacity, Switch, TextInput, Alert, Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { selectUser, selectChurch, updateLanguage, updateUser } from '../../store/slices/auth.slice';
import { toggleNightMode, selectNightMode } from '../../store/slices/bible.slice';
import { userApi, type PreferencesUpdate } from '../../api/user.api';
import { authApi } from '../../api/auth.api';
import { getApiErrorMessage } from '../../api/client';
import { Config } from '../../constants/config';
import Button from '../../components/common/Button/Button';
import { setAppLanguage, type AppLanguage } from '../../i18n';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSafeArea from '../../components/common/TopSafeArea/TopSafeArea';

type Panel = 'password' | 'email' | null;

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const church = useAppSelector(selectChurch);
  const nightMode = useAppSelector(selectNightMode);
  const { t, i18n } = useTranslation();
  const prefs = user?.preferences.notifications;

  const [panel, setPanel] = useState<Panel>(null);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentLang = (i18n.language as AppLanguage) ?? 'en';

  /** Saves a preference change; the screen updates at once and rolls back on failure. */
  const savePreferences = async (change: PreferencesUpdate, undo: () => void) => {
    try {
      const res = await userApi.updatePreferences(change);
      dispatch(updateUser({ preferences: res.data.data.preferences }));
    } catch (err) {
      undo();
      Alert.alert("Couldn't save your settings", getApiErrorMessage(err));
    }
  };

  const toggleLang = (lang: AppLanguage) => {
    const previous = currentLang;
    dispatch(updateLanguage(lang));
    setAppLanguage(lang);
    void savePreferences({ language: lang }, () => {
      dispatch(updateLanguage(previous));
      setAppLanguage(previous);
    });
  };

  const toggleNotification = (key: keyof NonNullable<typeof prefs>, value: boolean) => {
    if (!user) return;
    const before = user.preferences;
    dispatch(updateUser({ preferences: { ...before, notifications: { ...before.notifications, [key]: value } } }));
    void savePreferences({ notifications: { [key]: value } }, () => dispatch(updateUser({ preferences: before })));
  };

  const openPanel = (p: Panel) => {
    setPanel(panel === p ? null : p);
    setError('');
  };

  const changePassword = async () => {
    if (!pw.current) return setError('Enter your current password.');
    if (pw.next.length < 6) return setError('The new password must be at least 6 characters.');
    if (pw.next !== pw.confirm) return setError("The new passwords don't match.");
    setSaving(true);
    setError('');
    try {
      await authApi.changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      setPanel(null);
      Alert.alert('Password changed', 'Use your new password the next time you sign in.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveEmail = async () => {
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) return setError('Enter a valid email address.');
    setSaving(true);
    setError('');
    try {
      const res = await userApi.updateMe({ email: value });
      dispatch(updateUser({ email: res.data.data.email }));
      setPanel(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // The mobile number is the account's sign-in identity and there's no
  // self-service way to change it or erase an account yet, so these go
  // through the parish office.
  const viaParishOffice = (what: string) =>
    Alert.alert(
      what,
      `Please contact the ${church?.name ?? 'parish'} office${church?.contact?.phone ? ` (${church.contact.phone})` : ''} — they will verify your identity and make the change for you.`,
    );

  const notificationRows: { key: keyof NonNullable<typeof prefs>; label: string }[] = [
    { key: 'mass', label: t('profile.notification_mass') },
    { key: 'donations', label: t('profile.notification_donations') },
    { key: 'announcements', label: t('profile.notification_announcements') },
    { key: 'certificates', label: t('profile.notification_certificates') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TopSafeArea color={Colors.neutral.white} />
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.settings')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Language */}
        <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
        <View style={styles.card}>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, currentLang === 'en' && styles.langBtnActive]}
              onPress={() => toggleLang('en')}>
              <Text style={[styles.langBtnText, currentLang === 'en' && styles.langBtnTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, currentLang === 'ta' && styles.langBtnActive]}
              onPress={() => toggleLang('ta')}>
              <Text style={[styles.langBtnText, currentLang === 'ta' && styles.langBtnTextActive]}>தமிழ்</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>{t('profile.notifications')}</Text>
        <View style={styles.card}>
          {notificationRows.map((item, i, arr) => (
            <View key={item.key} style={[styles.switchRow, i < arr.length - 1 && styles.switchRowBorder]}>
              <Text style={styles.switchLabel}>{item.label}</Text>
              <Switch
                value={prefs?.[item.key] ?? true}
                onValueChange={v => toggleNotification(item.key, v)}
                trackColor={{ false: Colors.neutral.gray200, true: Colors.accent.gold }}
                thumbColor={Colors.neutral.white}
              />
            </View>
          ))}
        </View>

        {/* Display */}
        <Text style={styles.sectionTitle}>{t('profile.display')}</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('profile.dark_mode')}</Text>
            <Switch
              value={nightMode}
              onValueChange={() => {
                dispatch(toggleNightMode());
              }}
              trackColor={{ false: Colors.neutral.gray200, true: Colors.accent.gold }}
              thumbColor={Colors.neutral.white}
            />
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.menuRow, styles.menuRowBorder]} onPress={() => openPanel('password')}>
            <MaterialCommunityIcons name="lock-outline" style={styles.menuIcon} />
            <Text style={styles.menuLabel}>{t('profile.change_password')}</Text>
            <MaterialCommunityIcons name={panel === 'password' ? 'chevron-up' : 'chevron-down'} style={styles.menuArrow} />
          </TouchableOpacity>
          {panel === 'password' && (
            <View style={styles.panel}>
              <TextInput style={styles.input} placeholder="Current password" secureTextEntry value={pw.current}
                onChangeText={v => setPw({ ...pw, current: v })} placeholderTextColor={Colors.neutral.gray400} />
              <TextInput style={styles.input} placeholder="New password (at least 6 characters)" secureTextEntry value={pw.next}
                onChangeText={v => setPw({ ...pw, next: v })} placeholderTextColor={Colors.neutral.gray400} />
              <TextInput style={styles.input} placeholder="Confirm new password" secureTextEntry value={pw.confirm}
                onChangeText={v => setPw({ ...pw, confirm: v })} placeholderTextColor={Colors.neutral.gray400} />
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Button title="Change Password" onPress={changePassword} loading={saving} fullWidth />
            </View>
          )}

          <TouchableOpacity style={[styles.menuRow, styles.menuRowBorder]} onPress={() => openPanel('email')}>
            <MaterialCommunityIcons name="email-outline" style={styles.menuIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{t('profile.update_email')}</Text>
              {!!user?.email && <Text style={styles.menuSub}>{user.email}</Text>}
            </View>
            <MaterialCommunityIcons name={panel === 'email' ? 'chevron-up' : 'chevron-down'} style={styles.menuArrow} />
          </TouchableOpacity>
          {panel === 'email' && (
            <View style={styles.panel}>
              <TextInput style={styles.input} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none"
                value={email} onChangeText={setEmail} placeholderTextColor={Colors.neutral.gray400} />
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Button title="Save Email" onPress={saveEmail} loading={saving} fullWidth />
            </View>
          )}

          <TouchableOpacity style={[styles.menuRow, styles.menuRowBorder]} onPress={() => viaParishOffice(t('profile.update_mobile'))}>
            <MaterialCommunityIcons name="phone-outline" style={styles.menuIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{t('profile.update_mobile')}</Text>
              {!!user?.phone && <Text style={styles.menuSub}>+91 {user.phone}</Text>}
            </View>
            <MaterialCommunityIcons name="chevron-right" style={styles.menuArrow} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => viaParishOffice(t('profile.delete_account'))}>
            <MaterialCommunityIcons name="trash-can-outline" style={styles.menuIcon} />
            <Text style={[styles.menuLabel, styles.menuLabelDanger]}>{t('profile.delete_account')}</Text>
            <MaterialCommunityIcons name="chevron-right" style={styles.menuArrow} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>{t('profile.about_section')}</Text>
        <View style={styles.card}>
          <View style={[styles.aboutRow, styles.switchRowBorder]}>
            <Text style={styles.aboutLabel}>{t('profile.app_version')}</Text>
            <Text style={styles.aboutValue}>{Config.APP_VERSION}</Text>
          </View>
          <TouchableOpacity style={styles.aboutRow} onPress={() => Linking.openURL(`mailto:${Config.SUPPORT_EMAIL}`)}>
            <Text style={styles.aboutLabel}>{t('profile.contact_support')}</Text>
            <Text style={styles.aboutValue} selectable>{Config.SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    paddingVertical: 14,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
  },
  backIcon: { color: Colors.primary.navy, fontSize: 22 },
  headerTitle: { color: Colors.primary.navy, fontSize: 18, fontWeight: '700' },
  scroll: { padding: Spacing.screen },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.neutral.gray400, letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.md, textTransform: 'uppercase' },
  card: { backgroundColor: Colors.neutral.white, borderRadius: Radius.lg, marginBottom: Spacing.sm, overflow: 'hidden', ...Shadow.sm },
  langRow: { flexDirection: 'row', padding: Spacing.sm, gap: Spacing.sm },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral.gray200,
  },
  langBtnActive: { backgroundColor: Colors.accent.gold, borderColor: Colors.accent.gold },
  langBtnText: { fontSize: 14, fontWeight: '600', color: Colors.neutral.gray500 },
  langBtnTextActive: { color: Colors.neutral.white },
  switchRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  switchRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.neutral.gray100 },
  switchLabel: { flex: 1, fontSize: 15, color: Colors.neutral.gray800 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.neutral.gray100 },
  menuIcon: { fontSize: 20, marginRight: Spacing.md , color: Colors.primary.navy},
  menuLabel: { flex: 1, fontSize: 15, color: Colors.neutral.gray800 },
  menuLabelDanger: { color: Colors.semantic.error },
  menuArrow: { fontSize: 20, color: Colors.neutral.gray300 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  aboutLabel: { fontSize: 15, color: Colors.neutral.gray800 },
  aboutValue: { fontSize: 14, color: Colors.neutral.gray400 },
  menuSub: { fontSize: 12, color: Colors.neutral.gray400, marginTop: 1 },
  panel: { padding: Spacing.md, paddingTop: 0, gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.neutral.gray100 },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.neutral.gray800,
  },
  error: { fontSize: 13, color: Colors.semantic.error },
});
