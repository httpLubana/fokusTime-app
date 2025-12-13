import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";

export default function AllSessionsScreen() {
  const [sessions, setSessions] = useState([]);
  const isFocused = useIsFocused();

  const load = async () => {
    const data = await AsyncStorage.getItem("sessions");
    if (data) setSessions(JSON.parse(data));
  };

  // Ekran her açıldığında reload
  useEffect(() => {
    if (isFocused) {
      load();
    }
  }, [isFocused]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
    >
      <Text style={styles.title}>All Sessions</Text>

      {sessions.length === 0 && (
        <Text style={styles.noData}>No session data found.</Text>
      )}

      {sessions.map((s, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.item}>
            <Text style={styles.bold}>Category:</Text> {s.category}
          </Text>

          <Text style={styles.item}>
            <Text style={styles.bold}>Worked:</Text>{" "}
            {Math.floor(s.duration / 60)}m {s.duration % 60}s
          </Text>

          <Text style={styles.item}>
            <Text style={styles.bold}>Distractions:</Text> {s.distractions}
          </Text>

          <Text style={styles.item}>
            <Text style={styles.bold}>Date:</Text>{" "}
            {new Date(s.date).toLocaleString()}
          </Text>
        </View>
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
    marginBottom: 25,
    color: "#d6336c",
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
});
