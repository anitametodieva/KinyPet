import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MedicalScreen from "../screens/medical/MedicalScreen";
import AddMedicalRecordScreen from "../screens/medical/AddMedicalRecordScreen";

const Stack = createNativeStackNavigator();

export default function MedicalNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MedicalList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MedicalList" component={MedicalScreen} />

      <Stack.Screen
        name="AddMedicalRecord"
        component={AddMedicalRecordScreen}
      />
    </Stack.Navigator>
  );
}
