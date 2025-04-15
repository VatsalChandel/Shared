// app/layout.tsx
import { Slot, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";

export default function AppLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  const [hasMounted, setHasMounted] = useState(false);
  const inAuthFlow = segments?.[0] === "login" || segments?.[0] === "signup";

  useEffect(() => {
    requestAnimationFrame(() => setHasMounted(true));
  }, []);

  useEffect(() => {
    console.log("layout.tsx: user", user, "loading", loading, "inAuthFlow", inAuthFlow);
    if (!hasMounted || loading) return;

    if (!user && !inAuthFlow) {
      router.replace("/login");
    }

    if (user && inAuthFlow) {
      router.replace("/");
    }
  }, [user, loading, inAuthFlow, hasMounted]);

  if (!hasMounted || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}
