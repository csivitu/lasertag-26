import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import {
  QrCode,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Users,
  User,
  Clock,
} from "lucide-react-native";
import { THEME } from "@/constants/theme";
import { apiFetch } from "@/lib/api";

interface WaitingTeam {
  teamCode: string;
  teamName: string;
  slot: string;
  side: string;
  arrivedCount: number;
  totalMembers: number;
  arrivalStatus: string;
  members: Array<{ id: string; name: string; regNo: string; checkedInAt: string }>;
}

interface WaitingSolo {
  id: string;
  name: string;
  regNo: string;
  slot: string;
  side: string;
  checkedInAt: string;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    name?: string;
    regNo?: string;
    isTeam?: boolean;
    teamName?: string;
    arrivedCount?: number;
    totalTeamCount?: number;
    arrivalMessage?: string;
    slot?: string;
    side?: string;
  } | null>(null);

  // Live waiting queue
  const [waitingTeams, setWaitingTeams] = useState<WaitingTeam[]>([]);
  const [waitingSolos, setWaitingSolos] = useState<WaitingSolo[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);

  const fetchWaitlist = async () => {
    try {
      setQueueLoading(true);
      const res = await apiFetch<any>("/verification/waiting-queue");
      if (res.success && res.data) {
        setWaitingTeams(res.data.teams || []);
        setWaitingSolos(res.data.solos || []);
      }
    } catch {
      // ignore
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await verifyCode(data);
  };

  const verifyCode = async (code: string) => {
    if (!code) return;
    setLoading(true);
    setResult(null);

    const res = await apiFetch<any>("/verification/checkin", {
      method: "POST",
      body: JSON.stringify({ qrData: code }),
    });

    if (res.success) {
      const d = res.data;
      setResult({
        success: true,
        message: (res as any).message || "Participant Check-In Verified!",
        name: d?.name || d?.user?.name,
        regNo: d?.regNo || d?.user?.regNo,
        isTeam: d?.isTeam,
        teamName: d?.teamName || d?.team?.name,
        arrivedCount: d?.arrivedCount,
        totalTeamCount: d?.totalTeamCount,
        arrivalMessage: d?.arrivalMessage,
        slot: d?.slot,
        side: d?.side,
      });
      // Refresh live waitlist
      fetchWaitlist();
    } else {
      setResult({
        success: false,
        message: res.error || "Invalid or unverified QR Code",
      });
    }
    setLoading(false);
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    await verifyCode(manualCode.trim());
    setManualCode("");
  };

  const resetScanner = () => {
    setScanned(false);
    setResult(null);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  const totalWaiting = waitingTeams.reduce((acc, t) => acc + t.arrivedCount, 0) + waitingSolos.length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <QrCode size={18} color={THEME.colors.accent} />
        <Text style={styles.headerTitle}>QR Scanner Station</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Camera Permission Prompt */}
        {!permission.granted ? (
          <View style={styles.permissionCard}>
            <AlertCircle size={32} color={THEME.colors.amber} />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionDesc}>
              LaserTag Staff needs camera access to scan participant ticket QR codes.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={requestPermission}
            >
              <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Camera Viewfinder */
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
            {/* Viewfinder reticle overlay */}
            <View style={styles.overlay}>
              <View style={styles.reticleBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.reticleText}>
                {scanned ? "Scanned!" : "Align QR Code inside frame"}
              </Text>
            </View>
          </View>
        )}

        {/* Scan Results Card */}
        {loading && (
          <View style={styles.resultBox}>
            <ActivityIndicator color={THEME.colors.accent} />
            <Text style={styles.resultText}>Verifying Participant QR...</Text>
          </View>
        )}

        {result && (
          <View
            style={[
              styles.resultCard,
              result.success ? styles.resultSuccess : styles.resultError,
            ]}
          >
            <View style={styles.resultHeaderRow}>
              {result.success ? (
                <CheckCircle size={24} color={THEME.colors.accent} />
              ) : (
                <AlertCircle size={24} color={THEME.colors.danger} />
              )}
              <Text
                style={[
                  styles.resultTitle,
                  { color: result.success ? THEME.colors.accent : THEME.colors.danger },
                ]}
              >
                {result.success ? "VERIFIED & ADDED TO WAITLIST" : "CHECK-IN FAILED"}
              </Text>

              <TouchableOpacity style={styles.resetBtn} onPress={resetScanner}>
                <RefreshCw size={16} color={THEME.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.resultDetails}>
              {result.name && (
                <Text style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Operative: </Text>
                  <Text style={styles.detailValue}>{result.name}</Text>
                </Text>
              )}
              {result.regNo && (
                <Text style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reg No: </Text>
                  <Text style={styles.detailValue}>{result.regNo}</Text>
                </Text>
              )}

              {/* Team or Solo Distinction */}
              {result.isTeam ? (
                <View style={styles.teamStatusBox}>
                  <Text style={styles.teamNameLabel}>TEAM: {result.teamName}</Text>
                  <Text style={styles.arrivalStatusBadge}>
                    🎯 {result.arrivalMessage || `${result.arrivedCount} has arrived (${result.arrivedCount}/${result.totalTeamCount})`}
                  </Text>
                </View>
              ) : (
                <View style={styles.soloStatusBox}>
                  <Text style={styles.soloBadgeText}>👤 SOLO OPERATIVE ARRIVED</Text>
                </View>
              )}

              {result.slot && (
                <Text style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Slot: </Text>
                  <Text style={styles.detailValue}>{result.slot}</Text>
                </Text>
              )}
              {result.side && (
                <Text style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Side: </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: result.side.toLowerCase() === "red" ? "#FF0055" : THEME.colors.accent },
                    ]}
                  >
                    {result.side.toUpperCase()}
                  </Text>
                </Text>
              )}
              <Text style={styles.resultMessage}>{result.message}</Text>
            </View>
          </View>
        )}

        {/* Manual Fallback Entry Form */}
        <View style={styles.manualCard}>
          <Text style={styles.manualTitle}>Manual Code Entry</Text>
          <View style={styles.manualInputRow}>
            <View style={styles.inputWrapper}>
              <Search size={14} color={THEME.colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter Registration / QR Code ID..."
                placeholderTextColor={THEME.colors.textMuted}
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={handleManualSubmit}
              disabled={loading || !manualCode.trim()}
            >
              <Text style={styles.verifyBtnText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Verified & Waiting List Arena Queue */}
        <View style={styles.queueCard}>
          <View style={styles.queueHeader}>
            <View style={styles.queueHeaderLeft}>
              <Clock size={16} color={THEME.colors.accent} />
              <Text style={styles.queueTitle}>
                ARENA WAITLIST ({totalWaiting} ARRIVED)
              </Text>
            </View>
            <TouchableOpacity
              onPress={fetchWaitlist}
              disabled={queueLoading}
              style={styles.queueRefreshBtn}
            >
              {queueLoading ? (
                <ActivityIndicator size="small" color={THEME.colors.accent} />
              ) : (
                <RefreshCw size={14} color={THEME.colors.textPrimary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Teams Waiting */}
          {waitingTeams.length > 0 && (
            <View style={styles.queueSection}>
              <Text style={styles.queueSectionTitle}>TEAMS WAITING</Text>
              {waitingTeams.map((t) => (
                <View key={t.teamCode} style={styles.queueTeamCard}>
                  <View style={styles.queueTeamTop}>
                    <View style={styles.teamBadgeRow}>
                      <Users size={14} color="#00F0FF" />
                      <Text style={styles.queueTeamName}>{t.teamName}</Text>
                    </View>
                    <Text style={styles.queueArrivalBadge}>
                      {t.arrivalStatus}
                    </Text>
                  </View>
                  <Text style={styles.queueMetaText}>
                    Slot: {t.slot} | Side: {t.side}
                  </Text>
                  <View style={styles.queueMembersList}>
                    {t.members.map((m) => (
                      <Text key={m.id} style={styles.queueMemberItem}>
                        • {m.name} ({m.regNo}) - Arrived
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Solos Waiting */}
          {waitingSolos.length > 0 && (
            <View style={styles.queueSection}>
              <Text style={styles.queueSectionTitle}>SOLO OPERATIVES</Text>
              {waitingSolos.map((s) => (
                <View key={s.id} style={styles.queueSoloCard}>
                  <View style={styles.teamBadgeRow}>
                    <User size={14} color="#FEDC02" />
                    <Text style={styles.queueSoloName}>{s.name}</Text>
                    <Text style={styles.soloTag}>SOLO</Text>
                  </View>
                  <Text style={styles.queueMetaText}>
                    Reg: {s.regNo} | Slot: {s.slot} | Side: {s.side}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {waitingTeams.length === 0 && waitingSolos.length === 0 && !queueLoading && (
            <Text style={styles.emptyQueueText}>
              No verified participants currently waiting in the arena queue.
            </Text>
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  cameraContainer: {
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: THEME.colors.surface,
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  reticleBox: {
    width: 200,
    height: 200,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: THEME.colors.accent,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  reticleText: {
    marginTop: 16,
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  permissionCard: {
    backgroundColor: THEME.colors.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  permissionDesc: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  permissionBtn: {
    marginTop: 8,
    backgroundColor: THEME.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: THEME.colors.bg,
    fontWeight: "700",
    fontSize: 14,
  },
  resultBox: {
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  resultText: {
    color: THEME.colors.textMuted,
    fontSize: 14,
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  resultSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: THEME.colors.accent,
  },
  resultError: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: THEME.colors.danger,
  },
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  resetBtn: {
    padding: 4,
  },
  resultDetails: {
    marginTop: 4,
    gap: 6,
  },
  detailRow: {
    fontSize: 13,
  },
  detailLabel: {
    color: THEME.colors.textMuted,
    fontWeight: "600",
  },
  detailValue: {
    color: THEME.colors.textPrimary,
    fontWeight: "700",
  },
  teamStatusBox: {
    padding: 8,
    backgroundColor: "rgba(0, 240, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.3)",
    borderRadius: 8,
    marginVertical: 4,
    gap: 4,
  },
  teamNameLabel: {
    color: "#00F0FF",
    fontWeight: "700",
    fontSize: 13,
  },
  arrivalStatusBadge: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  soloStatusBox: {
    padding: 6,
    backgroundColor: "rgba(254, 220, 2, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(254, 220, 2, 0.3)",
    borderRadius: 8,
    marginVertical: 4,
  },
  soloBadgeText: {
    color: "#FEDC02",
    fontWeight: "700",
    fontSize: 12,
  },
  resultMessage: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  manualCard: {
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 12,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  manualInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    paddingVertical: 8,
  },
  verifyBtn: {
    backgroundColor: THEME.colors.accent,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  verifyBtnText: {
    color: THEME.colors.bg,
    fontWeight: "700",
    fontSize: 13,
  },
  queueCard: {
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 12,
  },
  queueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 8,
  },
  queueHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  queueTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  queueRefreshBtn: {
    padding: 4,
  },
  queueSection: {
    gap: 8,
  },
  queueSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  queueTeamCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  queueTeamTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teamBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  queueTeamName: {
    color: "#00F0FF",
    fontWeight: "700",
    fontSize: 13,
  },
  queueArrivalBadge: {
    color: "#22C55E",
    fontWeight: "700",
    fontSize: 11,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  queueMetaText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  queueMembersList: {
    marginTop: 4,
    gap: 2,
  },
  queueMemberItem: {
    fontSize: 11,
    color: THEME.colors.textPrimary,
  },
  queueSoloCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  queueSoloName: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  soloTag: {
    color: "#FEDC02",
    fontSize: 10,
    fontWeight: "700",
    backgroundColor: "rgba(254, 220, 2, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  emptyQueueText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 12,
  },
});
