import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MedicalScreen from "../screens/medical/MedicalScreen";
import AddMedicalRecordScreen from "../screens/medical/AddMedicalRecordScreen";
import MedicalRecordDetailsScreen from "../screens/medical/MedicalRecordDetailsScreen";

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

      <Stack.Screen
        name="MedicalRecordDetails"
        component={MedicalRecordDetailsScreen}
      />

      <Stack.Screen
        name="EditMedicalRecord"
        component={AddMedicalRecordScreen}
      />
    </Stack.Navigator>
  );
}
