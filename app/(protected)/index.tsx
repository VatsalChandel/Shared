// /app/(protected)/index.tsx
import { useEffect, useState } from "react";
import { View, Text, ScrollView, SafeAreaView } from "react-native";
import { auth, db } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";

export default function Index() {
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

        const roommateEmails: string[] = [];
        for (const uid of memberIds) {
          const rmSnap = await getDoc(doc(db, "users", uid));
          const email = rmSnap.data()?.email;
          if (email) roommateEmails.push(email);
        }

        setRoommates(roommateEmails);
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

  const choresWithNames = chores.map(chore => {
    const createdBy = chore.createdBy;
    const createdByName = createdBy.name;
    return {
      ...chore,
      createdByName: createdByName,
    };
  });

  const myChores = choresWithNames.filter(chore => chore.createdByName === userName);

  const myEvents = events.filter(
    (event) =>
      event.createdBy?.email === user?.email ||
      event.attending?.includes(user?.email)
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: "#f9f9f9" }}>
      <Text style={{ fontSize: 26, fontWeight: "600", marginBottom: 10 }}>
        Welcome, {userName} 👋
      </Text>
      <Text style={{ fontSize: 18, color: "#555", marginBottom: 10 }}>
        Pod Name: <Text style={{ fontWeight: "500" }}>{groupName}</Text>
      </Text>
      <Text style={{ fontSize: 16, color: "#666", marginBottom: 20 }}>
        Invite Code: <Text style={{ fontWeight: "bold" }}>{inviteCode}</Text>
      </Text>
  
      <View style={{ marginBottom: 20, backgroundColor: "#fff", padding: 15, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>Roommates</Text>
        {roommates.map((email, i) => (
          <Text key={i} style={{ fontSize: 16, color: "#333", marginLeft: 8 }}>• {email}</Text>
        ))}
      </View>
  
      <View style={{ marginBottom: 20, backgroundColor: "#fff", padding: 15, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>Your Chores</Text>
        {myChores.length > 0 ? (
          myChores.map((chore, index) => (
            <Text key={index} style={{ fontSize: 16, marginLeft: 8, color: "#444" }}>
              • {chore.text} {chore.completed ? "✅" : ""}
            </Text>
          ))
        ) : (
          <Text style={{ fontSize: 16, marginLeft: 8, fontStyle: "italic", color: "gray" }}>
            You have no chores.
          </Text>
        )}
      </View>
  
      <View style={{ marginBottom: 20, backgroundColor: "#fff", padding: 15, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>Your Events</Text>
        {myEvents.length > 0 ? (
          myEvents.map((event, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: "500", color: "#333" }}>
                {event.title}
              </Text>
              <Text style={{ fontSize: 14, color: "#666" }}>
               📅 {event.displayDate}
              </Text>
            </View>

          ))
        ) : (
          <Text style={{ fontSize: 16, marginLeft: 8, fontStyle: "italic", color: "gray" }}>
            You have no events.
          </Text>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
  
}
