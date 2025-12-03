import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, PieChart } from "react-native-chart-kit";

export default function ReportScreen() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await AsyncStorage.getItem("sessions");
      if (data) setSessions(JSON.parse(data));
    } catch (err) {
      console.log("Load error:", err);
    }
  };

  const clearAll = () => {
    Alert.alert(
      "Delete All Sessions",
      "Are you sure you want to delete all stored sessions?",
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

  // ----------- STATISTICS -----------
  const today = new Date().toLocaleDateString("tr-TR");

  const todaySessions = sessions.filter(
    (s) => new Date(s.date).toLocaleDateString("tr-TR") === today
  );

  const totalToday = todaySessions.reduce((a, b) => a + b.duration, 0);
  const totalAll = sessions.reduce((a, b) => a + b.duration, 0);
  const totalDistractions = sessions.reduce((a, b) => a + b.distractions, 0);

  const last7 = sessions.slice(-7);
  const categories = ["Ders", "Kodlama", "Proje", "Kitap"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={styles.container}>

        {/* TITLE */}
        <Text style={styles.title}>Focus Report</Text>

        {/* CLEAR BUTTON */}
        <View style={styles.clearBtn}>
          <Button title="Clear All Sessions" color="#d6336c" onPress={clearAll} />
        </View>

        {/* WHEN EMPTY */}
        {sessions.length === 0 && (
          <Text style={styles.noData}>No saved sessions yet.</Text>
        )}

        {/* STATS */}
        {sessions.length > 0 && (
          <>
            <View style={styles.statsBox}>
              <Text style={styles.statsTitle}>Statistics</Text>

              <Text style={styles.statsText}>
                <Text style={styles.bold}>Today Total Focus:</Text>{" "}
                {Math.floor(totalToday / 60)} min
              </Text>

              <Text style={styles.statsText}>
                <Text style={styles.bold}>All Time Focus:</Text>{" "}
                {Math.floor(totalAll / 60)} min
              </Text>

              <Text style={styles.statsText}>
                <Text style={styles.bold}>Total Distractions:</Text>{" "}
                {totalDistractions}
              </Text>
            </View>

            {/* LAST 7 DAYS */}
            <Text style={styles.subtitle}>Last 7 Days</Text>

            <BarChart
              data={{
                labels: last7.map((s) =>
                  new Date(s.date).toLocaleDateString("tr-TR", { day: "2-digit" })
                ),
                datasets: [
                  {
                    data: last7.map((s) =>
                      Number((s.duration / 60).toFixed(1))
                    ),
                  },
                ],
              }}
              width={340}
              height={220}
              chartConfig={{
                backgroundColor: "#ffe4e9",
                backgroundGradientFrom: "#ffe4e9",
                backgroundGradientTo: "#ffe4e9",
                color: () => "#d6336c",
                labelColor: () => "#d6336c",
                decimalPlaces: 1,
              }}
              style={styles.chart}
            />

            {/* PIE CHART */}
            <Text style={styles.subtitle}>Category Distribution</Text>

          <PieChart
  data={[
    {
      name: "Ders",
      population: sessions.filter((s) => s.category === "Ders").length,
      color: "#d22b4fff",
    },
    {
      name: "Kodlama",
      population: sessions.filter((s) => s.category === "Kodlama").length,
      color: "#ff718bff",
    },
    {
      name: "Proje",
      population: sessions.filter((s) => s.category === "Proje").length,
      color: "#ffbbc6ff",
    },
    {
      name: "Kitap",
      population: sessions.filter((s) => s.category === "Kitap").length,
      color: "#fce1e8ff",
    },
  ]}
  width={340}
  height={220}
  accessor="population"
  backgroundColor="transparent"
  paddingLeft="20"
  chartConfig={{ color: () => "#d6336c" }}
/>

          </>
        )}

        {/* ALL SESSIONS */}
        <Text style={styles.subtitle}>All Sessions</Text>

        {sessions.map((s, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.bold}>Category:</Text> {s.category}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.bold}>Worked:</Text>{" "}
              {Math.floor(s.duration / 60)} min {s.duration % 60} sec
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.bold}>Distractions:</Text> {s.distractions}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.bold}>Date:</Text>{" "}
              {new Date(s.date).toLocaleString()}
            </Text>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
    color: "#d6336c",
  },
  clearBtn: {
    marginBottom: 25,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    color: "#c2557c",
  },
  noData: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 20,
    textAlign: "center",
    color: "#d6336c",
  },
  chart: {
    borderRadius: 12,
    marginVertical: 10,
  },
  statsBox: {
    backgroundColor: "#ffe4e9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ffb6c1",
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#c2557c",
    marginBottom: 10,
  },
  statsText: {
    fontSize: 16,
    marginVertical: 4,
    color: "#8d4f63",
  },
  card: {
    backgroundColor: "#ffe4e9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ffb6c1",
  },
  cardText: {
    fontSize: 16,
    marginVertical: 4,
    color: "#8d4f63",
  },
  bold: {
    fontWeight: "700",
    color: "#c2557c",
  },
});
