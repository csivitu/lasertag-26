import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarDays, Plus, Layers, Trash2, Clock, Filter, X } from "lucide-react-native";
import { THEME } from "@/constants/theme";
import { apiFetch } from "@/lib/api";

const EVENT_DATES = [
  { label: "18th Sep", value: "2026-09-18" },
  { label: "19th Sep", value: "2026-09-19" },
  { label: "20th Sep", value: "2026-09-20" },
];

export default function SlotsScreen() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");

  const defaultDate = "2026-09-18";

  // Single Slot Form State
  const [singleDate, setSingleDate] = useState(defaultDate);
  const [singleStart, setSingleStart] = useState("14:00");
  const [singleEnd, setSingleEnd] = useState("14:30");

  // Bulk Slot Form State
  const [bulkDate, setBulkDate] = useState(defaultDate);
  const [bulkStart, setBulkStart] = useState("14:00");
  const [bulkEnd, setBulkEnd] = useState("18:00");
  const [bulkDuration, setBulkDuration] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);

  // Time Picker Modal State
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activePickerTarget, setActivePickerTarget] = useState<
    "singleStart" | "singleEnd" | "bulkStart" | "bulkEnd" | null
  >(null);
  const [selectedHour, setSelectedHour] = useState<number>(14);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);

  const openTimePicker = (
    target: "singleStart" | "singleEnd" | "bulkStart" | "bulkEnd",
    currentVal: string
  ) => {
    setActivePickerTarget(target);
    const parts = currentVal.split(":");
    if (parts.length === 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h)) setSelectedHour(h);
      if (!isNaN(m)) setSelectedMinute(m);
    } else {
      setSelectedHour(14);
      setSelectedMinute(0);
    }
    setTimePickerVisible(true);
  };

  const confirmTimePicker = () => {
    const formatted = `${String(selectedHour).padStart(2, "0")}:${String(
      selectedMinute
    ).padStart(2, "0")}`;

    if (activePickerTarget === "singleStart") {
      setSingleStart(formatted);
      const startMs = new Date(`2026-01-01T${formatted}:00`).getTime();
      if (!isNaN(startMs)) {
        const endMs = new Date(startMs + bulkDuration * 60 * 1000);
        const endH = String(endMs.getHours()).padStart(2, "0");
        const endM = String(endMs.getMinutes()).padStart(2, "0");
        setSingleEnd(`${endH}:${endM}`);
      }
    } else if (activePickerTarget === "singleEnd") {
      setSingleEnd(formatted);
    } else if (activePickerTarget === "bulkStart") {
      setBulkStart(formatted);
    } else if (activePickerTarget === "bulkEnd") {
      setBulkEnd(formatted);
    }

    setTimePickerVisible(false);
  };

  const fetchSlots = async () => {
    setLoading(true);
    const res = await apiFetch<any>("/slots");
    if (res.success && res.data) {
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.slots)
        ? res.data.slots
        : [];
      setSlots(list);
    } else {
      setSlots([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(() => {
      fetchSlots();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSingleStartChange = (timeStr: string) => {
    setSingleStart(timeStr);
    if (timeStr.includes(":")) {
      const [h, m] = timeStr.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        let total = h * 60 + m + 30;
        let newH = Math.floor(total / 60) % 24;
        let newM = total % 60;
        setSingleEnd(
          `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`
        );
      }
    }
  };

  const handleCreateSingleSlot = async () => {
    if (!singleDate || !singleStart || !singleEnd) {
      Alert.alert("Missing Fields", "Please enter valid date and time.");
      return;
    }

    const existingForDate = slots.filter((s) => {
      if (!s.startTime) return false;
      return new Date(s.startTime).toISOString().slice(0, 10) === singleDate;
    }).length;

    if (existingForDate >= 100) {
      Alert.alert(
        "Daily Limit Reached",
        "Maximum 100 slots allowed per day for " + singleDate
      );
      return;
    }

    setSubmitting(true);
    const startIso = `${singleDate}T${singleStart}:00.000Z`;
    const endIso = `${singleDate}T${singleEnd}:00.000Z`;

    const res = await apiFetch<any>("/slots", {
      method: "POST",
      body: JSON.stringify({
        startTime: startIso,
        endTime: endIso,
        capacity: 10,
      }),
    });

    if (res.success) {
      Alert.alert("Success", "Single slot created successfully.");
      fetchSlots();
    } else {
      Alert.alert("Error", res.error || "Failed to create slot.");
    }
    setSubmitting(false);
  };

  const handleCreateBulkSlots = async () => {
    if (!bulkDate || !bulkStart || !bulkEnd) {
      Alert.alert("Missing Fields", "Please enter valid window dates and times.");
      return;
    }
    const startMs = Date.parse(`${bulkDate}T${bulkStart}:00.000Z`);
    const endMs = Date.parse(`${bulkDate}T${bulkEnd}:00.000Z`);

    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
      Alert.alert("Invalid Window", "End time must be after start time.");
      return;
    }

    const existingForDate = slots.filter((s) => {
      if (!s.startTime) return false;
      return new Date(s.startTime).toISOString().slice(0, 10) === bulkDate;
    }).length;

    if (existingForDate >= 100) {
      Alert.alert(
        "Daily Limit Reached",
        "Maximum 100 slots allowed per day for " + bulkDate
      );
      return;
    }

    setSubmitting(true);
    const durationMs = bulkDuration * 60 * 1000;
    let current = startMs;
    let count = 0;

    while (current + durationMs <= endMs) {
      if (existingForDate + count >= 100) {
        Alert.alert(
          "Daily Cap Reached",
          `Created ${count} slots. Daily 100 slot cap reached for ${bulkDate}.`
        );
        break;
      }

      const slotStart = new Date(current).toISOString();
      const slotEnd = new Date(current + durationMs).toISOString();

      const res = await apiFetch<any>("/slots", {
        method: "POST",
        body: JSON.stringify({
          startTime: slotStart,
          endTime: slotEnd,
          capacity: 10,
        }),
      });

      if (!res.success) {
        Alert.alert("Error", res.error || "Failed to create bulk slots.");
        break;
      }

      count++;
      current += durationMs;
    }

    if (count > 0) {
      Alert.alert("Success", `Generated ${count} slots of 30 mins each.`);
    }
    fetchSlots();
    setSubmitting(false);
  };

  const handleDeleteSlot = async (slotId: string) => {
    const res = await apiFetch<any>(`/slots/${slotId}`, {
      method: "DELETE",
    });
    if (res.success) {
      fetchSlots();
    } else {
      Alert.alert("Error", res.error || "Failed to delete slot.");
    }
  };

  const uniqueDates = Array.from(
    new Set(
      slots
        .map((s) => (s.startTime ? new Date(s.startTime).toISOString().slice(0, 10) : null))
        .filter((d): d is string => d !== null)
    )
  ).sort();

  const sortedSlots = [...slots].sort((a, b) => {
    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return timeA - timeB;
  });

  const filteredSlots = sortedSlots.filter((s) => {
    if (!filterDate) return true;
    if (!s.startTime) return false;
    return new Date(s.startTime).toISOString().slice(0, 10) === filterDate;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <CalendarDays size={18} color={THEME.colors.accent} />
        <Text style={styles.headerTitle}>Slot Manager Workstation</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchSlots}
            tintColor={THEME.colors.accent}
          />
        }
      >
        {/* Single Slot Form */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Plus size={16} color={THEME.colors.accent} />
            <Text style={styles.cardTitle}>CREATE SINGLE SLOT</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Date (18, 19, 20 Sep)</Text>
            <View style={styles.datePillsRow}>
              {EVENT_DATES.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[
                    styles.datePill,
                    singleDate === d.value && styles.datePillActive,
                  ]}
                  onPress={() => setSingleDate(d.value)}
                >
                  <Text
                    style={[
                      styles.datePillText,
                      singleDate === d.value && styles.datePillTextActive,
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Start Time</Text>
              <TouchableOpacity
                style={styles.timePickerBtn}
                onPress={() => openTimePicker("singleStart", singleStart)}
              >
                <Clock size={15} color={THEME.colors.accent} />
                <Text style={styles.timePickerBtnText}>
                  {singleStart || "Select Time"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>End Time</Text>
              <TouchableOpacity
                style={styles.timePickerBtn}
                onPress={() => openTimePicker("singleEnd", singleEnd)}
              >
                <Clock size={15} color={THEME.colors.accent} />
                <Text style={styles.timePickerBtnText}>
                  {singleEnd || "Select Time"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleCreateSingleSlot}
            disabled={submitting}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? "Creating..." : "Create Single Slot"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bulk Slot Generator */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Layers size={16} color={THEME.colors.accent} />
            <Text style={styles.cardTitle}>BULK SLOT GENERATOR</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Date (18, 19, 20 Sep)</Text>
            <View style={styles.datePillsRow}>
              {EVENT_DATES.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[
                    styles.datePill,
                    bulkDate === d.value && styles.datePillActive,
                  ]}
                  onPress={() => setBulkDate(d.value)}
                >
                  <Text
                    style={[
                      styles.datePillText,
                      bulkDate === d.value && styles.datePillTextActive,
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Window Start</Text>
              <TouchableOpacity
                style={styles.timePickerBtn}
                onPress={() => openTimePicker("bulkStart", bulkStart)}
              >
                <Clock size={15} color={THEME.colors.accent} />
                <Text style={styles.timePickerBtnText}>
                  {bulkStart || "Select Time"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Window End</Text>
              <TouchableOpacity
                style={styles.timePickerBtn}
                onPress={() => openTimePicker("bulkEnd", bulkEnd)}
              >
                <Clock size={15} color={THEME.colors.accent} />
                <Text style={styles.timePickerBtnText}>
                  {bulkEnd || "Select Time"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Slot Duration</Text>
            <View style={styles.durationRow}>
              {[15, 20, 25, 30].map((dur) => (
                <TouchableOpacity
                  key={dur}
                  style={[
                    styles.durationPill,
                    bulkDuration === dur && styles.durationPillActive,
                  ]}
                  onPress={() => setBulkDuration(dur)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      bulkDuration === dur && styles.durationTextActive,
                    ]}
                  >
                    {dur} mins
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.accentBtn}
            onPress={handleCreateBulkSlots}
            disabled={submitting}
          >
            <Text style={styles.accentBtnText}>
              {submitting
                ? "Generating..."
                : `Generate ${bulkDuration}-Min Bulk Slots`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Existing Configured Slots Section */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Configured Game Slots</Text>
          <Text style={styles.listCount}>
            Showing {filteredSlots.length} of {slots.length}
          </Text>
        </View>

        {/* Date Filter Pills */}
        <View style={styles.filterBar}>
          <Filter size={12} color={THEME.colors.textMuted} />
          <TouchableOpacity
            style={[
              styles.filterPill,
              !filterDate && styles.filterPillActive,
            ]}
            onPress={() => setFilterDate("")}
          >
            <Text
              style={[
                styles.filterPillText,
                !filterDate && styles.filterPillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {uniqueDates.map((dateStr) => (
            <TouchableOpacity
              key={dateStr}
              style={[
                styles.filterPill,
                filterDate === dateStr && styles.filterPillActive,
              ]}
              onPress={() => setFilterDate(dateStr)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filterDate === dateStr && styles.filterPillTextActive,
                ]}
              >
                {dateStr.slice(5)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredSlots.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No slots match the date filter.</Text>
          </View>
        ) : (
          <View style={styles.slotList}>
            {filteredSlots.map((slot, idx) => (
              <View key={slot.id || idx} style={styles.slotRow}>
                <View style={styles.slotInfo}>
                  <View style={styles.slotBadge}>
                    <Text style={styles.slotBadgeText}>Slot {idx + 1}</Text>
                  </View>
                  <View style={styles.timeRow}>
                    <Clock size={12} color={THEME.colors.textSecondary} />
                    <Text style={styles.timeText}>
                      {slot.startTime
                        ? new Date(slot.startTime).toLocaleString("en-US", {
                            timeZone: "UTC",
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "N/A"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteSlot(slot.id)}
                >
                  <Trash2 size={16} color={THEME.colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Clock Popup Time Picker Modal */}
      <Modal
        visible={timePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerCard}>
            <View style={styles.pickerHeader}>
              <View style={styles.pickerHeaderTitleRow}>
                <Clock size={18} color={THEME.colors.accent} />
                <Text style={styles.pickerTitle}>SELECT TIME</Text>
              </View>
              <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                <X size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Time Preview Box */}
            <View style={styles.timeDisplayBox}>
              <Text style={styles.timeDisplayBig}>
                {String(selectedHour).padStart(2, "0")}:
                {String(selectedMinute).padStart(2, "0")}
              </Text>
              <Text style={styles.timeDisplaySub}>
                {selectedHour >= 12 ? "PM" : "AM"} (24-Hour Clock)
              </Text>
            </View>

            {/* Hours Selector */}
            <Text style={styles.pickerSectionLabel}>Select Hour (HH)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pickerRowContent}
            >
              {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(
                (h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.pickerNumPill,
                      selectedHour === h && styles.pickerNumPillActive,
                    ]}
                    onPress={() => setSelectedHour(h)}
                  >
                    <Text
                      style={[
                        styles.pickerNumText,
                        selectedHour === h && styles.pickerNumTextActive,
                      ]}
                    >
                      {String(h).padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>

            {/* Minutes Selector */}
            <Text style={styles.pickerSectionLabel}>Select Minute (MM)</Text>
            <View style={styles.pickerMinuteRow}>
              {[0, 15, 20, 25, 30, 45].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.pickerNumPill,
                    selectedMinute === m && styles.pickerNumPillActive,
                  ]}
                  onPress={() => setSelectedMinute(m)}
                >
                  <Text
                    style={[
                      styles.pickerNumText,
                      selectedMinute === m && styles.pickerNumTextActive,
                    ]}
                  >
                    :{String(m).padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Modal Actions */}
            <View style={styles.pickerActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setTimePickerVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={confirmTimePicker}
              >
                <Text style={styles.confirmBtnText}>Confirm Time</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  formCard: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: THEME.colors.textSecondary,
  },
  input: {
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: THEME.colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.borderHover,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  accentBtn: {
    backgroundColor: THEME.colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  accentBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#09090B",
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
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 8,
    borderRadius: 12,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterPillActive: {
    backgroundColor: THEME.colors.accentBg,
    borderColor: THEME.colors.accent,
  },
  filterPillText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  filterPillTextActive: {
    color: THEME.colors.accent,
    fontWeight: "700",
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
  slotList: {
    gap: 8,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 12,
  },
  slotInfo: {
    gap: 4,
  },
  slotBadge: {
    alignSelf: "flex-start",
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.accent,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  deleteBtn: {
    padding: 8,
  },
  durationRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
  },
  durationPillActive: {
    backgroundColor: THEME.colors.accentBg,
    borderColor: THEME.colors.accent,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.textMuted,
  },
  durationTextActive: {
    color: THEME.colors.accent,
    fontWeight: "700",
  },
  datePillsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  datePill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
  },
  datePillActive: {
    backgroundColor: THEME.colors.accentBg,
    borderColor: THEME.colors.accent,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.textMuted,
  },
  datePillTextActive: {
    color: THEME.colors.accent,
    fontWeight: "700",
  },
  timePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timePickerBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  timePickerCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: THEME.colors.textPrimary,
    letterSpacing: 0.5,
  },
  timeDisplayBox: {
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  timeDisplayBig: {
    fontSize: 32,
    fontWeight: "900",
    color: THEME.colors.accent,
    letterSpacing: 1,
  },
  timeDisplaySub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  pickerSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pickerRowContent: {
    gap: 6,
  },
  pickerMinuteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pickerNumPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    minWidth: 44,
    alignItems: "center",
  },
  pickerNumPillActive: {
    backgroundColor: THEME.colors.accentBg,
    borderColor: THEME.colors.accent,
  },
  pickerNumText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textMuted,
  },
  pickerNumTextActive: {
    color: THEME.colors.accent,
    fontWeight: "800",
  },
  pickerActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textMuted,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: THEME.colors.accent,
    borderRadius: 10,
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000000",
  },
});
