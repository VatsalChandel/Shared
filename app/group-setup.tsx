// app/group-setup.tsx


import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { db, auth } from "@/firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function GroupSetup() {
    const [groupName, setGroupName] = useState("");
    const [groupCode, setGroupCode] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const user = auth.currentUser;

    const [createdGroupId, setCreatedGroupId] = useState("");

const handleCreateGroup = async () => {
    if (!groupName || !user) return;

    const groupId = crypto.randomUUID();
    const inviteCode = groupName.replace(/\s+/g, "-").toLowerCase() + "-" + Math.floor(1000 + Math.random() * 9000);
  

    try {
        await setDoc(doc(db, "roommateGroups", groupId), {
        name: groupName,
        inviteCode,
        createdAt: new Date(),
        members: [user.uid],
        });

    await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        groupId,
        }, { merge: true });
    router.replace("/")

    setCreatedGroupId(groupId); // show this after creation

    // Optionally: router.replace("/");
    } catch (err: any) {
        setError(err.message);
    }
    };


    const handleJoinGroup = async () => {
        if (!groupCode || !user) return;
    
        const q = query(
        collection(db, "roommateGroups"),
        where("inviteCode", "==", groupCode.trim().toLowerCase())
        );
    
        const snap = await getDocs(q);
    
        if (snap.empty) {
        setError("Group not found!");
        return;
        }
    
        const groupDoc = snap.docs[0];
        const groupId = groupDoc.id;
    
        await updateDoc(groupDoc.ref, {
        members: arrayUnion(user.uid),
        });
    
        await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        groupId,
        }, { merge: true });
    
        router.replace("/");
    };
  

  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join or Create a Roommate Group</Text>

      <Text style={styles.label}>Create Group</Text>
      <TextInput
        placeholder="Group name"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.input}
      />
        <Button title="Create Group" onPress={handleCreateGroup} />

        {createdGroupId ? (
        <Text style={{ marginTop: 20 }}>
             Share this group code:{" "}
            <Text style={{ fontWeight: "bold" }}>{createdGroupId.toLowerCase()}</Text>
        </Text>
     
        ) : null}

      <Text style={styles.label}>OR Join with Code</Text>
      <TextInput
        placeholder="Group code"
        value={groupCode}
        onChangeText={setGroupCode}
        style={styles.input}
        autoCapitalize="none"
      />
      <Button title="Join Group" onPress={handleJoinGroup} />

      {error ? <Text style={{ color: "red", marginTop: 10 }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 30,
  },
  label: {
    marginTop: 20,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 6,
  },
});
