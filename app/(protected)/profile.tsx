// /app/(protected)/profile.tsx


import { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { router } from "expo-router";




export default function Profile() {
    const user = auth.currentUser;
    const [name, setName] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const name = userSnap.data()?.name;
        setName(name);
        };
    
        fetchUserData();
    }, []);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.replace("/login");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    }

    return (
    <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20 }}>Your Name: {name}</Text>
        <Text style={{ fontSize: 20 }}>Your email: {user?.email}</Text>

        <Button title= "Logout" onPress={handleLogout} />
        </View>
    );
}