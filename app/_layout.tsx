
import { Slot } from "expo-router";
import { AuthProvider } from "@/providers/AuthProvider";
import Toast from "react-native-toast-message";
import { ThemeProvider } from './ThemeContext';


export default function RootLayout() {
  return (
    <ThemeProvider>
      {/* Wrap your app with the AuthProvider */}
    <AuthProvider>
      <Slot />
      <Toast />
    </AuthProvider>
    </ThemeProvider>
  );
}
