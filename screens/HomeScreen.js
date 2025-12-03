import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  AppState,
  Modal,
  Pressable,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { AnimatedCircularProgress } from "react-native-circular-progress";

export default function HomeScreen() {
  const [selectedTime, setSelectedTime] = useState(1500);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Ders");
  const [distractions, setDistractions] = useState(0);

  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const appState = useRef(AppState.currentState);

  // ---------- FORMAT TIME ----------
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  // ---------- TIMER LOOP ----------
  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }

    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      saveSession();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // ---------- SAVE SESSION ----------
  const saveSession = async () => {
    const session = {
      duration: selectedTime - timeLeft,
      category: selectedCategory,
      distractions: distractions,
      date: new Date().toISOString(),
    };

    setSummaryData(session);
    setShowSummary(true);

    try {
      const oldData = await AsyncStorage.getItem("sessions");
      const arr = oldData ? JSON.parse(oldData) : [];

      arr.push(session);

      await AsyncStorage.setItem("sessions", JSON.stringify(arr));
    } catch (e) {
      console.log("Save error:", e);
    }
  };

  // ---------- DISTRACTION + APPSTATE CONTROL ----------
  useEffect(() => {
    const listener = AppState.addEventListener("change", (next) => {
      const prev = appState.current;
      appState.current = next;

      // Kullanıcı uygulamadan ayrıldı → distraction + pause
      if (prev === "active" && next === "background" && isRunning) {
        setDistractions((d) => d + 1);
        setIsRunning(false);
      }

      // Kullanıcı geri döndü → Devam etmek ister misiniz?
      if (prev !== "active" && next === "active" && !isRunning && timeLeft > 0) {
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
  }, [isRunning, timeLeft]);

  // ---------- RETURN UI ----------
  return (
    <View style={styles.container}>

      {/* TIME PICKER */}
      <Picker
        selectedValue={selectedTime}
        style={styles.picker}
        onValueChange={(val) => {
          setSelectedTime(val);
          setTimeLeft(val);
        }}
      >
        <Picker.Item label="5 dakika" value={300} />
        <Picker.Item label="10 dakika" value={600} />
        <Picker.Item label="15 dakika" value={900} />
        <Picker.Item label="25 dakika" value={1500} />
        <Picker.Item label="30 dakika" value={1800} />
      </Picker>

      {/* CATEGORY PICKER */}
      <Picker
        selectedValue={selectedCategory}
        style={styles.picker}
        onValueChange={(val) => setSelectedCategory(val)}
      >
        <Picker.Item label="Ders" value="Ders" />
        <Picker.Item label="Kodlama" value="Kodlama" />
        <Picker.Item label="Proje" value="Proje" />
        <Picker.Item label="Kitap" value="Kitap" />
      </Picker>

      {/* CIRCULAR TIMER */}
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

      {/* BUTTONS */}
      <View style={styles.buttons}>
        <Button title="Start" onPress={() => setIsRunning(true)} />

        <Button
          title="Pause"
          onPress={() => {
            if (isRunning) {
              setIsRunning(false);
              saveSession();
            }
          }}
        />

        <Button
          title="Reset"
          onPress={() => {
            setIsRunning(false);
            setTimeLeft(selectedTime);
            setDistractions(0);
          }}
        />

      </View>

      {/* INFO */}
      <Text style={styles.info}>Süre: {formatTime(selectedTime)}</Text>
      <Text style={styles.info}>Kategori: {selectedCategory}</Text>
      <Text style={styles.info}>Dikkat Dağınıklığı: {distractions}</Text>

      {/* SUMMARY MODAL */}
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

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  picker: {
    width: 200,
    height: 50,
    marginBottom: 10,
  },
  timeText: {
    fontSize: 52,
    fontWeight: "bold",
    color: "#c92f68",
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 25,
    flexWrap: "wrap",
    justifyContent: "center",
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
