import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <View className="flex-1 justify-center p-5">
      <Text className="text-xl font-bold mb-4">Iniciar Sesión</Text>
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        className="border p-2 mb-3 rounded"
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="border p-2 mb-3 rounded"
      />
      <Button title="Ingresar" onPress={handleLogin} />
      {error ? <Text className="text-red-500 mt-3">{error}</Text> : null}
    </View>
  );
}
