// Calendar with per-event state isolation for editing
import { useEffect, useState } from "react";
import {
  Text, View, Button, TextInput, Pressable, Platform,
  Modal, ScrollView, Alert
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auth, db } from "@/firebase";
import {
  collection, doc, getDoc, onSnapshot, addDoc, deleteDoc, updateDoc
} from "firebase/firestore";
import { Calendar as RNCalendar, LocaleConfig } from "react-native-calendars";

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
  const [externalEmail, setExternalEmail] = useState("");
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
    if (externalEmail.trim()) attending.push(externalEmail.trim());

    const eventRef = collection(db, `roommateGroups/${groupId}/calendar`);
    await addDoc(eventRef, {
      title: newEventTitle,
      date: selectedDate.toISOString(),
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
    setExternalEmail("");
    setSelectedAttendees([user.email]);
    setSelectedDate(new Date());
  };

  const handleUpdateEvent = async (eventId: string) => {
    const event = localState[eventId];
    if (!groupId || !event) return;

    await updateDoc(doc(db, `roommateGroups/${groupId}/calendar`, eventId), {
      title: event.title,
      date: event.date.toISOString(),
      displayDate: event.date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      attending: event.attendees,
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
      const dateKey = new Date(event.date).toISOString().split("T")[0];
      acc[dateKey] = { marked: true, dotColor: "#00adf5" };
    } catch (err) {
      console.warn("Invalid event date:", event);
    }
    return acc;
  }, {} as Record<string, any>);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50 }}>
      <Text style={{ fontSize: 24, marginBottom: 10 }}>Group Calendar</Text>

      <RNCalendar
        markedDates={markedDates}
        onDayPress={(day) => {
          const eventsForDay = events.filter((event) => {
            const dateStr = new Date(event.date).toISOString().split("T")[0];
            return dateStr === day.dateString;
          });

          const state: Record<string, any> = {};
          eventsForDay.forEach((e) => {
            state[e.id] = {
              title: e.title,
              date: new Date(e.date),
              attendees: e.attending || [],
              showPicker: false,
            };
          });

          setLocalState(state);
          setModalEvents(eventsForDay);
          setModalVisible(true);
        }}
        style={{ marginBottom: 20 }}
      />

      {/* Modal for editing events */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10, width: "90%" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Events</Text>
            {modalEvents.map((event, index) => {
              const local = localState[event.id];
              return (
                <View key={event.id} style={{ marginBottom: 20, borderBottomWidth: 1, borderColor: "#ddd", paddingBottom: 10 }}>
                  <Text style={{ fontWeight: "bold" }}>Title:</Text>
                  <TextInput
                    value={local?.title}
                    onChangeText={(text) =>
                      setLocalState((prev) => ({
                        ...prev,
                        [event.id]: { ...prev[event.id], title: text },
                      }))
                    }
                    style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 4, marginBottom: 4 }}
                  />
                  <Text style={{ fontWeight: "500", marginBottom: 2 }}>
                    {local?.date?.toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <Text>Created By: {event.createdBy?.email || "Unknown"}</Text>
                  <Text>Attending:</Text>
                  {roommates.map((email) => (
                    <Pressable
                      key={email}
                      onPress={() => {
                        const attendees = local?.attendees || [];
                        const updated = attendees.includes(email)
                          ? attendees.filter((e) => e !== email)
                          : [...attendees, email];
                        setLocalState((prev) => ({
                          ...prev,
                          [event.id]: { ...prev[event.id], attendees: updated },
                        }));
                      }}
                    >
                      <Text style={{ paddingLeft: 10 }}>
                        {local?.attendees?.includes(email) ? "✅" : "⬜️"} {email}
                      </Text>
                    </Pressable>
                  ))}
                  <Button
                    title="Edit Date"
                    onPress={() =>
                      setLocalState((prev) => ({
                        ...prev,
                        [event.id]: { ...prev[event.id], showPicker: true },
                      }))
                    }
                  />
                  {local?.showPicker && (
                    <DateTimePicker
                      value={local.date}
                      mode="datetime"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      onChange={(eventChange, date) => {
                        if (date) {
                          setLocalState((prev) => ({
                            ...prev,
                            [event.id]: {
                              ...prev[event.id],
                              date,
                              showPicker: false,
                            },
                          }));
                        } else {
                          setLocalState((prev) => ({
                            ...prev,
                            [event.id]: { ...prev[event.id], showPicker: false },
                          }));
                        }
                      }}
                    />
                  )}
                  <Button title="Confirm Edit" onPress={() => handleUpdateEvent(event.id)} />
                  <Button title="Delete Event" color="red" onPress={() => handleDeleteEvent(event.id)} />
                </View>
              );
            })}
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Create New Event Section */}
      <Text style={{ fontSize: 18, marginTop: 30 }}>Add New Event</Text>
      <TextInput
        placeholder="Event title"
        value={newEventTitle}
        onChangeText={setNewEventTitle}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6, marginTop: 10, marginBottom: 10 }}
      />
      <Pressable onPress={() => setShowDatePicker(true)}>
        <Text style={{ fontSize: 16, color: "blue" }}>
          {selectedDate.toLocaleString([], {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
          })} (Tap to change)
        </Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="datetime"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}
      <Text style={{ marginTop: 15, fontSize: 16 }}>Select Attendees:</Text>
      {roommates.map((email, index) => (
        <Pressable
          key={index}
          onPress={() =>
            setSelectedAttendees((prev) =>
              prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
            )
          }
        >
          <Text style={{ marginLeft: 10, fontSize: 14 }}>
            {selectedAttendees.includes(email) ? "✅" : "⬜️"} {email}
          </Text>
        </Pressable>
      ))}
      <TextInput
        placeholder="Invite someone via email"
        value={externalEmail}
        onChangeText={setExternalEmail}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6, marginVertical: 10 }}
      />
      <Button title="Add Event" onPress={handleAddEvent} />
    </ScrollView>
  );
}
