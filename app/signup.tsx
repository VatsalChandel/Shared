import { useState } from "react";
import {
  Text,
  TextInput,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Button
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { router } from "expo-router";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email: user.email,
        groupId: null,
        createdAt: new Date(),
      });

      router.replace("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "center" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 40, fontWeight: "700", marginBottom: 16, textAlign: "center" }}>Create Account ☕</Text>

          <Text style={{ fontSize: 14, marginBottom: 4 }}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="John Doe"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 6,
              marginBottom: 12,
              backgroundColor: "#fff",

            }}
          />

          <Text style={{ fontSize: 14, marginBottom: 4 }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            placeholder="email@example.com"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 6,
              marginBottom: 12,
              backgroundColor: "#fff",

            }}
          />

          <Text style={{ fontSize: 14, marginBottom: 4 }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Enter password"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 6,
              marginBottom: 20,
              backgroundColor: "#fff",

            }}
          />


          <Pressable  onPress={handleSignup}>
            <View style={{ backgroundColor: "#007bff", padding: 16, borderRadius: 8, alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "500" }}>Sign Up</Text>
            </View>
          </Pressable>


          {error ? <Text style={{ color: "red", padding: 15, textAlign: "center" }}>{"Please enter a valid email and password"}</Text> : null}


          <View style={{ marginTop: 32, alignItems: "center" }}>
          <Text style={{ fontSize: 14, marginBottom: 8 }}>Already have an account?</Text>
            <Pressable onPress={() => router.push("/login")}>
              <Text style={{ color: "#007bff", fontWeight: "500" }}>Log In</Text>
            </Pressable>
          </View>

          
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
