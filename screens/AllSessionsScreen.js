import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";

export default function AllSessionsScreen() {
  const [sessions, setSessions] = useState([]);
  const isFocused = useIsFocused();

  const load = async () => {
    const data = await AsyncStorage.getItem("sessions");
    if (data) setSessions(JSON.parse(data));
  };

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused]);

  // -------- DELETE ONE --------
const deleteSession = async (date) => {
  const newArr = sessions.filter((s) => s.date !== date);
  setSessions(newArr);
  await AsyncStorage.setItem("sessions", JSON.stringify(newArr));
};


  // -------- CLEAR ALL --------
  const clearAll = () => {
    Alert.alert(
      "Clear All?",
      "Are you sure you want to delete ALL sessions?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("sessions");
            setSessions([]);
          },
        },
      ]
    );
  };

 const renderRightActions = (date) => (
  <Pressable onPress={() => deleteSession(date)} style={styles.deleteBox}>
    <Text style={styles.deleteText}>Delete</Text>
  </Pressable>
);


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
    >
      <Text style={styles.title}>All Sessions</Text>

      {/* CLEAR ALL BUTTON */}
      {sessions.length > 0 && (
        <Pressable style={styles.clearBtn} onPress={clearAll}>
          <Text style={styles.clearBtnText}>Clear All</Text>
        </Pressable>
      )}

      {sessions.length === 0 && (
        <Text style={styles.noData}>No session data found.</Text>
      )}

   {sessions
  .slice()
  .reverse()
  .map((s) => (
    <Swipeable
      key={s.date}
      renderRightActions={() => renderRightActions(s.date)}
    >
      <View style={styles.card}>
        <Text style={styles.item}>
          <Text style={styles.bold}>Category:</Text> {s.category}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.bold}>Worked:</Text>{" "}
          {Math.floor(s.duration / 60)}m {s.duration % 60}s
        </Text>

        <Text style={styles.item}>
          <Text style={styles.bold}>Distractions:</Text>{" "}
          {s.distractions}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.bold}>Date:</Text>{" "}
          {new Date(s.date).toLocaleString()}
        </Text>
      </View>
    </Swipeable>
  ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },

  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 10,
    color: "#d6336c",
  },

  clearBtn: {
    backgroundColor: "#d6336c",
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    alignSelf: "center",
    width: "30%",
  },

  clearBtnText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  noData: {
    textAlign: "center",
    opacity: 0.5,
    fontSize: 16,
    marginTop: 20,
  },

  card: {
    backgroundColor: "#ffe4e9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  item: { fontSize: 16, color: "#8d4f63", marginVertical: 3 },

  bold: { fontWeight: "700", color: "#c2557c" },

  deleteBox: {
    backgroundColor: "#d6336c",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    height: "90%",
    borderRadius: 10,
    marginVertical: 5,
  },

  deleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
