// /app/(protected)/explore.tsx

import { Text, View, FlatList } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase";


export default function Calendar() {
    const [calendar, setCalendar] = useState<any[]>([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const snapshot = await getDocs(collection(db, "roommateGroups/1505M/calendar"));
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCalendar(data);
            } catch (error) {
                console.error("Error fetching events:", error);
            }
        };

        fetchEvents();
    }, []);


    return (
        <View style={{ flex: 1, paddingTop: 50, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 24, marginBottom: 10 }}>Event List</Text>
          <FlatList
            data={calendar}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ marginBottom: 10 }}>
                <Text>What is it {item.title}</Text>
                <Text>Who is going: {item.attending}</Text>
                <Text>Date: {item.date}</Text>
              </View>
            )}
          />
        </View>
      );
}
