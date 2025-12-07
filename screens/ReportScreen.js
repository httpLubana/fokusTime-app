import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, PieChart } from "react-native-chart-kit";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";

export default function ReportScreen() {
  const navigation = useNavigation();
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

  // ---------------- STATISTICS ----------------
  const today = new Date().toLocaleDateString("tr-TR");

  const todaySessions = sessions.filter(
    (s) => new Date(s.date).toLocaleDateString("tr-TR") === today
  );

  const totalToday = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const totalAll = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalDistractions = sessions.reduce((sum, s) => sum + s.distractions, 0);

  // ---------------- LAST 7 DAYS ----------------
  const getLast7Days = () => {
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const label = d.toLocaleDateString("tr-TR", { day: "2-digit" });

      const filtered = sessions.filter(
        (s) =>
          new Date(s.date).toLocaleDateString("tr-TR") ===
          d.toLocaleDateString("tr-TR")
      );

      const totalSeconds = filtered.reduce((sum, s) => sum + s.duration, 0);

      result.push({
        label,
        minutes: Number((totalSeconds / 60).toFixed(1)),
      });
    }

    return result;
  };

  const last7Days = getLast7Days();

  // ---------------- HEATMAP ----------------
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heatmapGrid = Array(7)
    .fill(null)
    .map(() => []);

  for (let i = 0; i < 28; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const daySessions = sessions.filter(
      (s) =>
        new Date(s.date).toLocaleDateString("tr-TR") ===
        d.toLocaleDateString("tr-TR")
    );

    const total = daySessions.reduce((sum, s) => sum + s.duration, 0);
    const weekday = d.getDay();
    const rowIndex = weekday === 0 ? 6 : weekday - 1;

    heatmapGrid[rowIndex].unshift({
      label: d.getDate(),
      total,
    });
  }

  const heatColor = (sec) => {
    if (sec === 0) return "#ffe4e8";
    if (sec < 900) return "#ffb3c6";
    if (sec < 1800) return "#ff7a9c";
    if (sec < 3600) return "#ff4d7a";
    return "#d12356";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
     <ScrollView
  style={styles.container}
  contentContainerStyle={{ paddingBottom: 120 }}
>

        <Text style={styles.title}>Focus Report</Text>

        <View style={styles.clearBtn}>
          <Button title="Clear All Sessions" color="#d6336c" onPress={clearAll} />
        </View>

        {sessions.length === 0 && (
          <Text style={styles.noData}>No saved sessions yet.</Text>
        )}

        {sessions.length > 0 && (
          <>
            {/* ------------ STATS ------------- */}
            <View style={styles.statsBox}>
              <Text style={styles.statsTitle}>Statistics</Text>

              <Text style={styles.statsText}>
                <Text style={styles.bold}>Today:</Text>{" "}
                {Math.floor(totalToday / 60)} min {totalToday % 60} sec
              </Text>

              <Text style={styles.statsText}>
                <Text style={styles.bold}>All Time:</Text>{" "}
                {Math.floor(totalAll / 60)} min {totalAll % 60} sec
              </Text>

              <Text style={styles.statsText}>
                <Text style={styles.bold}>Total Distractions:</Text>{" "}
                {totalDistractions}
              </Text>
            </View>

            {/* ---- HEATMAP ---- */}
            <Text style={styles.subtitle}>Last 4 Weeks Activity</Text>

            <View style={styles.heatmapRowWrapper}>
              <View style={styles.dayColumn}>
                {DAYS.map((day, i) => (
                  <Text key={i} style={styles.dayLabel}>
                    {day}
                  </Text>
                ))}
              </View>

              <View>
                {heatmapGrid.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.heatmapRow}>
                    {row.map((cell, colIndex) => (
                      <Animatable.View
                        key={colIndex}
                        animation="zoomIn"
                        delay={colIndex * 50}
                        style={[
                          styles.githubCell,
                          { backgroundColor: heatColor(cell.total) },
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {}
            <View style={styles.legendWrapper}>
              <Text style={styles.legendText}>Less</Text>
              <View style={styles.legendBox} />
              <View style={[styles.legendBox, { backgroundColor: "#ffb3c6" }]} />
              <View style={[styles.legendBox, { backgroundColor: "#ff7a9c" }]} />
              <View style={[styles.legendBox, { backgroundColor: "#ff4d7a" }]} />
              <View style={[styles.legendBox, { backgroundColor: "#d12356" }]} />
              <Text style={styles.legendText}>More</Text>
            </View>

            {/* ------------ BAR CHART ------------- */}
            <Text style={styles.subtitle}>Last 7 Days</Text>

            <View style={styles.barCard}>
              <BarChart
                data={{
                  labels: last7Days.map((d) => d.label),
                  datasets: [{ data: last7Days.map((d) => d.minutes) }],
                }}
                width={300}
                height={220}
                fromZero={true}
                yAxisSuffix="m"
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) =>
                    `rgba(214, 51, 108, ${opacity * 0.8})`,
                  labelColor: () => "#b34466",
                  propsForBackgroundLines: {
                    stroke: "#f2d3dd",
                    strokeWidth: 1,
                    strokeDasharray: "4 6",
                  },
                  barPercentage: 0.45,
                }}
                style={{
                  marginVertical: 10,
                  borderRadius: 16,
                  paddingTop: 20,
                }}
              />
            </View>

            {/* ------------ PIE CHART ------------- */}
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

            {/* ---- BUTTON to ALL SESSIONS ---- */}
            <View style={{ marginTop: 30 }}>
              <Button
                title="View All Sessions"
                color="#d6336c"
                onPress={() => navigation.navigate("AllSessions")}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
    color: "#d6336c",
  },
  clearBtn: { marginBottom: 25 },
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
  statsBox: {
    backgroundColor: "#ffe4e9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#c2557c",
    marginBottom: 10,
  },
  statsText: { fontSize: 16, marginVertical: 4, color: "#8d4f63" },

  // HEATMAP
  heatmapRowWrapper: { flexDirection: "row", marginBottom: 15 },
  dayColumn: { marginRight: 6, justifyContent: "space-between", paddingVertical: 2 },
  dayLabel: { fontSize: 11, color: "#944059", fontWeight: "600", height: 16 },
  heatmapRow: { flexDirection: "row", marginBottom: 2 },
  githubCell: { width: 14, height: 14, borderRadius: 3, marginRight: 2 },

  // PIE / BAR
  legendWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 18,
    gap: 4,
  },
  legendText: { fontSize: 12, color: "#944059", fontWeight: "600", marginHorizontal: 4 },
  legendBox: { width: 14, height: 14, borderRadius: 3, backgroundColor: "#ffe4e8" },
  barCard: {
    backgroundColor: "#fff7fa",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#d6336c",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
});
