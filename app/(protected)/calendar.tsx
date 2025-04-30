// calendar.tsx

import { useEffect, useState } from "react";
import {
  Text, View, Button, TextInput, Pressable, Platform,
  Modal, ScrollView, Alert, KeyboardAvoidingView
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auth, db } from "@/firebase";
import {
  collection, doc, getDoc, onSnapshot, addDoc, deleteDoc, updateDoc
} from "firebase/firestore";
import { Calendar as RNCalendar, LocaleConfig } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

import { useContext } from "react";
import { ThemeContext } from '.././ThemeContext';



LocaleConfig.locales["en"] = LocaleConfig.locales[""];
LocaleConfig.defaultLocale = "en";

export default function Calendar() {
  const headingText = 40; 
  const normalText = 20; 
  const text = 18; 


  const { theme } = useContext(ThemeContext); // 👈 gets the current theme

  const user = auth.currentUser;
  const [groupId, setGroupId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [roommates, setRoommates] = useState<string[]>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEvents, setModalEvents] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [localState, setLocalState] = useState<Record<string, any>>({});

  useEffect(() => {
    let unsubscribe: () => void;
    const fetchData = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const groupId = userSnap.data()?.groupId;
      setGroupId(groupId);
      if (!groupId) return;

      const calendarRef = collection(db, `roommateGroups/${groupId}/calendar`);
      unsubscribe = onSnapshot(calendarRef, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEvents(data);
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
      if (user?.email && !selectedAttendees.includes(user.email)) {
        setSelectedAttendees((prev) => [...prev, user.email]);
      }
    };
    fetchData();
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !selectedDate || !groupId || !user) return;
    if (selectedDate < new Date()) {
      Alert.alert("Invalid Date", "You can't create events in the past.");
      return;
    }

    const attending = [...selectedAttendees];
    const eventRef = collection(db, `roommateGroups/${groupId}/calendar`);
    await addDoc(eventRef, {
      title: newEventTitle,
      date: selectedDate,
      displayDate: selectedDate.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdBy: {
        uid: user.uid,
        email: user.email,
      },
      attending,
    });

    setNewEventTitle("");
    setSelectedAttendees([user.email]);
    setSelectedDate(new Date());
  };

  const handleUpdateEvent = async (eventId: string) => {
    const event = localState[eventId];
    if (!groupId || !event) return;
    await updateDoc(doc(db, `roommateGroups/${groupId}/calendar`, eventId), {
      title: event.title || "",
      date: event.date,
      displayDate: event.date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      attending: event.attendees || [],
    });

    setEditingEvent(null);
    setModalVisible(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!groupId) return;
    await deleteDoc(doc(db, `roommateGroups/${groupId}/calendar`, eventId));
    setModalVisible(false);
  };

  const markedDates = events.reduce((acc, event) => {
    try {
      const dateKey = new Date(
        typeof event.date === "string" ? event.date : event.date?.seconds * 1000
      ).toISOString().split("T")[0];
      acc[dateKey] = { marked: true, dotColor: "#00adf5" };
    } catch {}
    return acc;
  }, {} as Record<string, any>);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme === "dark" ? "#000" : "#f9f9f9" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <Text style={{
          padding: 20,
          fontSize: headingText,
          fontWeight: "bold",
          color: theme === "dark" ? "#fff" : "#000"
        }}>
          Group Calendar
        </Text>
  
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            backgroundColor: theme === "dark" ? "#000" : "#f9f9f9",
            paddingBottom: 120,
          }}
        >
          <RNCalendar
          key={theme}
            markedDates={markedDates}
            onDayPress={(day) => {
              const eventsForDay = events.filter((event) => {
                try {
                  const date = typeof event.date === "string" ? new Date(event.date) : new Date(event.date?.seconds * 1000);
                  return date.toISOString().startsWith(day.dateString);
                } catch {
                  return false;
                }
              });
  
              const state: Record<string, any> = {};
              eventsForDay.forEach((e) => {
                state[e.id] = {
                  title: e.title,
                  date: typeof e.date === "string" ? new Date(e.date) : new Date(e.date?.seconds * 1000),
                  attendees: e.attending || [],
                };
              });
  
              setLocalState(state);
              setModalEvents(eventsForDay);
              setModalVisible(true);
            }}
                style={{ marginBottom: 20 }}
            theme={{
              calendarBackground: theme === "dark" ? "#000" : "#fff",
              dayTextColor: theme === "dark" ? "#fff" : "#000",
              monthTextColor: theme === "dark" ? "#fff" : "#000",
              arrowColor: theme === "dark" ? "#fff" : "#000",
              todayTextColor: theme === "dark" ? "#4da6ff" : "#00adf5",
              selectedDayBackgroundColor: theme === "dark" ? "#444" : "#cce5ff",
              selectedDayTextColor: theme === "dark" ? "#fff" : "#000",
            }}
          />
  
          <View style={{
            backgroundColor: theme === "dark" ? "#1a1a1a" : "#fff",
            borderRadius: 10,
            padding: 16,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
            marginBottom: 30
          }}>
            <Text style={{ fontSize:normalText, fontWeight: "600", marginBottom: 10, color: theme === "dark" ? "#fff" : "#000" }}>
              Add New Event
            </Text>
            <TextInput
              placeholder="Event title"
              placeholderTextColor={theme === "dark" ? "#aaa" : "#666"}
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                borderRadius: 6,
                marginBottom: 10,
                color: theme === "dark" ? "#fff" : "#000"
              }}
            />
            <Pressable onPress={() => setShowDatePicker(true)}>
              <Text style={{ fontSize: normalText, color: theme === "dark" ? "#4da6ff" : "blue", marginBottom: 10 }}>
              📅 {selectedDate.toLocaleString([], {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })} (Tap to change)
              </Text>

            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="datetime"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDate(date);
                }}
                themeVariant={theme === "dark" ? "dark" : "light"} // 👈 add this

              />
            )}
            <Text style={{ paddingTop:25, fontSize:normalText, fontWeight: "500", marginBottom: 6, color: theme === "dark" ? "#fff" : "#000" }}>
              Select Attendees:
            </Text>
            {roommates.map((email, i) => (
              <Pressable
                key={i}
                onPress={() =>
                  setSelectedAttendees((prev) =>
                    prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
                  )
                }
              >
                <Text style={{ fontSize: normalText, paddingLeft: 4, marginBottom:6, color: theme === "dark" ? "#fff" : "#000" }}>
                  {selectedAttendees.includes(email) ? "✅" : "⬜️"} {email}
                </Text>
              </Pressable>
            ))}


          <Pressable  onPress={handleAddEvent}>
            <View style={{ marginTop:20, backgroundColor: "#007bff", padding: 16, borderRadius: 8, alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "500", fontSize:normalText }}>Add Event</Text>
            </View>
          </Pressable>


          </View>
        </ScrollView>
  
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <View style={{
              backgroundColor: theme === "dark" ? "#1a1a1a" : "#fff",
              borderRadius: 10,
              width: "90%",
              maxHeight: "80%",
              paddingVertical: 10
            }}>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                <Text style={{ fontSize: normalText, fontWeight: "bold", marginBottom: 10, color: theme === "dark" ? "#fff" : "#000" }}>
                  Events
                </Text>
  
                {modalEvents.map((event) => {
                  const local = localState[event.id];
                  if (!local) return null;
                  const isEditing = editingEvent === event.id;
  
                  return (
                    <View key={event.id} style={{ marginBottom: 16, paddingBottom: 10, borderBottomWidth: 1, borderColor: "#eee" }}>
                      <Text style={{ fontSize: normalText, fontWeight: "600", color: theme === "dark" ? "#fff" : "#000" }}>
                        {event.title}
                      </Text>
                      <Text style={{ fontSize: text, color: theme === "dark" ? "#bbb" : "#555" }}>
                        {event.displayDate}
                      </Text>
                      <Text style={{ fontSize: text, color: "#888" }}>
                        Created by: {event.createdBy?.email}
                      </Text>
  
                      {isEditing ? (
                        <>
                          <TextInput
                            value={local.title}
                            onChangeText={(text) => setLocalState((prev) => ({
                              ...prev,
                              [event.id]: { ...prev[event.id], title: text }
                            }))}
                            style={{
                              borderWidth: 1,
                              borderColor: "#ccc",
                              padding: 8,
                              borderRadius: 6,
                              marginTop: 10,
                              color: theme === "dark" ? "#fff" : "#000"
                            }}
                            placeholder="Edit title"
                            placeholderTextColor={theme === "dark" ? "#999" : "#ccc"}
                          />
                          <DateTimePicker
                            value={local.date}
                            mode="datetime"
                            display={Platform.OS === "ios" ? "inline" : "default"}
                            onChange={(e, date) => {
                              if (date) {
                                setLocalState((prev) => ({
                                  ...prev,
                                  [event.id]: { ...prev[event.id], date }
                                }));
                              }
                            }}
                          />
                          <Text style={{ fontSize:text, fontWeight: "600", marginTop: 10, color: theme === "dark" ? "#fff" : "#000" }}>
                            Edit Attendees:
                          </Text>
                          {roommates.map((email) => (
                            <Pressable key={email} onPress={() => {
                              const current = local.attendees || [];
                              const updated = current.includes(email)
                                ? current.filter((e) => e !== email)
                                : [...current, email];
                              setLocalState((prev) => ({
                                ...prev,
                                [event.id]: { ...prev[event.id], attendees: updated }
                              }));
                            }}>
                              <Text style={{ marginBottom:6, fontSize:text, paddingLeft: 10, color: theme === "dark" ? "#fff" : "#000" }}>
                                {local.attendees?.includes(email) ? "✅" : "⬜️"} {email}
                              </Text>
                            </Pressable>
                          ))}
                          <Button title="✅ Confirm Edit" onPress={() => handleUpdateEvent(event.id)} />
                        </>
                      ) : (
                        <Button title="✏️ Edit" onPress={() => setEditingEvent(event.id)} />
                      )}
  
                      <Button title="🗑️ Delete" color="red" onPress={() => handleDeleteEvent(event.id)} />
                    </View>
                  );
                })}
  
                <Button title="Close" onPress={() => setModalVisible(false)} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );


}
