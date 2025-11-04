import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { View, StatusBar } from "react-native";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <View className="flex-1">
          <AppNavigator />
        </View>
      </NavigationContainer>
    </AuthProvider>
  );
}
