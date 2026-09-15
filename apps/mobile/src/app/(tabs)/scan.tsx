import { useState } from "react";
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
import { QrCode, CheckCircle, AlertCircle, RefreshCw, Search } from "lucide-react-native";
import { THEME } from "@/constants/theme";
import { apiFetch } from "@/lib/api";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    teamName?: string;
  } | null>(null);

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
      setResult({
        success: true,
        message: res.data?.message || "Participant Check-In Verified!",
        teamName: res.data?.teamName || res.data?.team?.name,
      });
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
            {result.success ? (
              <CheckCircle size={28} color={THEME.colors.accent} />
            ) : (
              <AlertCircle size={28} color={THEME.colors.danger} />
            )}
            <View style={styles.resultDetails}>
              <Text
                style={[
                  styles.resultTitle,
                  { color: result.success ? THEME.colors.accent : THEME.colors.danger },
                ]}
              >
                {result.success ? "CHECK-IN VERIFIED" : "CHECK-IN FAILED"}
              </Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
              {result.teamName && (
                <Text style={styles.resultTeam}>Team: {result.teamName}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.resetBtn} onPress={resetScanner}>
              <RefreshCw size={16} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
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
  permissionCard: {
    padding: 24,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  permissionDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: "center",
  },
  permissionBtn: {
    backgroundColor: THEME.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  permissionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090B",
  },
  cameraContainer: {
    height: 300,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: THEME.colors.border,
    position: "relative",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9, 9, 11, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  reticleBox: {
    width: 180,
    height: 180,
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
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
  },
  resultText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: THEME.colors.accentBg,
    borderColor: THEME.colors.accent,
  },
  resultError: {
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderColor: THEME.colors.danger,
  },
  resultDetails: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  resultMessage: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  resultTeam: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  resetBtn: {
    padding: 8,
  },
  manualCard: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  manualTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  manualInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    height: 40,
    fontSize: 12,
    color: THEME.colors.textPrimary,
  },
  verifyBtn: {
    backgroundColor: THEME.colors.accent,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  verifyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090B",
  },
});
