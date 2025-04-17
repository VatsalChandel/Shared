import { Slot } from "expo-router";
import { AuthProvider } from "@/providers/AuthProvider";
import Toast from "react-native-toast-message";


export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
      <Toast />
    </AuthProvider>
  );
}
