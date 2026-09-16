// DEPRECATED: team feature disabled (solo-only flow) — screen kept for restore, unlinked from tabs.
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users,
  Search,
  CheckCircle,
  Clock,
  X,
  Calendar,
  ChevronRight,
  Shield,
  Ticket,
} from "lucide-react-native";
import { THEME } from "@/constants/theme";
import { apiFetch } from "@/lib/api";

export default function TeamsScreen() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    const res = await apiFetch<any>("/teams");
    if (res.success && res.data) {
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.teams)
        ? res.data.teams
        : [];
      setTeams(list);

      // Keep selectedTeam updated if modal is open
      if (selectedTeam) {
        const updated = list.find((t: any) => t.id === selectedTeam.id || t.teamCode === selectedTeam.teamCode);
        if (updated) setSelectedTeam(updated);
      }
    } else {
      setTeams([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(() => {
      fetchTeams();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleCheckin = async (teamId: string, currentStatus: boolean) => {
    const res = await apiFetch<any>(`/teams/${teamId}/checkin`, {
      method: "PATCH",
      body: JSON.stringify({ checkedIn: !currentStatus }),
    });

    if (res.success) {
      fetchTeams();
    } else {
      Alert.alert("Error", res.error || "Failed to update check-in status.");
    }
  };

  const filteredTeams = teams.filter((team) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (team.name && team.name.toLowerCase().includes(q)) ||
      (team.teamCode && team.teamCode.toLowerCase().includes(q)) ||
      (team.id && team.id.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Users size={18} color={THEME.colors.accent} />
        <Text style={styles.headerTitle}>Team & Roster Workstation</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchTeams}
            tintColor={THEME.colors.accent}
          />
        }
      >
        {/* Search Input Bar */}
        <View style={styles.searchCard}>
          <Search size={14} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teams by name or code..."
            placeholderTextColor={THEME.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Team List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Registered Teams</Text>
          <Text style={styles.listCount}>
            Showing {filteredTeams.length} of {teams.length}
          </Text>
        </View>

        {filteredTeams.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No teams found matching search.</Text>
          </View>
        ) : (
          <View style={styles.teamList}>
            {filteredTeams.map((team, idx) => {
              const isCheckedIn = team.checkedIn || team.status === "CHECKED_IN";
              const bookingCount = team.bookings ? team.bookings.length : 0;
              return (
                <TouchableOpacity
                  key={team.id || idx}
                  style={styles.teamCard}
                  onPress={() => setSelectedTeam(team)}
                  activeOpacity={0.7}
                >
                  <View style={styles.teamHeader}>
                    <View style={styles.teamInfo}>
                      <Text style={styles.teamName}>
                        {team.teamCode || team.name || `Team ${idx + 1}`}
                      </Text>
                      {team.teamCode && (
                        <Text style={styles.teamCode}>Code: {team.teamCode}</Text>
                      )}
                    </View>

                    <View style={styles.headerActions}>
                      <TouchableOpacity
                        style={[
                          styles.checkinBadge,
                          isCheckedIn ? styles.checkedIn : styles.notCheckedIn,
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleCheckin(team.id, isCheckedIn);
                        }}
                      >
                        {isCheckedIn ? (
                          <CheckCircle size={12} color={THEME.colors.accent} />
                        ) : (
                          <Clock size={12} color={THEME.colors.textMuted} />
                        )}
                        <Text
                          style={[
                            styles.checkinText,
                            isCheckedIn
                              ? styles.checkedInText
                              : styles.notCheckedInText,
                          ]}
                        >
                          {isCheckedIn ? "Checked In" : "Pending"}
                        </Text>
                      </TouchableOpacity>
                      <ChevronRight size={16} color={THEME.colors.textMuted} />
                    </View>
                  </View>

                  {team.members && team.members.length > 0 && (
                    <View style={styles.membersRow}>
                      <Text style={styles.membersLabel}>
                        Members ({team.members.length}):
                      </Text>
                      <Text style={styles.membersList} numberOfLines={1}>
                        {team.members.map((m: any) => m.name || m.email).join(", ")}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.bookingPill}>
                      <Ticket size={11} color={THEME.colors.accent} />
                      <Text style={styles.bookingPillText}>
                        {bookingCount > 0
                          ? `${bookingCount} Slot Booking${bookingCount > 1 ? "s" : ""}`
                          : "No Slots Booked"}
                      </Text>
                    </View>
                    <Text style={styles.tapToViewText}>Tap for full details →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Team Full Detail Modal */}
      <Modal
        visible={!!selectedTeam}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTeam(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            {selectedTeam && (
              <View style={styles.modalContent}>
                {/* Modal Top Navigation */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Shield size={18} color={THEME.colors.accent} />
                    <View>
                      <Text style={styles.modalTitle}>
                        {selectedTeam.teamCode || selectedTeam.name}
                      </Text>
                      <Text style={styles.modalSubtitle}>Team Details & History</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedTeam(null)}
                  >
                    <X size={18} color={THEME.colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.modalBody}>
                  {/* Status Banner */}
                  <View style={styles.statusBanner}>
                    <View style={styles.statusInfo}>
                      <Text style={styles.statusLabel}>Roster Status</Text>
                      <Text style={styles.statusVal}>
                        {selectedTeam.checkedIn || selectedTeam.status === "CHECKED_IN"
                          ? "Checked In at Venue"
                          : "Pending Check-In"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.modalCheckinBtn,
                        (selectedTeam.checkedIn || selectedTeam.status === "CHECKED_IN")
                          ? styles.checkedIn
                          : styles.notCheckedIn,
                      ]}
                      onPress={() =>
                        handleToggleCheckin(
                          selectedTeam.id,
                          selectedTeam.checkedIn || selectedTeam.status === "CHECKED_IN"
                        )
                      }
                    >
                      <Text style={styles.modalCheckinBtnText}>
                        {selectedTeam.checkedIn || selectedTeam.status === "CHECKED_IN"
                          ? "Mark Pending"
                          : "Mark Checked In"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Leader Info */}
                  {selectedTeam.leader && (
                    <View style={styles.detailCard}>
                      <Text style={styles.cardSectionTitle}>Team Captain / Leader</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Name:</Text>
                        <Text style={styles.detailVal}>{selectedTeam.leader.name || "N/A"}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Email:</Text>
                        <Text style={styles.detailVal}>{selectedTeam.leader.email || "N/A"}</Text>
                      </View>
                    </View>
                  )}

                  {/* Members Roster */}
                  <View style={styles.detailCard}>
                    <Text style={styles.cardSectionTitle}>
                      Roster Members ({selectedTeam.members ? selectedTeam.members.length : 0})
                    </Text>
                    {selectedTeam.members && selectedTeam.members.length > 0 ? (
                      selectedTeam.members.map((m: any, i: number) => (
                        <View key={m.id || i} style={styles.memberItem}>
                          <Text style={styles.memberName}>{i + 1}. {m.name || "Player"}</Text>
                          <Text style={styles.memberEmail}>{m.email}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyDetailText}>No members registered.</Text>
                    )}
                  </View>

                  {/* Slot Booking & Rebooking History */}
                  <View style={styles.detailCard}>
                    <View style={styles.sectionHeaderRow}>
                      <Calendar size={15} color={THEME.colors.accent} />
                      <Text style={styles.cardSectionTitle}>Slot Booking & Re-Booking History</Text>
                    </View>

                    {selectedTeam.bookings && selectedTeam.bookings.length > 0 ? (
                      selectedTeam.bookings.map((bkg: any, i: number) => {
                        const startFormatted = bkg.startTime
                          ? new Date(bkg.startTime).toLocaleString("en-US", {
                              timeZone: "UTC",
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "N/A";
                        const endFormatted = bkg.endTime
                          ? new Date(bkg.endTime).toLocaleTimeString("en-US", {
                              timeZone: "UTC",
                              timeStyle: "short",
                            })
                          : "N/A";

                        return (
                          <View key={bkg.id || i} style={styles.bookingCardItem}>
                            <View style={styles.bookingHeader}>
                              <Text style={styles.bookingSlotTitle}>
                                {i === 0 ? "Current / Latest Slot" : `Previous Booking #${i + 1}`}
                              </Text>
                              <View style={styles.bookingTypeBadge}>
                                <Text style={styles.bookingTypeText}>
                                  {bkg.type ? bkg.type.toUpperCase() : "TEAM"}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.detailRow}>
                              <Clock size={12} color={THEME.colors.accent} />
                              <Text style={styles.bookingTimeText}>
                                {startFormatted} - {endFormatted}
                              </Text>
                            </View>

                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Booking Reference:</Text>
                              <Text style={styles.bookingRefText}>{bkg.id}</Text>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.noBookingsBox}>
                        <Text style={styles.emptyDetailText}>
                          No slot bookings recorded for this team yet.
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
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
    gap: 8,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    gap: THEME.spacing.lg,
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 12,
    color: THEME.colors.textPrimary,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  listCount: {
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
  teamList: {
    gap: 10,
  },
  teamCard: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  teamInfo: {
    gap: 2,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  teamCode: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontFamily: "monospace",
  },
  checkinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkedIn: {
    backgroundColor: THEME.colors.accentBg,
    borderColor: THEME.colors.accent,
  },
  notCheckedIn: {
    backgroundColor: THEME.colors.bg,
    borderColor: THEME.colors.border,
  },
  checkinText: {
    fontSize: 11,
    fontWeight: "700",
  },
  checkedInText: {
    color: THEME.colors.accent,
  },
  notCheckedInText: {
    color: THEME.colors.textMuted,
  },
  membersRow: {
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 8,
  },
  membersLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  membersList: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 8,
  },
  bookingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: THEME.colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookingPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.accent,
  },
  tapToViewText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 40,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: THEME.colors.bg,
  },
  modalBody: {
    padding: 16,
    gap: 14,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 14,
  },
  statusInfo: {
    gap: 2,
  },
  statusLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  statusVal: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  modalCheckinBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalCheckinBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  detailCard: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  detailVal: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  memberItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  memberName: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  memberEmail: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  emptyDetailText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontStyle: "italic",
  },
  noBookingsBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: THEME.colors.bg,
    alignItems: "center",
  },
  bookingCardItem: {
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 6,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookingSlotTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.accent,
  },
  bookingTypeBadge: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  bookingTypeText: {
    fontSize: 9,
    fontWeight: "700",
    color: THEME.colors.textSecondary,
  },
  bookingTimeText: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  bookingRefText: {
    fontSize: 10,
    fontFamily: "monospace",
    color: THEME.colors.textMuted,
  },
});
