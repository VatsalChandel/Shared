// /app/(protected)/index.tsx


import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { auth, db } from "@/firebase";
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, onSnapshot, deleteDoc} from "firebase/firestore";


export default function Index() {
  const user = auth.currentUser;

  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [roommates, setRoommates] = useState<string[]>([]);

  const [chores, setChores] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);


  console.log(user);
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
    const fetchGroupName = async () => {
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

    fetchGroupName();
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

      
      // go through chores and match name with userName
      const choresWithNames = chores.map(chore => {
        const createdBy = chore.createdBy;
        const createdByName = createdBy.name;
        return {
          ...chore,
          createdByName: createdByName,
        };
      });
      const myChores = choresWithNames.filter(chore => chore.createdByName === userName);

      console.log("choresWithNames:", choresWithNames);
      //console.log("chores:", chores);


  
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome to your group, {userName}</Text>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Welcome to your Pod: {groupName}</Text>
      <Text style={{ fontSize: 20 }}>Share ID with roommates: {inviteCode}</Text>
      <Text style={{ marginTop: 20, fontSize: 18 }}>Roommates:</Text>
        {roommates.map((email, i) => (
          <Text key={i}>• {email}</Text>
        ))}
      
        {myChores.length > 0 && (
          <>
            <Text style={{ marginTop: 30, fontSize: 18 }}>Your Chores:</Text>
            {myChores.map((chore, index) => (
              <Text key={index} style={{ fontSize: 16, marginLeft: 10 }}>
                • {chore.text} {chore.completed ? "✅" : ""}
              </Text>
            ))}
          </>
        )}
    </View>
  );
}
