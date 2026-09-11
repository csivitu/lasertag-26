import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";

export default function WelcomeSplashScreen() {
  const handleEnter = () => {
    router.replace("/(tabs)");
  };

  return (
    <Pressable style={styles.container} onPress={handleEnter}>
      <SafeAreaView style={styles.safeArea}>
        {/* Center Hero Section - Clean official LaserTag SVG Logo */}
        <View style={styles.centerSection}>
          <Image
            source={require("@/assets/images/logo.svg")}
            style={styles.heroLogo}
            contentFit="contain"
          />
        </View>

        {/* Bottom Brand Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTextGroup}>
            <Text style={styles.footerTitle}>Computer Society</Text>
            <Text style={styles.footerSubtitle}>VIT Student Branch</Text>
          </View>

          {/* Tri-Color Stripe Badge (Orange / White / Green) */}
          <View style={styles.stripeBadge}>
            <View style={[styles.stripe, { backgroundColor: "#FF7700" }]} />
            <View style={[styles.stripe, { backgroundColor: "#FFFFFF" }]} />
            <View style={[styles.stripe, { backgroundColor: "#138808" }]} />
          </View>
        </View>
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1B1F",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  centerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  heroLogo: {
    width: 240,
    height: 240,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 20,
  },
  footerTextGroup: {
    alignItems: "flex-end",
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FAFAFA",
    letterSpacing: -0.3,
  },
  footerSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "#A1A1AA",
  },
  stripeBadge: {
    flexDirection: "row",
    height: 18,
    borderRadius: 3,
    overflow: "hidden",
    transform: [{ skewX: "-20deg" }],
  },
  stripe: {
    width: 10,
    height: "100%",
  },
});
