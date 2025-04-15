import { useState } from "react";
import { Text, TextInput, View, Button } from "react-native";
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

    <View style={{ padding: 20, marginTop: 100 }}>
        <Text style={{ fontSize: 24, marginBottom: 10 }}>Login</Text>

        <Text>Email</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" style={{ borderWidth: 1 }} />
        <Text>Password</Text>
        <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            style={{ borderWidth: 1 }}
        />
        <Button title="Log In" onPress={handleLogin} />
        {error && <Text style={{ color: "red" }}>{error}</Text>}

        <Text style={{ marginTop: 20 }}>Don't have an account?</Text>
        <Button title="Sign Up" onPress={handleSignUp} />
    </View>
    );
}
