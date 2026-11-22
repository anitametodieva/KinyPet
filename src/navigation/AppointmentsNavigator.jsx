import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AppointmentsScreen from "../screens/appointments/AppointmentsScreen";
import AddAppointmentScreen from "../screens/appointments/AddAppointmentScreen";
import AppointmentDetailsScreen from "../screens/appointments/AppointmentDetailsScreen";

const Stack = createNativeStackNavigator();

export default function AppointmentsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppointmentsList" component={AppointmentsScreen} />

      <Stack.Screen name="AddAppointment" component={AddAppointmentScreen} />

      <Stack.Screen
        name="AppointmentDetails"
        component={AppointmentDetailsScreen}
      />
    </Stack.Navigator>
  );
}
