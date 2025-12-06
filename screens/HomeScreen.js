import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  AppState,
  Modal,
  Pressable,
  Alert,
  TouchableOpacity
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const [selectedTime, setSelectedTime] = useState(1500);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Ders");
  const [distractions, setDistractions] = useState(0);

  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  // **SEANS BAŞLADI MI?**
  const [wasRunning, setWasRunning] = useState(false);

  const appState = useRef(AppState.currentState);

  const MIN_TIME = 60;
  const MAX_TIME = 7200;

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  // ---------------- TIMER LOOP ----------------
  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }

    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setWasRunning(false);
      saveSession();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // ---------------- SAVE SESSION ----------------
  const saveSession = async () => {
    const session = {
      duration: selectedTime - timeLeft,
      category: selectedCategory,
      distractions,
      date: new Date().toISOString(),
    };

    setSummaryData(session);
    setShowSummary(true);

    try {
      const old = await AsyncStorage.getItem("sessions");
      const arr = old ? JSON.parse(old) : [];
      arr.push(session);
      await AsyncStorage.setItem("sessions", JSON.stringify(arr));
    } catch (e) {
      console.log("Save error:", e);
    }
  };

  // ---------------- APP STATE LISTENER ----------------
  useEffect(() => {
    const listener = AppState.addEventListener("change", (next) => {
      const prev = appState.current;
      appState.current = next;

      // Arka plana gidince → dikkat dağınıklığı
      if (prev === "active" && next === "background" && isRunning) {
        setDistractions((d) => d + 1);
        setIsRunning(false);
      }

      // Uygulamaya dönünce alert → sadece seans BAŞLAMIŞSA
      if (
        wasRunning &&
        prev !== "active" &&
        next === "active" &&
        !isRunning &&
        timeLeft > 0
      ) {
        setTimeout(() => {
          Alert.alert(
            "Devam Et?",
            "Seans duraklatıldı. Devam etmek ister misiniz?",
            [
              { text: "Hayır", style: "cancel" },
              { text: "Evet", onPress: () => setIsRunning(true) }
            ]
          );
        }, 300);
      }
    });

    return () => listener.remove();
  }, [isRunning, timeLeft, wasRunning]);

  // ---------------- TIME + / - ----------------
  const increaseTime = () => {
    if (selectedTime < MAX_TIME) {
      const newTime = selectedTime + 60;
      setSelectedTime(newTime);
      setTimeLeft(newTime);
    }
  };

  const decreaseTime = () => {
    if (selectedTime > MIN_TIME) {
      const newTime = selectedTime - 60;
      setSelectedTime(newTime);
      setTimeLeft(newTime);
    }
  };

  // ---------------- UI ----------------
  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* ------- ÜST KART ------- */}
      <View style={styles.topCard}>
        <Text style={styles.topLabel}>Süre</Text>

        <View style={styles.adjustRow}>
          <TouchableOpacity style={styles.adjustBtn} onPress={decreaseTime}>
            <Text style={styles.adjustText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.timeDisplay}>{formatTime(selectedTime)}</Text>

          <TouchableOpacity style={styles.adjustBtn} onPress={increaseTime}>
            <Text style={styles.adjustText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.topLabel}>Kategori</Text>
        <Picker
          selectedValue={selectedCategory}
          style={styles.topPicker}
          onValueChange={(val) => setSelectedCategory(val)}
        >
          <Picker.Item label="Ders" value="Ders" />
          <Picker.Item label="Kodlama" value="Kodlama" />
          <Picker.Item label="Proje" value="Proje" />
          <Picker.Item label="Kitap" value="Kitap" />
        </Picker>
      </View>

      {/* ------- TIMER CIRCLE ------- */}
      <AnimatedCircularProgress
        size={260}
        width={12}
        fill={(timeLeft / selectedTime) * 100}
        tintColor="#ff8fb7"
        backgroundColor="#ffd6e3"
        rotation={0}
        lineCap="round"
      >
        {() => <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>}
      </AnimatedCircularProgress>

      {/* ------- BUTONLAR ------- */}
      <View style={styles.iconButtons}>

        {/* RESET */}
        <Pressable
          style={styles.iconBtn}
          onPress={() => {
            setIsRunning(false);
            setWasRunning(false);
            setTimeLeft(selectedTime);
            setDistractions(0);
          }}
        >
          <Ionicons name="refresh" size={32} color="#c92f68" />
        </Pressable>

        {/* START */}
        {!isRunning ? (
          <Pressable
            style={styles.iconBtnCenter}
            onPress={() => {
              setIsRunning(true);
              setWasRunning(true);
            }}
          >
            <Ionicons name="play" size={38} color="#c92f68" />
          </Pressable>
        ) : (
          <Pressable
            style={styles.iconBtnCenter}
            onPress={() => {
              setIsRunning(false);
              saveSession();
              setWasRunning(false);
            }}
          >
            <Ionicons name="pause" size={38} color="#c92f68" />
          </Pressable>
        )}

        {/* STOP */}
        <Pressable
          style={styles.iconBtn}
          onPress={() => {
            setIsRunning(false);
            setWasRunning(false);
            saveSession();
          }}
        >
          <Ionicons name="stop" size={32} color="#c92f68" />
        </Pressable>

      </View>

      <Text style={styles.info}>Kategori: {selectedCategory}</Text>
      <Text style={styles.info}>Dikkat Dağınıklığı: {distractions}</Text>

      {/* ------- SUMMARY MODAL ------- */}
      <Modal visible={showSummary} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Seans Özeti</Text>

            {summaryData && (
              <>
                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Kategori:</Text> {summaryData.category}
                </Text>

                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Süre:</Text>{" "}
                  {Math.floor(summaryData.duration / 60)} dk{" "}
                  {summaryData.duration % 60} sn
                </Text>

                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Dikkat Dağınıklığı:</Text>{" "}
                  {summaryData.distractions}
                </Text>
              </>
            )}

            <Pressable
              style={styles.closeButton}
              onPress={() => {
                setShowSummary(false);
                setTimeLeft(selectedTime);
                setDistractions(0);
              }}
            >
              <Text style={styles.closeButtonText}>Tamam</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 30,
    alignItems: "center",
  },

  topCard: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },

  topLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#c92f68",
    marginBottom: 4,
    marginTop: 8,
  },

  adjustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  adjustBtn: {
    width: 55,
    height: 55,
    backgroundColor: "#ffe6f0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  adjustText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#c92f68",
  },

  timeDisplay: {
    fontSize: 32,
    fontWeight: "700",
    color: "#c92f68",
  },

  topPicker: {
    width: "100%",
    height: 55,
    backgroundColor: "#ffe6f0",
    borderRadius: 10,
    marginTop: 8,
  },

  timeText: {
    fontSize: 52,
    fontWeight: "bold",
    color: "#c92f68",
    marginTop: 10,
  },

  iconButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
    marginTop: 25,
  },

  iconBtn: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: "#ffe6f0",
    alignItems: "center",
    justifyContent: "center",
  },

  iconBtnCenter: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: "#ffd1e0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#c92f68",
  },

  info: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "600",
    color: "#c92f68",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 15,
    color: "#c92f68",
  },

  modalText: {
    fontSize: 18,
    marginVertical: 5,
    color: "#8d4f63",
  },

  closeButton: {
    marginTop: 20,
    backgroundColor: "#c92f68",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },

  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  bold: {
    fontWeight: "700",
    color: "#c92f68",
  },
});
