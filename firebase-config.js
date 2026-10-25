export const firebaseConfig = {
  apiKey: "ISI_DARI_FIREBASE_CONSOLE",
  authDomain: "ISI_DARI_FIREBASE_CONSOLE",
  projectId: "ISI_DARI_FIREBASE_CONSOLE",
  appId: "ISI_DARI_FIREBASE_CONSOLE"
};

export const adminEmail = "hendrakurniawanto@gmail.com";

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => value && !value.startsWith("ISI_")
);
