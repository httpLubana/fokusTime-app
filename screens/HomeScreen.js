import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  AppState,
  Modal,
  Pressable,
  Alert,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

const VALID_CATEGORIES = ["Study", "Coding", "Project", "Book"];

export default function HomeScreen() {
  const [selectedTime, setSelectedTime] = useState(1500);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Study");
  const [distractions, setDistractions] = useState(0);

  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const [wasRunning, setWasRunning] = useState(false);
  const appState = useRef(AppState.currentState);

  const MIN_TIME = 60;
  const MAX_TIME = 7200;

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  // CATEGORY FIX
  useEffect(() => {
    if (!VALID_CATEGORIES.includes(selectedCategory)) {
      setSelectedCategory("Study");
    }
  }, []);

  // ---------------- TIMER LOOP ----------------
  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }

    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setWasRunning(false);
      openSummary();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // ---------------------------------------------
  // SHOW SUMMARY BUT DO NOT SAVE YET
  // ---------------------------------------------
 const openSummary = () => {
  const safeCategory = VALID_CATEGORIES.includes(selectedCategory)
    ? selectedCategory
    : "Study";

  const session = {
    duration: selectedTime - timeLeft,
    category: safeCategory,
    distractions,
    date: new Date().toISOString(),
  };

  setSummaryData(session);
  setShowSummary(true);

  // YENİ: seans bitince timer sıfırlansın
  setTimeLeft(selectedTime);
  setDistractions(0);
};


  // ---------------- APP STATE LISTENER ----------------
  useEffect(() => {
    const listener = AppState.addEventListener("change", (next) => {
      const prev = appState.current;
      appState.current = next;

      if (prev === "active" && next === "background" && isRunning) {
        setDistractions((d) => d + 1);
        setIsRunning(false);
      }

      if (
        wasRunning &&
        prev !== "active" &&
        next === "active" &&
        !isRunning &&
        timeLeft > 0
      ) {
        setTimeout(() => {
          Alert.alert(
            "Continue?",
            "The session was paused. Do you want to continue?",
            [
              { text: "No", style: "cancel" },
              { text: "Yes", onPress: () => setIsRunning(true) },
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

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* ------- ÜST KART ------- */}
      <View style={styles.topCard}>
        <Text style={styles.topLabel}>Time</Text>

        <View style={styles.adjustRow}>
          <TouchableOpacity style={styles.adjustBtn} onPress={decreaseTime}>
            <Text style={styles.adjustText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.timeDisplay}>{formatTime(selectedTime)}</Text>

          <TouchableOpacity style={styles.adjustBtn} onPress={increaseTime}>
            <Text style={styles.adjustText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.topLabel}>Category</Text>

        <Picker
          selectedValue={selectedCategory}
          style={styles.topPicker}
          onValueChange={(val) => {
            if (!VALID_CATEGORIES.includes(val)) return;
            setSelectedCategory(val);
          }}
        >
          {VALID_CATEGORIES.map((c) => (
            <Picker.Item key={c} label={c} value={c} />
          ))}
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

      {/* ------- BUTTONS ------- */}
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

        {/* PLAY / PAUSE */}
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
              setWasRunning(true);
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
            openSummary();
          }}
        >
          <Ionicons name="stop" size={32} color="#c92f68" />
        </Pressable>
      </View>

      <Text style={styles.info}>Category: {selectedCategory}</Text>
      <Text style={styles.info}>Distract: {distractions}</Text>

      {/* ------- SUMMARY MODAL ------- */}
      <Modal visible={showSummary} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Session Summary</Text>

            {summaryData && (
              <>
                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Category:</Text>{" "}
                  {summaryData.category}
                </Text>

                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Time:</Text>{" "}
                  {Math.floor(summaryData.duration / 60)} min{" "}
                  {summaryData.duration % 60} sec
                </Text>

                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Distractions:</Text>{" "}
                  {summaryData.distractions}
                </Text>
              </>
            )}

            {/* --- BUTTONS --- */}
            <View style={{ flexDirection: "row", gap: 15, marginTop: 20 }}>
              {/* CANCEL (Don’t Save) */}
              <Pressable
                style={[styles.closeButton, { backgroundColor: "#aaa" }]}
                onPress={() => {
                  setShowSummary(false);
                }}
              >
                <Text style={styles.closeButtonText}>Don't Save</Text>
              </Pressable>

              {/* SAVE */}
              <Pressable
                style={styles.closeButton}
                onPress={async () => {
                  const oldData = await AsyncStorage.getItem("sessions");
                  let arr = oldData ? JSON.parse(oldData) : [];

                  arr.push(summaryData);

                  await AsyncStorage.setItem(
                    "sessions",
                    JSON.stringify(arr)
                  );

                  setShowSummary(false);
                }}
              >
                <Text style={styles.closeButtonText}>Save</Text>
              </Pressable>
            </View>
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
