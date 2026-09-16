import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  TrendingUp,
  RefreshCw,
  CalendarDays,
  QrCode,
  // DEPRECATED: team feature disabled.
  // Users,
  Clock,
  Zap,
} from "lucide-react-native";
import { THEME } from "@/constants/theme";
import { apiFetch } from "@/lib/api";

export default function OverviewScreen() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch<any>("/slots");
    if (res.success && res.data) {
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.slots)
        ? res.data.slots
        : [];
      setSlots(list);
    } else {
      setError(res.error || "Failed to load slots data");
      setSlots([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalSlots = slots.length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Title Bar */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Zap size={14} color={THEME.colors.accent} />
          </View>
          <Text style={styles.brandTitle}>LaserTag '26</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchData}
            tintColor={THEME.colors.accent}
          />
        }
      >
        {/* Dashboard Title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Dashboard Overview</Text>
          <Text style={styles.pageSubtitle}>
            Real-time arena slot allocation & check-in feed
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Overview Stat Cards Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Configured Slots</Text>
              <View style={styles.activePill}>
                <TrendingUp size={10} color={THEME.colors.accent} />
                <Text style={styles.activePillText}>Active</Text>
              </View>
            </View>
            <Text style={styles.statValue}>
              {loading ? "..." : totalSlots}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Scanner Station</Text>
              <View style={styles.readyPill}>
                <Text style={styles.readyPillText}>Ready</Text>
              </View>
            </View>
            <Text style={styles.statValue}>Online</Text>
          </View>
        </View>

        {/* Quick Workstation Shortcuts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Workstations</Text>
        </View>

        <View style={styles.workstationList}>
          <TouchableOpacity
            style={styles.workstationCard}
            onPress={() => router.push("/(tabs)/scan")}
            activeOpacity={0.7}
          >
            <View style={styles.iconBox}>
              <QrCode size={18} color={THEME.colors.accent} />
            </View>
            <View style={styles.workstationText}>
              <Text style={styles.workstationTitle}>QR Scanner Workstation</Text>
              <Text style={styles.workstationDesc}>
                Native camera scanner for instant ticket check-in
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.workstationCard}
            onPress={() => router.push("/(tabs)/slots")}
            activeOpacity={0.7}
          >
            <View style={styles.iconBox}>
              <CalendarDays size={18} color={THEME.colors.accent} />
            </View>
            <View style={styles.workstationText}>
              <Text style={styles.workstationTitle}>Slot Manager</Text>
              <Text style={styles.workstationDesc}>
                Create 30-min single slots or generate bulk windows
              </Text>
            </View>
          </TouchableOpacity>

          {/* DEPRECATED: team feature disabled — uncomment to restore Team workstation. */}
          {/* <TouchableOpacity
            style={styles.workstationCard}
            onPress={() => router.push("/(tabs)/teams")}
            activeOpacity={0.7}
          >
            <View style={styles.iconBox}>
              <Users size={18} color={THEME.colors.accent} />
            </View>
            <View style={styles.workstationText}>
              <Text style={styles.workstationTitle}>Team & Roster</Text>
              <Text style={styles.workstationDesc}>
                Search participant rosters & toggle check-in status
              </Text>
            </View>
          </TouchableOpacity> */}
        </View>

        {/* Active Game Slots Feed */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Game Slots</Text>
          <TouchableOpacity onPress={fetchData} style={styles.reloadBtn}>
            <RefreshCw size={12} color={THEME.colors.accent} />
          </TouchableOpacity>
        </View>

        {slots.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No game slots configured yet.</Text>
          </View>
        ) : (
          <View style={styles.slotFeed}>
            {slots.map((slot, idx) => (
              <View key={slot.id || idx} style={styles.slotItem}>
                <View style={styles.slotBadge}>
                  <Text style={styles.slotBadgeText}>Slot {idx + 1}</Text>
                </View>
                <View style={styles.slotTimeRow}>
                  <Clock size={12} color={THEME.colors.textSecondary} />
                  <Text style={styles.slotTimeText}>
                    {slot.startTime
                      ? new Date(slot.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.accent,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.accent,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    gap: THEME.spacing.lg,
  },
  titleSection: {
    gap: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  errorBox: {
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.3)",
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.danger,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: "500",
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: THEME.colors.accentBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.accent,
  },
  readyPill: {
    backgroundColor: THEME.colors.accentBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  readyPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.accent,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  reloadBtn: {
    padding: 4,
  },
  workstationList: {
    gap: 10,
  },
  workstationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  workstationText: {
    flex: 1,
    gap: 2,
  },
  workstationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  workstationDesc: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  emptyCard: {
    padding: 20,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  slotFeed: {
    gap: 8,
  },
  slotItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 12,
  },
  slotBadge: {
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.accent,
  },
  slotTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
});
