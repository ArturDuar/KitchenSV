import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AdminHome from "../screens/admin/AdminHome";

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminHome" component={AdminHome} options={{ title: "Panel Admin" }} />
    </Stack.Navigator>
  );
}
