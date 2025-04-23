// /app/login.tsx


import { useState } from "react";
import { Text, TextInput, View, Button, Pressable } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { router } from "expo-router";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async () => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        router.replace("/"); // go to home screen
        } catch (err: any) {
        setError(err.message);
        }
    };

    const handleSignUp = () => {
        router.push("/signup"); // navigate to signup screen
    };


    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f9f9f9" }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 24, textAlign: "center" }}>
            Welcome Back 👋
          </Text>
      
         
      
          <Text style={{ marginBottom: 4, fontWeight: "500" }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Enter your email"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              backgroundColor: "#fff",
            }}
          />
      
          <Text style={{ marginBottom: 4, fontWeight: "500" }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Enter your password"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 12,
              borderRadius: 8,
              marginBottom: 24,
              backgroundColor: "#fff",
            }}
          />
      
          <Pressable  onPress={handleLogin}>
            <View style={{ backgroundColor: "#007bff", padding: 16, borderRadius: 8, alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "500" }}>Login</Text>
            </View>
          </Pressable>
      

          {error ? (
            <Text style={{ color: "red", padding: 15, textAlign: "center" }}>
              {"Please enter a valid email and password"}
            </Text>
          ) : null}



          <View style={{ marginTop: 32, alignItems: "center" }}>
            <Text style={{ marginBottom: 8 }}>Don't have an account?</Text>
            <Pressable onPress={handleSignUp}>
              <Text style={{ color: "#007bff", fontWeight: "500" }}>Create an account</Text>
            </Pressable>
          </View>
        </View>
      );
      
}
