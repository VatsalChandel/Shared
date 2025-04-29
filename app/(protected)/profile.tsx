import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Switch, Button, SafeAreaView, Alert } from 'react-native';
import { ThemeContext } from '.././ThemeContext';
import { auth, db } from "@/firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { router } from "expo-router";

const Profile = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 26, marginBottom: 15 }}>{name}'s Profile</Text>
        <Text style={{ fontSize: 20, marginBottom: 15 }}>Your email: {user?.email}</Text>

        <Text style={{ fontSize: 18 }}>Dark Mode</Text>
        <Switch value={theme === 'dark'} onValueChange={toggleTheme} />

        {groupId && (
          <Button title="Leave Group" color="orange" onPress={handleLeaveGroup} />
        )}

        <View style={{ marginTop: 20 }}>
          <Button title="Logout" onPress={handleLogout} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
