import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../constants/colors";
import { Spacing, Radius, Shadow } from "../../constants/spacing";
import { Routes } from "../../constants/routes";
import Badge from "../../components/common/Badge/Badge";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import TopSafeArea from "../../components/common/TopSafeArea/TopSafeArea";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import { useMyCertificates } from "../../hooks/useFamily";
import type { CertType, CertificateRequest } from "../../types";

const CERT_META: Record<CertType, { label: string; labelTA: string; icon: string }> = {
  baptism: { label: 'Baptism', labelTA: 'ஞானஸ்நானம்', icon: 'water-outline' },
  holy_communion: { label: 'First Holy Communion', labelTA: 'புதுநன்மை', icon: 'bread-slice-outline' },
  confirmation: { label: 'Confirmation', labelTA: 'உறுதிப்பூசுதல்', icon: 'bird' },
  marriage: { label: 'Marriage', labelTA: 'திருமணம்', icon: 'ring' },
  death: { label: 'Death', labelTA: 'இறப்பு', icon: 'candle' },
  transfer: { label: 'Transfer Letter', labelTA: 'மாற்றுச் சான்று', icon: 'swap-horizontal' },
  general: { label: 'General', labelTA: 'பொது', icon: 'file-document-outline' },
};

const STATUS: Record<CertificateRequest['status'], { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  under_review: { label: 'Under review', variant: 'info' },
  approved: { label: 'Approved', variant: 'success' },
  ready: { label: 'Ready', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CertificatesScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, isError, refetch, isRefetching } = useMyCertificates();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <TopSafeArea color={Colors.primary.navy} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary.navyDark}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificates</Text>
        <TouchableOpacity
          style={styles.requestBtn}
          onPress={() => navigation.navigate(Routes.CertificateRequest)}>
          <Text style={styles.requestBtnText}>+ Request</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen label="Loading certificates…" />
      ) : (
      <FlatList
        data={data ?? []}
        keyExtractor={(c) => c._id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="certificate-outline"
            title={isError ? "Couldn't load your certificates" : 'No certificate requests yet'}
            subtitle={
              isError
                ? 'Check your connection and try again.'
                : 'Request a baptism, marriage or other certificate from the parish office.'
            }
            actionLabel={isError ? 'Try again' : 'Request a certificate'}
            onAction={isError ? () => refetch() : () => navigation.navigate(Routes.CertificateRequest)}
          />
        }
        renderItem={({ item }) => {
          const meta = CERT_META[item.type] ?? CERT_META.general;
          const status = STATUS[item.status];
          return (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={meta.icon} style={styles.icon} />
            </View>
            <View style={styles.info}>
              <Text style={styles.certType}>{meta.label}</Text>
              <Text style={styles.certTypeTA}>{meta.labelTA}</Text>
              <Text style={styles.member}>{item.memberName}</Text>
              <Text style={styles.date}>Requested: {formatDate(item.createdAt)}</Text>
              {item.status === 'rejected' && !!item.rejectionReason && (
                <Text style={styles.reason}>Reason: {item.rejectionReason}</Text>
              )}
              {item.status === 'ready' && !item.certificateUrl && (
                <Text style={styles.reason}>Ready to collect at the parish office</Text>
              )}
            </View>
            <View style={styles.statusCol}>
              <Badge label={status.label} variant={status.variant} size="sm" />
              {item.status === 'ready' && !!item.certificateUrl && (
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => Linking.openURL(item.certificateUrl!)}>
                  <Text style={styles.downloadText}>
                    <MaterialCommunityIcons name="arrow-down" size={13} /> View
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          );
        }}
      />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.warmWhite },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: Spacing.screen,
    paddingVertical: 14,
  },
  backIcon: {
    color: Colors.neutral.white,
    fontSize: 22,
    marginRight: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    color: Colors.neutral.white,
    fontSize: 18,
    fontWeight: "700",
  },
  requestBtn: {
    backgroundColor: Colors.accent.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  requestBtnText: {
    color: Colors.neutral.white,
    fontWeight: "700",
    fontSize: 13,
  },
  list: { padding: Spacing.screen },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent.goldPale,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  icon: { fontSize: 22, color: Colors.primary.navy },
  info: { flex: 1 },
  certType: { fontSize: 15, fontWeight: "700", color: Colors.primary.navy },
  certTypeTA: { fontSize: 12, color: Colors.neutral.gray400 },
  member: { fontSize: 13, color: Colors.neutral.gray600, marginTop: 2 },
  date: { fontSize: 11, color: Colors.neutral.gray400, marginTop: 2 },
  statusCol: { alignItems: "flex-end", gap: Spacing.xs },
  downloadBtn: { marginTop: 4 },
  downloadText: { fontSize: 12, color: Colors.sky.blue, fontWeight: "600" },
  reason: { fontSize: 12, color: Colors.neutral.gray600, marginTop: 4 },
});
