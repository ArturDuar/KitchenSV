import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCNqFX_nJuw8tuR2DkxRwXQ1UE2loNlXyI",
  authDomain: "kitchensv-47863.firebaseapp.com",
  projectId: "kitchensv-47863",
  storageBucket: "kitchensv-47863.firebasestorage.app",
  messagingSenderId: "223871745234",
  appId: "1:223871745234:web:3e3ac8d70df2b11e45410b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;