import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MeseroHome from "../screens/mesero/MeseroHome";

const Stack = createNativeStackNavigator();

export default function MeseroNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MeseroHome" component={MeseroHome} options={{ title: "Pedidos" }} />
    </Stack.Navigator>
  );
}
