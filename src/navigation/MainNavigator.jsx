import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/home/HomeScreen";
import PetsNavigator from "./PetsNavigator";
import MedicalNavigator from "./MedicalNavigator";
import AppointmentsNavigator from "./AppointmentsNavigator";
import { COLORS } from "../constants/colors";

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 65,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Home: focused ? "home" : "home-outline",
            Pets: focused ? "paw" : "paw-outline",
            Medical: focused ? "medkit" : "medkit-outline",
            Appointments: focused ? "calendar" : "calendar-outline",
          };

          return (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />

      <Tab.Screen
        name="Pets"
        component={PetsNavigator}
        options={{
          title: "My Pets",
          popToTopOnBlur: true,
        }}
      />

      <Tab.Screen
        name="Medical"
        component={MedicalNavigator}
        options={{
          popToTopOnBlur: true,
        }}
      />

      <Tab.Screen
        name="Appointments"
        component={AppointmentsNavigator}
        options={{
          popToTopOnBlur: true,
        }}
      />
    </Tab.Navigator>
  );
}
