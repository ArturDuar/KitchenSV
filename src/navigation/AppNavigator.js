import React from "react";
import { Platform, ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import AdminNavigator from "./AdminNavigator";
import MeseroNavigator from "./MeseroNavigator";
import CocineroNavigator from "./CocineroNavigator";
import AuthNavigator from "./AuthNavigator";

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );

  if (!user) return <AuthNavigator />;

  // Web
  if (Platform.OS === "web") {
    if (user.role === "admin") return <AdminNavigator />;
    if (user.role === "cocinero") return <CocineroNavigator />;
  }

  // Móvil
  if (Platform.OS !== "web" && user.role === "mesero")
    return <MeseroNavigator />;

  return <AuthNavigator />;
}
