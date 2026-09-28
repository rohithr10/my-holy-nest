import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../constants/colors";
import { Spacing, Radius, Shadow } from "../../constants/spacing";
import { Routes } from "../../constants/routes";
import { useAppSelector } from "../../hooks/useAppDispatch";
import { selectUser, selectChurch } from "../../store/slices/auth.slice";
import {
  useMyFamily,
  useMyCertificates,
  fullName,
  initials,
} from "../../hooks/useFamily";
import { signOut } from "../../utils/logout";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import TopSafeArea from "../../components/common/TopSafeArea/TopSafeArea";

const MENU_ITEMS = [
  { icon: "home-outline", label: "Family Card", route: Routes.FamilyCard },
  {
    icon: "account-group-outline",
    label: "Family Members",
    route: Routes.Members,
  },
  {
    icon: "certificate-outline",
    label: "Certificates",
    route: Routes.Certificates,
  },
  // {
  //   icon: "swap-horizontal",
  //   label: "Church Transfer",
  //   route: Routes.ChurchTransfer,
  // },
  { icon: "cog-outline", label: "Settings", route: Routes.Settings },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = useAppSelector(selectUser);
  const church = useAppSelector(selectChurch);

  const { family, memberCount } = useMyFamily();
  const { data: certificates } = useMyCertificates();

  const name = fullName(user?.profile);
  const avatarText = initials(user?.profile);
  const address = family
    ? [family.address.street, family.address.area, family.address.city]
        .filter(Boolean)
        .join(", ") +
      (family.address.pincode ? ` — ${family.address.pincode}` : "")
    : undefined;
  const roleLabel = user?.role
    ? user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => void signOut(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary.navyDark}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarText}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>{roleLabel}</Text>
          <View style={styles.churchPill}>
            <Text style={styles.churchPillText}>
              <MaterialCommunityIcons name="church" size={13} /> {church?.name}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{family ? memberCount : "–"}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statDivider} />
            {/* <View style={styles.statItem}>
              <Text style={styles.statValue}>₹4,200</Text>
              <Text style={styles.statLabel}>Given (2026)</Text>
            </View> */}
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {certificates ? certificates.length : "–"}
              </Text>
              <Text style={styles.statLabel}>Certificates</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Info</Text>
          <View style={styles.infoCard}>
            {[
              {
                icon: "phone-outline",
                label: "Mobile",
                value: user?.phone ? `+91 ${user.phone}` : "—",
              },
              {
                icon: "email-outline",
                label: "Email",
                value: user?.email || "Not added — set it in Settings",
              },
              {
                icon: "map-marker-outline",
                label: "Address",
                value: address ?? "—",
              },
            ].map((item, i) => (
              <View
                key={i}
                style={[styles.infoRow, i > 0 && styles.infoRowBorder]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  style={styles.infoIcon}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Parish</Text>
          <View style={styles.menuCard}>
            {MENU_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.menuRow,
                  i < MENU_ITEMS.length - 1 && styles.menuRowBorder,
                ]}
                onPress={() => navigation.navigate(item.route)}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  style={styles.menuArrow}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>
            <MaterialCommunityIcons name="logout" size={15} /> Logout
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>My Holy Nest v2.1</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  header: {
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: "700", color: Colors.neutral.white },

  profileCard: {
    backgroundColor: Colors.primary.navyLight,
    margin: Spacing.screen,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    ...Shadow.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: { color: Colors.neutral.white, fontSize: 26, fontWeight: "700" },
  name: {
    color: Colors.neutral.white,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  role: {
    color: Colors.sky.blueLight,
    fontSize: 14,
    marginBottom: Spacing.md,
    textTransform: "capitalize",
  },
  churchPill: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: Spacing.lg,
  },
  churchPillText: { color: Colors.neutral.white, fontSize: 13 },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: Colors.neutral.white, fontSize: 18, fontWeight: "700" },
  statLabel: { color: Colors.sky.blueLight, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },

  section: { paddingHorizontal: Spacing.screen, marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary.navy,
    marginBottom: Spacing.sm,
  },

  infoCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadow.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
  },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: Colors.neutral.gray100 },
  infoIcon: {
    fontSize: 18,
    marginRight: Spacing.md,
    marginTop: 2,
    color: Colors.primary.navy,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.neutral.gray400, marginBottom: 2 },
  infoValue: { fontSize: 14, color: Colors.neutral.gray800, lineHeight: 20 },

  menuCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadow.sm,
  },
  menuRow: { flexDirection: "row", alignItems: "center", padding: Spacing.md },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray100,
  },
  menuIcon: {
    fontSize: 22,
    marginRight: Spacing.md,
    color: Colors.primary.navy,
  },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.neutral.gray800 },
  menuArrow: { fontSize: 22, color: Colors.neutral.gray300 },

  logoutBtn: {
    marginHorizontal: Spacing.screen,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.semantic.error + "15",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.semantic.error + "40",
    marginBottom: Spacing.sm,
  },
  logoutText: { color: Colors.semantic.error, fontWeight: "700", fontSize: 15 },
  version: { textAlign: "center", color: Colors.neutral.gray400, fontSize: 12 },
});
