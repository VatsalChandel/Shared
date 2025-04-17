// /app/(protected)/index.tsx


import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Index() {
  const user = auth.currentUser;
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [roommates, setRoommates] = useState<string[]>([]);

  console.log(user);
  useEffect(() => {
    const fetchRoommates = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const groupId = userSnap.data()?.groupId;
  
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
    const fetchGroupName = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const groupId = userSnap.data()?.groupId;

      if (groupId) {
        const groupRef = doc(db, "roommateGroups", groupId);
        const groupSnap = await getDoc(groupRef);
        setGroupName(groupSnap.data()?.name || "Unnamed group");
        setInviteCode(groupSnap.data()?.inviteCode || "No invite code");
      }
    };

    fetchGroupName();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome to your Pod: {groupName}</Text>
      <Text style={{ fontSize: 20 }}>Share ID with roommates: {inviteCode}</Text>
      <Text style={{ marginTop: 20, fontSize: 18 }}>Roommates:</Text>
        {roommates.map((email, i) => (
          <Text key={i}>• {email}</Text>
        ))}
    </View>
  );
}
