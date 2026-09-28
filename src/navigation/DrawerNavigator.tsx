import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../constants/colors";
import { Spacing, Radius } from "../constants/spacing";
import { Routes } from "../constants/routes";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../hooks/useAppDispatch";
import { selectUser, selectChurch } from "../store/slices/auth.slice";
import type { DrawerParamList } from "./types";

import TabNavigator from "./TabNavigator";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import CommunityScreen from "../screens/community/CommunityScreen";
import YouthClubScreen from "../screens/community/YouthClubScreen";
import WomensClubScreen from "../screens/community/WomensClubScreen";
import WidowSupportScreen from "../screens/community/WidowSupportScreen";
import ChildrenScholarshipScreen from "../screens/community/ChildrenScholarshipScreen";
import GalleryScreen from "../screens/gallery/GalleryScreen";
import JobsScreen from "../screens/jobs/JobsScreen";
import AnnouncementsScreen from "../screens/community/AnnouncementsScreen";
import ContactScreen from "../screens/profile/ContactScreen";

const Drawer = createDrawerNavigator<DrawerParamList>();

function DrawerContent({ navigation }: any) {
  const user = useAppSelector(selectUser);
  const church = useAppSelector(selectChurch);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const menuItems = [
    { label: t("nav.home"), icon: "home-variant-outline", route: "MainTabs" },
    {
      label: t("drawer.announcements"),
      icon: "bullhorn-outline",
      route: Routes.Announcements,
    },
    { label: t("drawer.community"), isSection: true },
    { label: t("drawer.youth_club"), icon: "run", route: Routes.YouthClub },
    {
      label: t("drawer.womens_club"),
      icon: "human-female",
      route: Routes.WomensClub,
    },
    {
      label: t("drawer.widow_support"),
      icon: "handshake-outline",
      route: Routes.WidowSupport,
    },
    {
      label: t("drawer.childrens_fund"),
      icon: "baby-face-outline",
      route: Routes.ChildrenScholarship,
    },
    { label: t("drawer.explore"), isSection: true },
    {
      label: t("drawer.gallery"),
      icon: "image-multiple-outline",
      route: Routes.Gallery,
    },
    { label: t("drawer.jobs"), icon: "briefcase-outline", route: Routes.Jobs },
    { label: t("drawer.more"), isSection: true },
    {
      label: t("drawer.contact_church"),
      icon: "phone-outline",
      route: Routes.Contact,
    },
  ];

  return (
    <DrawerContentScrollView
      style={styles.drawer}
      // Cancel the built-in safe-area padding so the header hugs the
      // top/left/right edges; the header handles the status bar inset itself.
      contentContainerStyle={{
        paddingTop: 0,
        paddingBottom: insets.bottom,
        paddingStart: 0,
        paddingEnd: 0,
      }}
    >
      {/* Header */}
      <View
        style={[styles.drawerHeader, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.profile.firstName?.[0] ?? "U"}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user?.profile.firstName} {user?.profile.lastName}
        </Text>
        <Text style={styles.churchName}>{church?.name ?? "Parish"}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          if (item.isSection) {
            return (
              <Text key={index} style={styles.sectionLabel}>
                {item.label}
              </Text>
            );
          }
          return (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.route)}
            >
              <MaterialCommunityIcons
                name={item.icon as string}
                size={22}
                color={Colors.primary.navy}
                style={styles.menuIcon}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* App Version */}
      <Text style={styles.version}>My Holy Nest v2.1</Text>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="MainTabs" component={TabNavigator} />
      <Drawer.Screen
        name={Routes.Notifications}
        component={NotificationsScreen}
      />
      <Drawer.Screen name={Routes.Community} component={CommunityScreen} />
      <Drawer.Screen name={Routes.YouthClub} component={YouthClubScreen} />
      <Drawer.Screen name={Routes.WomensClub} component={WomensClubScreen} />
      <Drawer.Screen
        name={Routes.WidowSupport}
        component={WidowSupportScreen}
      />
      <Drawer.Screen
        name={Routes.ChildrenScholarship}
        component={ChildrenScholarshipScreen}
      />
      <Drawer.Screen name={Routes.Gallery} component={GalleryScreen} />
      <Drawer.Screen name={Routes.Jobs} component={JobsScreen} />
      <Drawer.Screen
        name={Routes.Announcements}
        component={AnnouncementsScreen}
      />
      <Drawer.Screen name={Routes.Contact} component={ContactScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  drawerHeader: {
    backgroundColor: Colors.primary.navy,
    padding: Spacing.lg,
    alignItems: "center",
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.neutral.white,
  },
  userName: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: "600",
  },
  churchName: {
    color: Colors.sky.blueLight,
    fontSize: 13,
    marginTop: 2,
  },
  menuContainer: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.neutral.gray400,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 2,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: Spacing.md,
    width: 24,
    textAlign: "center",
  },
  menuLabel: {
    fontSize: 15,
    color: Colors.neutral.gray800,
    fontWeight: "500",
  },
  version: {
    textAlign: "center",
    color: Colors.neutral.gray400,
    fontSize: 12,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
  },
});
