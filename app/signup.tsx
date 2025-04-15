import { useState } from "react";
import { Text, TextInput, View, Button } from "react-native";
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

        // Add user info to Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: user.email,
            groupId: null, // you can update this later
            createdAt: new Date(),
        });

        router.replace("/"); // redirect to home
        } catch (err: any) {
        setError(err.message);
        }
    };

    const handleLogin = () => {
        router.push("/login"); // navigate to signup screen
    };

    return (
    <View style={{ padding: 20, marginTop: 100 }}>

        <Text style={{ fontSize: 24, marginBottom: 10 }}>Sign Up</Text>


        <Text>Name</Text>
        <TextInput value={name} onChangeText={setName} autoCapitalize="words" style={{ borderWidth: 1 }} />

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
        <Button title="Sign Up" onPress={handleSignup} />
        {error && <Text style={{ color: "red" }}>{error}</Text>}

        <Text style={{ marginTop: 20 }}>Already have an account?</Text>
        <Button title="Login" onPress={handleLogin} />

        </View>
    );
}
