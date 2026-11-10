import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PetsScreen from "../screens/pets/PetsScreen";
import PetDetailsScreen from "../screens/pets/PetDetailsScreen";
import { COLORS } from "../constants/colors";

const Stack = createNativeStackNavigator();

export default function PetsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.primary,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen
        name="PetsList"
        component={PetsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="PetDetails"
        component={PetDetailsScreen}
        options={{ title: "Pet Details" }}
      />
    </Stack.Navigator>
  );
}
