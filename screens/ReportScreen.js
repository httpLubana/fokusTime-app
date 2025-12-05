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

  // ------------------ CLEAR ALL DATA ------------------
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

  // ------------------ STATISTICS ------------------
  const today = new Date().toLocaleDateString("tr-TR");

  const todaySessions = sessions.filter(
    (s) => new Date(s.date).toLocaleDateString("tr-TR") === today
  );

  const totalToday = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const totalAll = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalDistractions = sessions.reduce((sum, s) => sum + s.distractions, 0);

  const last7 = sessions.slice(-7);

  // ------------------ DAILY GOAL TRACKER ------------------
  const DAILY_GOAL = 3600; // 60 dakika = 3600 saniye

  const goalPercent = Math.min((totalToday / DAILY_GOAL) * 100, 100);

  // ------------------ HEATMAP ------------------
  const heatmapDays = 7;
  const heatmapData = [];

  for (let i = 0; i < heatmapDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const formatted = d.toLocaleDateString("tr-TR");

    const daySessions = sessions.filter(
      (s) => new Date(s.date).toLocaleDateString("tr-TR") === formatted
    );

    const total = daySessions.reduce((sum, s) => sum + s.duration, 0);

    heatmapData.unshift({
      label: d.getDate(),
      total,
    });
  }

  const heatColor = (sec) => {
    if (sec === 0) return "#fce1e8";
    if (sec < 900) return "#ffbbc6";
    if (sec < 1800) return "#ff8cab";
    if (sec < 3600) return "#ff5f8a";
    return "#d22b4f";
  };

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

        {/* MAIN CONTENT */}
        {sessions.length > 0 && (
          <>
            {/* -------- STATS -------- */}
            <View style={styles.statsBox}>
              <Text style={styles.statsTitle}>Statistics</Text>

              <Text style={styles.statsText}>
                <Text style={styles.bold}>Today Total Focus:</Text>{" "}
                {Math.floor(totalToday / 60)} min {totalToday % 60} sec
              </Text>

              <Text style={styles.statsText}>
                <Text style={styles.bold}>All Time Focus:</Text>{" "}
                {Math.floor(totalAll / 60)} min {totalAll % 60} sec
              </Text>

              <Text style={styles.statsText}>
                <Text style={styles.bold}>Total Distractions:</Text>{" "}
                {totalDistractions}
              </Text>
            </View>

            {/* -------- DAILY GOAL -------- */}
            <Text style={styles.subtitle}>Daily Goal</Text>

            <View style={styles.goalBox}>
              <Text style={styles.goalText}>
                {Math.floor(totalToday / 60)} / {Math.floor(DAILY_GOAL / 60)} min
              </Text>

              <View style={styles.goalBarBackground}>
                <View
                  style={[
                    styles.goalBarFill,
                    { width: `${goalPercent}%` },
                  ]}
                />
              </View>
            </View>

            {/* -------- HEATMAP -------- */}
            <Text style={styles.subtitle}>Weekly Activity</Text>

            <View style={styles.heatmapRow}>
              {heatmapData.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.heatCell,
                    { backgroundColor: heatColor(d.total) },
                  ]}
                >
                  <Text style={styles.heatLabel}>{d.label}</Text>
                </View>
              ))}
            </View>

            {/* -------- BAR CHART -------- */}
            <Text style={styles.subtitle}>Last 7 Days</Text>

            <BarChart
              data={{
                labels: last7.map((s) =>
                  new Date(s.date).toLocaleDateString("tr-TR", { day: "2-digit" })
                ),
                datasets: [
                  {
                    data: last7.map((s) => Number((s.duration / 60).toFixed(1))),
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

            {/* -------- PIE CHART -------- */}
            <Text style={styles.subtitle}>Category Distribution</Text>

            <PieChart
              data={[
                {
                  name: "Ders",
                  population: sessions.filter((s) => s.category === "Ders").length,
                  color: "#d22b4f",
                },
                {
                  name: "Kodlama",
                  population: sessions.filter((s) => s.category === "Kodlama").length,
                  color: "#ff718b",
                },
                {
                  name: "Proje",
                  population: sessions.filter((s) => s.category === "Proje").length,
                  color: "#ffbbc6",
                },
                {
                  name: "Kitap",
                  population: sessions.filter((s) => s.category === "Kitap").length,
                  color: "#fce1e8",
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

        {/* -------- ALL SESSIONS LIST -------- */}
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
  // ---- Stats ----
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
  // ---- Goal Tracker ----
  goalBox: {
    backgroundColor: "#ffe4ef",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  goalText: {
    fontSize: 16,
    color: "#c2557c",
    marginBottom: 8,
    fontWeight: "700",
  },
  goalBarBackground: {
    width: "100%",
    height: 14,
    backgroundColor: "#ffd6e3",
    borderRadius: 10,
    overflow: "hidden",
  },
  goalBarFill: {
    height: "100%",
    backgroundColor: "#d6336c",
  },

  // ---- Heatmap ----
  heatmapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  heatCell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heatLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8d4f63",
  },

  // ---- Cards ----
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
