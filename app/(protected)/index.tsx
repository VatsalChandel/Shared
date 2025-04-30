// /app/(protected)/index.tsx
import { useEffect, useState, useContext } from "react";
import { View, Text, ScrollView, SafeAreaView } from "react-native";
import { auth, db } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";

import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { Alert, Pressable } from "react-native";

import { ThemeContext } from "../ThemeContext";

import { StatusBar, useColorScheme } from 'react-native';





export default function Index() {

  const headingText = 40; 
  const normalText = 20; 
  const text = 18; 

  const user = auth.currentUser;

  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [roommates, setRoommates] = useState<string[]>([]);
  const [chores, setChores] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoommates = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const groupId = userSnap.data()?.groupId;
      setGroupId(groupId);

      if (groupId) {
        const groupRef = doc(db, "roommateGroups", groupId);
        const groupSnap = await getDoc(groupRef);
        const memberIds: string[] = groupSnap.data()?.members || [];

        const roommateNames: string[] = [];
        for (const uid of memberIds) {
          const rmSnap = await getDoc(doc(db, "users", uid));
          const name = rmSnap.data()?.name;
          if (name) roommateNames.push(name);
        }



        setRoommates(roommateNames);
      }
    };

    fetchRoommates();
  }, []);

  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const groupId = userSnap.data()?.groupId;
      setUserName(userSnap.data()?.name);

      if (groupId) {
        const groupRef = doc(db, "roommateGroups", groupId);
        const groupSnap = await getDoc(groupRef);
        setGroupName(groupSnap.data()?.name || "Unnamed group");
        setInviteCode(groupSnap.data()?.inviteCode || "No invite code");
      }
    };

    fetchGroupInfo();
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;

    const fetchRealtimeChores = async () => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const groupId = userSnap.data()?.groupId;
      setGroupId(groupId);
      setUserName(userSnap.data()?.name);

      if (!groupId) return;

      const choresRef = collection(db, `roommateGroups/${groupId}/chores`);

      unsubscribe = onSnapshot(choresRef, (snapshot) => {
        const updatedChores = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChores(updatedChores);
      });
    };

    fetchRealtimeChores();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !groupId) return;

    const eventsRef = collection(db, `roommateGroups/${groupId}/calendar`);
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const updatedEvents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(updatedEvents);
    });

    return () => unsubscribe();
  }, [user, groupId]);

  const myChores = chores.filter(
    (chore) => Array.isArray(chore.assignedTo) && chore.assignedTo.includes(user?.email)
  );

  const myEvents = events.filter(
    (event) =>
      event.createdBy?.email === user?.email ||
      event.attending?.includes(user?.email)
  );

    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";


return (
  <>

  <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

  <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#f9f9f9" }}>

    <View style={{ padding: 20 }}>
      <Text style={{ fontSize:headingText, fontWeight: "600", marginBottom: 10, color: isDark ? "#fff" : "#000" }}>
        Welcome, {userName} 👋
      </Text>

      <Text style={{ fontSize: 20, color: isDark ? "#ccc" : "#555", marginBottom: 10 }}>
        Pod Name: <Text style={{ fontWeight: "500", color: isDark ? "#fff" : "#000" }}>{groupName}</Text>
      </Text>

      <Pressable
        onPress={async () => {
          await Clipboard.setStringAsync(inviteCode);
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync("", {
              dialogTitle: "Share your group invite code",
              UTI: "public.text",
              mimeType: "text/plain",
            });
          }
        }}
      >
        <Text style={{ fontSize:normalText, color: isDark ? "#aaa" : "#666", marginBottom: 20 }}>
          Invite Code:{" "}
          <Text style={{ fontWeight: "bold", color: "#007AFF", textDecorationLine: "underline" }}>
            {inviteCode} (tap to share)
          </Text>
        </Text>
      </Pressable>
    </View>

    <ScrollView style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#f9f9f9" }}>
      <View style={{ marginBottom: 20, backgroundColor: isDark ? "#1e1e1e" : "#fff", padding: 15, borderRadius: 12 }}>
        <Text style={{ fontSize:normalText, fontWeight: "600", marginBottom: 8, color: isDark ? "#fff" : "#000" }}>Roommates</Text>
        {roommates.map((name, i) => (
          <Text key={i} style={{ fontSize: text, color: isDark ? "#ccc" : "#333", marginLeft: 8 }}>• {name}</Text>
        ))}
      </View>

      <View style={{ marginBottom: 20, backgroundColor: isDark ? "#1e1e1e" : "#fff", padding: 15, borderRadius: 12 }}>
        <Text style={{ fontSize:normalText, fontWeight: "600", marginBottom: 8, color: isDark ? "#fff" : "#000" }}>Your Chores</Text>
        {myChores.length > 0 ? (
          myChores.map((chore, index) => (
            <Text key={index} style={{ fontSize: text, marginLeft: 8, color: isDark ? "#ccc" : "#444" }}>
              • {chore.text} {chore.completed ? "✅" : ""}
            </Text>
          ))
        ) : (
          <Text style={{ fontSize: text, marginLeft: 8, fontStyle: "italic", color: "gray" }}>
            You have no chores.
          </Text>
        )}
      </View>

      <View style={{ marginBottom: 20, backgroundColor: isDark ? "#1e1e1e" : "#fff", padding: 15, borderRadius: 12 }}>
        <Text style={{ fontSize: normalText, fontWeight: "600", marginBottom: 8, color: isDark ? "#fff" : "#000" }}>Your Events</Text>
        {myEvents.length > 0 ? (
          myEvents.map((event, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: text, fontWeight: "500", color: isDark ? "#eee" : "#333" }}>
                {event.title}
              </Text>
              <Text style={{ fontSize: text, color: isDark ? "#aaa" : "#666" }}>
                📅 {event.displayDate}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: text, marginLeft: 8, fontStyle: "italic", color: "gray" }}>
            You have no events.
          </Text>
        )}
      </View>
    </ScrollView>
  </SafeAreaView>

  </>
);



}
