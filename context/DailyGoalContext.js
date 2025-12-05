import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const DailyGoalContext = createContext();

export const DailyGoalProvider = ({ children }) => {
  const [dailyGoal, setDailyGoal] = useState(60); // default 60 dk

  useEffect(() => {
    loadGoal();
  }, []);

  const loadGoal = async () => {
    try {
      const g = await AsyncStorage.getItem("dailyGoal");
      if (g) setDailyGoal(parseInt(g));
    } catch (e) {
      console.log("Load goal error:", e);
    }
  };

  const saveGoal = async (val) => {
    try {
      await AsyncStorage.setItem("dailyGoal", val.toString());
      setDailyGoal(val);
    } catch (e) {
      console.log("Save goal error:", e);
    }
  };

  return (
    <DailyGoalContext.Provider value={{ dailyGoal, saveGoal }}>
      {children}
    </DailyGoalContext.Provider>
  );
};
