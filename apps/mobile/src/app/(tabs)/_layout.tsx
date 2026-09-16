import { Tabs } from "expo-router";
import { LayoutDashboard, QrCode, CalendarDays } from "lucide-react-native";
// DEPRECATED: team feature disabled — re-add Users icon to restore Teams tab.
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { THEME } from "@/constants/theme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Ensure extra bottom padding for Android gesture bar and iOS home indicator
  const bottomInset = Math.max(insets.bottom, 24);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.accent,
        tabBarInactiveTintColor: THEME.colors.textMuted,
        tabBarStyle: {
          backgroundColor: THEME.colors.surface,
          borderTopColor: THEME.colors.border,
          borderTopWidth: 1,
          height: 58 + bottomInset,
          paddingBottom: bottomInset - 4,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "QR Scanner",
          tabBarIcon: ({ color, size }) => (
            <QrCode size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="slots"
        options={{
          title: "Slot Manager",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size || 20} color={color} />
          ),
        }}
      />
      {/* DEPRECATED: team feature disabled — uncomment to restore Teams tab. */}
      {/* <Tabs.Screen
        name="teams"
        options={{
          title: "Teams",
          tabBarIcon: ({ color, size }) => (
            <Users size={size || 20} color={color} />
          ),
        }}
      /> */}
    </Tabs>
  );
}
