import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "./screens/HomeScreen";
import ReportScreen from "./screens/ReportScreen";
import AllSessionsScreen from "./screens/AllSessionsScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let icon;

            if (route.name === "Home") icon = "timer-outline";
            else if (route.name === "Reports") icon = "stats-chart-outline";
            else if (route.name === "AllSessions") icon = "list-outline";

            return <Ionicons name={icon} size={size} color={color} />;
          },

          tabBarActiveTintColor: "#ff4f8b",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Reports" component={ReportScreen} />
        <Tab.Screen
          name="AllSessions"
          component={AllSessionsScreen}
          options={{ tabBarLabel: "All Sessions" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
