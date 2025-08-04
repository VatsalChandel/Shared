// app/group-setup.tsx


import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { db, auth } from "@/firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Timestamp, DocumentReference } from "firebase/firestore";
import * as Crypto from "expo-crypto";


async function wipeDatabase() {

  const collections = ["users", "roommateGroups"];

  for (const name of collections) {
    const colRef = collection(db, name);
    const snap = await getDocs(colRef);
    for (const document of snap.docs) {
      await deleteDoc(doc(db, name, document.id));

      console.log(`Deleted ${name}/${document.id}`);
    }
  }

  console.log("🔥 Database wiped.");
}



export default function GroupSetup() {
    const [groupName, setGroupName] = useState("");
    const [groupCode, setGroupCode] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const user = auth.currentUser;

    const [createdGroupId, setCreatedGroupId] = useState("");

    const [joining, setJoining] = useState(false);

    if (!user) {  
      router.replace("/login");
      return null;
    }
  
    const waitUntilUserIsInGroup = async (
      ref: DocumentReference,
      uid: string,
      attempt = 0
    ): Promise<void> => {
      const snap = await getDoc(ref);
      const members = snap.data()?.members || [];
    
      if (members.includes(uid)) return;
      if (attempt > 15) throw new Error("User was not added to group in time");
    
      await new Promise((res) => setTimeout(res, 300));
      return waitUntilUserIsInGroup(ref, uid, attempt + 1);
    };

    const handleCreateGroup = async () => {
      if (!groupName || !user) {
        console.log("Missing groupName or user");
        return;
      }
    
      console.log("Creating group with name:", groupName);
      const groupId = groupName.toLowerCase().replace(/\s+/g, "-") + "-" + Math.floor(Math.random() * 10000);
      const inviteCode =
        groupName.replace(/\s+/g, "-").toLowerCase() +
        "-" +
        Math.floor(1000 + Math.random() * 9000);

      console.log("Generated groupId:", groupId);
      console.log("Generated inviteCode:", inviteCode);
    
      console.log("Trying to write group to Firestore...");
      try {
        console.log("Writing group to Firestore...");
        await setDoc(doc(db, "roommateGroups", groupId), {
          name: groupName,
          inviteCode,
          createdAt: Timestamp.now(),
          members: [user.uid],
        });
        console.log("Group written!");
    
        console.log("Updating user doc...");
        await setDoc(
          doc(db, "users", user.uid),
          {
            email: user.email,
            groupId,
          },
          { merge: true }
        );
        console.log("User doc updated!");
    
        console.log("Navigating away...");
        router.replace("/");
        setCreatedGroupId(groupId);
      } catch (err: any) {
        console.log("🔥 Error creating group:", err);
        setError(err.message || "Unknown error");
      }
    };
    


    const handleJoinGroup = async () => {
      if (!groupCode || !user) return;
      setJoining(true);
      setError("");
    
      try {
        const q = query(
          collection(db, "roommateGroups"),
          where("inviteCode", "==", groupCode.trim().toLowerCase())
        );
    
        const snap = await getDocs(q);
    
        if (snap.empty) {
          setError("Group not found!");
          setJoining(false);
          return;
        }
    
        const groupDoc = snap.docs[0];
        const groupId = groupDoc.id;
    
        // Step 1: Add user to group
        await updateDoc(groupDoc.ref, {
          members: arrayUnion(user.uid),
        });
    
        // Step 2: Wait for permission to kick in
        await waitUntilUserIsInGroup(groupDoc.ref, user.uid);
    
        // Step 3: Set user document
        await setDoc(
          doc(db, "users", user.uid),
          {
            email: user.email,
            groupId,
          },
          { merge: true }
        );
    
        router.replace("/");
      } catch (err: any) {
        console.log("🔥 Error joining group:", err);
        setError(err.message || "An error occurred while joining the group.");
        setJoining(false);
      }
    };
    
    

  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 20 }}>
      <Text style={{ fontSize:40, fontWeight: "600", marginBottom: 10, color: "#000" }}>Join or Create Group</Text>
      </View>

    <View style={styles.container}>

      <Text style={styles.label}>Create Group</Text>
      <TextInput
        placeholder="Group name"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.input}
      />

      <Pressable  onPress={handleCreateGroup} style={{ marginBottom:80 }}>
        <View style={{ marginTop:10, backgroundColor: "#007bff", padding: 16, borderRadius: 8, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "500", fontSize:20 }}>Create Group</Text>
        </View>
      </Pressable>
      

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

      <Pressable  onPress={handleJoinGroup}>
        <View style={{ marginTop:10, backgroundColor: "#007bff", padding: 16, borderRadius: 8, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "500", fontSize:20 }}>Join Group</Text>
        </View>
      </Pressable>
      

      {joining && (
          <Text style={{ marginTop: 10, fontStyle: "italic", color: "gray" }}>
            Joining group...
          </Text>
        )}

        {error ? (
          <Text style={{ color: "red", marginTop: 10 }}>{error}</Text>
        ) : null}

      <View style={{ marginTop: 30 }}>
        <Button title="🔥 Wipe Database (DEV ONLY)" onPress={wipeDatabase} color="red" />
      </View>
    
    </View>
    </SafeAreaView>

    
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 100,
  },
  title: {
    fontSize: 40,
    fontWeight: "600",
    marginBottom: 30,
  },
  label: {
    marginTop: 20,
    fontWeight: "500",
    fontSize: 20
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