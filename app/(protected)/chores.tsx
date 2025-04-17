import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, Pressable } from "react-native";
import { auth, db } from "@/firebase";
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, onSnapshot, deleteDoc} from "firebase/firestore";
import Toast from "react-native-toast-message";

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
        <View style={{ padding: 20, paddingTop: 60 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>Group Chores</Text>
    
          <FlatList
            data={chores}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
                <View style={{ marginBottom: 12 }}>
                  <Pressable onPress={() => toggleChoreCompleted(item.id, item.completed)}>
                    <Text
                      style={{
                        fontSize: 18,
                        textDecorationLine: item.completed ? "line-through" : "none",
                        color: item.completed ? "gray" : "black",
                      }}
                    >
                      • {item.text}
                    </Text>
                  </Pressable>
              
                  {item.createdBy?.email && (
                    <Text style={{ fontSize: 12, color: "gray", marginLeft: 10 }}>
                      Added by: {item.createdBy.email}
                    </Text>
                  )}
              
                  {/* ✅ Only show delete button if completed */}
                  {item.completed && (
                    <Pressable onPress={() => handleDeleteChore(item.id)}>
                      <Text style={{ color: "red", fontSize: 14, marginLeft: 10 }}>
                        🗑 Delete chore
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
              
            
          />
    
          <TextInput
            value={newChore}
            onChangeText={setNewChore}
            placeholder="Add new chore..."
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 6,
              marginTop: 20,
            }}
          />
          <Button title="Add Chore" onPress={handleAddChore} />
        </View>
      );
}