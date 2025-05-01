// /app/(protected)/_layout.tsx

import { Tabs, useRouter, useSegments } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/providers/AuthProvider";

import { View, Platform, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";


export default function ProtectedLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments() as string[];
  const colorScheme = useColorScheme();

  const [hasMounted, setHasMounted] = useState(false);
  const inAuthFlow = segments[0] === "login" || segments[0] === "signup";

  useEffect(() => {
    if (!hasMounted || loading) return;
  
    // Not logged in → login
    if (!user && !inAuthFlow) {
      router.replace("/login");
      return;
    }
  
    // Logged in but no groupId → group setup page
    if (user && !inAuthFlow) {
      const checkUserGroup = async () => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const groupId = userSnap?.data()?.groupId;
  
        if (!groupId) {
          router.replace("/group-setup");
        }
      };
  
      checkUserGroup();
    }
  }, [user, loading, hasMounted, inAuthFlow]);
  

  useEffect(() => {
    requestAnimationFrame(() => setHasMounted(true));
  }, []);

  useEffect(() => {
    console.log("✅ ProtectedLayout: user =", user, "loading =", loading, "segments =", segments);

    if (!hasMounted || loading) return;

    if (!user && !inAuthFlow) {
      router.replace("/login");
    } else if (user && inAuthFlow) {
      router.replace("/");
    }
  }, [user, loading, hasMounted, inAuthFlow]);

  if (!hasMounted || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: "absolute" },
          default: { position: "absolute", bottom: 0, backgroundColor: Colors[colorScheme ?? "light"].background },
          android: { backgroundColor: Colors[colorScheme ?? "light"].background }
        }),
      }}
    >

      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="chores"
        options={{
          title: "Chores",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />


      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
