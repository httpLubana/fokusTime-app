import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AllSessionsScreen() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await AsyncStorage.getItem("sessions");
    if (data) setSessions(JSON.parse(data));
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}  // ➕ tab bar çakışmasın
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
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    color: "#d6336c",
    textAlign: "center",
  },
  noData: { textAlign: "center", opacity: 0.5 },
  card: {
    backgroundColor: "#ffe4e9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  item: { fontSize: 16, color: "#8d4f63", marginVertical: 3 },
  bold: { fontWeight: "700", color: "#c2557c" },
});
