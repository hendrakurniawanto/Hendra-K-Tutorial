export const firebaseConfig = {
  apiKey: "AIzaSyAmLnmAbKWgagzgFGFG2PsRtvqlvW_HQk0",
  authDomain: "hendra-k-tutorial.firebaseapp.com",
  projectId: "hendra-k-tutorial",
  storageBucket: "hendra-k-tutorial.firebasestorage.app",
  messagingSenderId: "155158042695",
  appId: "1:155158042695:web:8a19fd5415f1e4b9057962",
  measurementId: "G-3Q8ZGYK9KP"
};

export const adminEmail = "hendrakurniawanto@gmail.com";

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => value && !value.startsWith("ISI_")
);
