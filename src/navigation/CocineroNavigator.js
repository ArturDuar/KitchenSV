import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CocineroHome from "../screens/cocinero/CocineroHome";

const Stack = createNativeStackNavigator();

export default function CocineroNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CocineroHome" component={CocineroHome} options={{ title: "Cocina" }} />
    </Stack.Navigator>
  );
}
