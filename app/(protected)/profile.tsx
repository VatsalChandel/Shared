import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet, Button, SafeAreaView, ScrollView } from 'react-native';
import { ThemeContext } from '.././ThemeContext';

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { router } from "expo-router";



const Profile = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

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

    <SafeAreaView style={{ flex: 1 }}>
      <View style={{padding: 20}}>


        
        <Text style={{ fontSize: 26, marginBottom:15 }}>{name}'s Profile</Text>
        <Text style={{ fontSize: 20, marginBottom:15 }}>Your email: {user?.email}</Text>


        <Text style={{fontSize: 18}}>Dark Mode</Text>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
        />

        <Button title= "Logout" onPress={handleLogout} />



    </View>
    </SafeAreaView>


    
  );
};


export default Profile;
