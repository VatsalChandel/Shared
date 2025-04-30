import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Switch, Button, SafeAreaView, Alert, Pressable } from 'react-native';
import { ThemeContext } from '.././ThemeContext';
import { auth, db } from "@/firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { router } from "expo-router";



const Profile = () => {
  const headingText = 40; 
  const normalText = 20; 
  const text = 18; 



  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const user = auth.currentUser;
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();
      setName(data?.name);
      setGroupId(data?.groupId || null);
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
  };

  const handleLeaveGroup = async () => {
    if (!user || !groupId) return;

    Alert.alert(
      "Leave Group?",
      "Are you sure you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Leave",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove user from group members
              const groupRef = doc(db, "roommateGroups", groupId);
              await updateDoc(groupRef, {
                members: arrayRemove(user.uid)
              });

              // Clear groupId on user
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, { groupId: null });

              Alert.alert("Success", "You’ve left the group.");
              router.replace("/group-setup");
            } catch (err) {
              console.error("Error leaving group:", err);
              Alert.alert("Error", "Unable to leave group. Try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#f9f9f9" }}>
      <View style={{ padding: 20 }}>

      <Text style={{ fontSize:headingText, fontWeight: "600", marginBottom: 10, color: isDark ? "#fff" : "#000" }}>{name}'s Profile</Text>


        <Text style={{ fontSize: 20, color: isDark ? "#ccc" : "#555", marginBottom: 10 }}>
          Your Email: <Text style={{ fontWeight: "500", color: isDark ? "#fff" : "#000" }}>{user?.email}</Text>
        </Text>


        <Text style={{ fontSize: 18, color: isDark ? "#fff" : "#000" }}>Dark Mode</Text>
        <Switch value={theme === 'dark'} onValueChange={toggleTheme} />

          {groupId && (
          <Pressable  onPress={handleLeaveGroup}>
            <View style={{ marginTop:20, backgroundColor: "#007bff", padding: 16, borderRadius: 8, alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "500", fontSize:normalText }}>Leave Group</Text>
            </View>
          </Pressable>
        )}


         <Pressable  onPress={handleLogout}>
            <View style={{ marginTop:20, backgroundColor: "#007bff", padding: 16, borderRadius: 8, alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "500", fontSize:normalText }}>Logout</Text>
            </View>
          </Pressable>


      </View>
    </SafeAreaView>
  );
};

export default Profile;
