import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ScrollView,
} from "react-native";
import { auth, db } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

import { useContext } from "react";
import { ThemeContext } from "../ThemeContext";


export default function Chores() {
  const user = auth.currentUser;
  const [groupId, setGroupId] = useState<string | null>(null);
  const [chores, setChores] = useState<any[]>([]);
  const [newChore, setNewChore] = useState("");
  const [userName, setUserName] = useState("");
  const [roommates, setRoommates] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);

  useEffect(() => {
    let unsubscribe: () => void;

    const fetchRealtimeChores = async () => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const groupId = userSnap.data()?.groupId;
      setGroupId(groupId);
      const userEmail = userSnap.data()?.email;
      setUserName(userSnap.data()?.name);
      if (userEmail) setAssignedTo([userEmail]);

      if (!groupId) return;

      const choresRef = collection(db, `roommateGroups/${groupId}/chores`);
      unsubscribe = onSnapshot(choresRef, (snapshot) => {
        const updatedChores = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChores(updatedChores);
      });

      const groupRef = doc(db, "roommateGroups", groupId);
      const groupSnap = await getDoc(groupRef);
      const memberIds: string[] = groupSnap.data()?.members || [];

      const emailList: string[] = [];
      for (const uid of memberIds) {
        const memberSnap = await getDoc(doc(db, "users", uid));
        const email = memberSnap.data()?.email;
        if (email) emailList.push(email);
      }
      setRoommates(emailList);
    };

    fetchRealtimeChores();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleAddChore = async () => {
    if (!newChore.trim() || !groupId || !user || !userName) return;

    const choreRef = collection(db, `roommateGroups/${groupId}/chores`);
    const newDoc = await addDoc(choreRef, {
      text: newChore.trim(),
      completed: false,
      createdAt: new Date(),
      createdBy: {
        uid: user.uid,
        email: user.email,
        name: userName,
      },
      assignedTo: assignedTo,
    });

    setNewChore("");
    setAssignedTo([user.email!]);
  };

  const toggleChoreCompleted = async (choreId: string, current: boolean) => {
    if (!groupId) return;
    const choreDoc = doc(db, `roommateGroups/${groupId}/chores`, choreId);
    await updateDoc(choreDoc, { completed: !current });

    Toast.show({
      type: "success",
      text1: current ? "Chore marked as incomplete" : "Chore completed 🎉",
    });
  };

  const handleDeleteChore = async (choreId: string) => {
    if (!groupId) return;
    const choreRef = doc(db, `roommateGroups/${groupId}/chores`, choreId);
    await deleteDoc(choreRef);
    Toast.show({ type: "success", text1: "Chore deleted successfully" });
  };

const { theme } = useContext(ThemeContext);
const isDark = theme === "dark";
const themedBackground = isDark ? "#121212" : "#f9f9f9";
const themedText = isDark ? "#f1f1f1" : "#333";
const cardBackground = isDark ? "#1e1e1e" : "#fff";
const borderColor = isDark ? "#444" : "#ccc";


  return (
<SafeAreaView style={{ flex: 1, backgroundColor: themedBackground }}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={80}
  >
    <Text style={{ padding: 20, fontSize: 24, fontWeight: "bold", color: themedText }}>
      Group Chores
    </Text>

    <FlatList
      ListHeaderComponent={
        <View style={{ padding: 20 }}>
          {chores.length === 0 && (
            <Text style={{ fontSize: 16, fontStyle: "italic", color: isDark ? "#aaa" : "gray" }}>
              No chores yet!
            </Text>
          )}
        </View>
      }
      data={chores}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: cardBackground,
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
          }}
        >
          <Pressable onPress={() => toggleChoreCompleted(item.id, item.completed)}>
            <Text
              style={{
                fontSize: 18,
                color: item.completed ? "gray" : themedText,
                textDecorationLine: item.completed ? "line-through" : "none",
                marginBottom: 4,
              }}
            >
              {item.completed ? "✅" : "⬜️"} {item.text}
            </Text>
          </Pressable>
          <Text style={{ fontSize: 12, color: isDark ? "#ccc" : "#666", marginLeft: 4 }}>
            Added by: {item.createdBy?.name}
          </Text>
          <Text style={{ fontSize: 12, color: isDark ? "#ccc" : "#666", marginLeft: 4 }}>
            Assigned to: {Array.isArray(item.assignedTo) ? item.assignedTo.join(", ") : "N/A"}
          </Text>
          {item.completed && (
            <Pressable onPress={() => handleDeleteChore(item.id)}>
              <Text style={{ color: "red", fontSize: 14, marginTop: 6 }}>🗑 Delete chore</Text>
            </Pressable>
          )}
        </View>
      )}
      ListFooterComponent={
        <View
          style={{
            marginTop: 20,
            backgroundColor: cardBackground,
            borderRadius: 10,
            padding: 12,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "500", marginBottom: 6, color: themedText }}>Add a Chore</Text>
          <TextInput
            value={newChore}
            onChangeText={setNewChore}
            placeholder="Type chore here..."
            placeholderTextColor={isDark ? "#aaa" : "#666"}
            style={{
              borderWidth: 1,
              borderColor: borderColor,
              color: themedText,
              padding: 10,
              borderRadius: 6,
              marginBottom: 10,
            }}
          />
          <Text style={{ fontWeight: "600", marginBottom: 6, color: themedText }}>Assign To:</Text>
          {roommates.map((email, index) => (
            <Pressable
              key={index}
              onPress={() =>
                setAssignedTo((prev) =>
                  prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
                )
              }
            >
              <Text style={{ marginLeft: 10, fontSize: 14, color: themedText }}>
                {assignedTo.includes(email) ? "✅" : "⬜️"} {email}
              </Text>
            </Pressable>
          ))}
          <Button title="Add Chore" onPress={handleAddChore} />
        </View>
      }
    />
  </KeyboardAvoidingView>
</SafeAreaView>




  );
  
}
