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


LocaleConfig.locales["en"] = LocaleConfig.locales[""];
LocaleConfig.defaultLocale = "en";

export default function Calendar() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={80}>
      <Text style={{ padding:20, fontSize: 24, fontWeight: "bold" }}>Group Calendar</Text>

      <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: "#f9f9f9", paddingBottom: 120 }}>

        <RNCalendar
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
        />

        <View style={{ backgroundColor: "#fff", borderRadius: 10, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, marginBottom: 30 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Add New Event</Text>
          <TextInput
            placeholder="Event title"
            value={newEventTitle}
            onChangeText={setNewEventTitle}
            style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 6, marginBottom: 10 }}
          />
          <Pressable onPress={() => setShowDatePicker(true)}>
            <Text style={{ fontSize: 16, color: "blue", marginBottom: 10 }}>
              📅 {selectedDate.toLocaleString()} (Tap to change)
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
            />
          )}
          <Text style={{ fontWeight: "500", marginBottom: 6 }}>Select Attendees:</Text>
          {roommates.map((email, i) => (
            <Pressable key={i} onPress={() =>
              setSelectedAttendees((prev) =>
                prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
              )
            }>
              <Text style={{ fontSize: 14, paddingLeft: 4 }}>
                {selectedAttendees.includes(email) ? "✅" : "⬜️"} {email}
              </Text>
            </Pressable>
          ))}
          <Button title="Add Event" onPress={handleAddEvent} />
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
        <View
            style={{
              backgroundColor: "white",
              borderRadius: 10,
              width: "90%",
              maxHeight: "80%",
              paddingVertical: 10,
            }}
          >
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 20,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
                Events
              </Text>

            {modalEvents.map((event) => {
              const local = localState[event.id];
              if (!local) return null;

              const isEditing = editingEvent === event.id;

              return (
                <View key={event.id} style={{ marginBottom: 16, paddingBottom: 10, borderBottomWidth: 1, borderColor: "#eee" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600" }}>{event.title}</Text>
                  <Text style={{ fontSize: 14, color: "#555" }}>{event.displayDate}</Text>
                  <Text style={{ fontSize: 13, color: "#888" }}>Created by: {event.createdBy?.email}</Text>

                  {isEditing ? (
                    <>
                      <TextInput
                        value={local.title}
                        onChangeText={(text) => setLocalState((prev) => ({
                          ...prev,
                          [event.id]: { ...prev[event.id], title: text }
                        }))}
                        style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6, marginTop: 10 }}
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
                      <Text style={{ fontWeight: "600", marginTop: 10 }}>Edit Attendees:</Text>
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
                          <Text style={{ paddingLeft: 10 }}>
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
