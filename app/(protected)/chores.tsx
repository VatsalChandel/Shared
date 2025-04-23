// /app/(protected)/chores.tsx


import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { auth, db } from "@/firebase";
import { doc, getDoc, collection, addDoc, updateDoc, onSnapshot, deleteDoc} from "firebase/firestore";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Chores() {

    const user = auth.currentUser;
    const [groupId, setGroupId] = useState<string | null>(null);
    const [chores, setChores] = useState<any[]>([]);
    const [newChore, setNewChore] = useState("");
    const [userName, setUserName] = useState("");

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


      const handleAddChore = async () => {
        if (!newChore.trim() || !groupId) return;
    
        const choreRef = collection(db, `roommateGroups/${groupId}/chores`);
        const newDoc = await addDoc(choreRef, {
          text: newChore.trim(),
          completed: false,
          createdAt: new Date(),
          createdBy: {
            uid: user?.uid,
            email: user?.email,
            name: userName
          }
        });
    
        setChores([...chores, { id: newDoc.id, text: newChore.trim(), completed: false }]);
        setNewChore("");

        
      };

      
      const toggleChoreCompleted = async (choreId: string, current: boolean) => {
        if (!groupId) return;
      
        const choreDoc = doc(db, `roommateGroups/${groupId}/chores`, choreId);
        await updateDoc(choreDoc, { completed: !current });

        Toast.show({
            type: "success",
            text1: current ? "Chore marked as incomplete" : "Chore completed 🎉",
        })
      };
      

      const handleDeleteChore = async (choreId: string) => {
        if (!groupId) return;
      
        const choreRef = doc(db, `roommateGroups/${groupId}/chores`, choreId);
        await deleteDoc(choreRef);

        Toast.show({
            type: "success",
            text1: "Chore deleted successfully",
        })
      };

      
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={80} // adjust if needed based on tab bar height
        >
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              paddingTop: 60,
              backgroundColor: "#f9f9f9",
              paddingBottom: 100, // ensures Add Chore section isn't hidden
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Group Chores</Text>
      
            {chores.length === 0 ? (
              <Text style={{ fontSize: 16, fontStyle: "italic", color: "gray" }}>
                No chores yet!
              </Text>
            ) : (
              <FlatList
                data={chores}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View
                    style={{
                      backgroundColor: "#fff",
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
                          color: item.completed ? "gray" : "#333",
                          textDecorationLine: item.completed ? "line-through" : "none",
                          marginBottom: 4,
                        }}
                      >
                        {item.completed ? "✅" : "⬜️"} {item.text}
                      </Text>
                    </Pressable>
      
                    <Text style={{ fontSize: 12, color: "#666", marginLeft: 4 }}>
                      Added by: {item.createdBy?.name}
                    </Text>
      
                    {item.completed && (
                      <Pressable onPress={() => handleDeleteChore(item.id)}>
                        <Text style={{ color: "red", fontSize: 14, marginTop: 6 }}>
                          🗑 Delete chore
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              />
            )}
      
            <View
              style={{
                marginTop: 20,
                backgroundColor: "#fff",
                borderRadius: 10,
                padding: 12,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "500", marginBottom: 6 }}>Add a Chore</Text>
              <TextInput
                value={newChore}
                onChangeText={setNewChore}
                placeholder="Type chore here..."
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  padding: 10,
                  borderRadius: 6,
                  marginBottom: 10,
                }}
              />
              <Button title="Add Chore" onPress={handleAddChore} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
      );
      
      
}