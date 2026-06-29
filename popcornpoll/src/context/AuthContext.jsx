import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInAnonymously, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  linkWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase/config";

const AuthContext = createContext();

const withTimeout = (promise, ms, fallbackValue = null) => {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to save user profile in Firestore
  const createUserProfile = async (firebaseUser) => {
    if (!firebaseUser) return;
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await withTimeout(getDoc(userRef), 2000, null);

      if (userSnap && !userSnap.exists()) {
        const { displayName, email, photoURL, isAnonymous } = firebaseUser;
        await withTimeout(setDoc(userRef, {
          uid: firebaseUser.uid,
          displayName: displayName || `Popcorn-${Math.floor(1000 + Math.random() * 9000)}`,
          email: email || null,
          photoURL: photoURL || null,
          isAnonymous,
          createdAt: serverTimestamp(),
          createdPolls: [],
          votedPolls: {}
        }), 2000, null);
      }
    } catch (err) {
      console.error("Error creating user profile in Firestore:", err);
    }
  };

  useEffect(() => {
    // Check if there is a persistent mock user session first
    const savedMock = localStorage.getItem("mock_user_session");
    if (savedMock) {
      try {
        setUser(JSON.parse(savedMock));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("mock_user_session");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If a mock session has been created, ignore Firebase auth changes
      if (localStorage.getItem("mock_user_session")) {
        setLoading(false);
        return;
      }

      if (currentUser) {
        setUser(currentUser);
        // Sync to Firestore in the background
        createUserProfile(currentUser);
      } else {
        // If not logged in, automatically sign in anonymously
        try {
          const res = await withTimeout(signInAnonymously(auth), 1500, null);
          if (!res) {
            throw new Error("Anonymous sign in timed out.");
          }
        } catch (error) {
          console.error("Error signing in anonymously:", error);
          // Fallback to local storage unique ID if anonymous auth configuration is missing
          let localUid = localStorage.getItem("local_voter_id");
          if (!localUid) {
            localUid = `local-voter-${Math.random().toString(36).substring(2, 15)}`;
            localStorage.setItem("local_voter_id", localUid);
          }
          setUser({
            uid: localUid,
            displayName: localStorage.getItem("voter_nickname") || "Anonymous",
            isAnonymous: true,
            email: null,
            photoURL: null
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      localStorage.removeItem("mock_user_session");
      setUser(result.user);
      createUserProfile(result.user);
      return result.user;
    } catch (error) {
      console.error("Google sign in failed:", error);
      
      const mockUser = {
        uid: `mock-google-user-${Math.random().toString(36).substring(2, 11)}`,
        displayName: localStorage.getItem("voter_nickname") || "Popcorn Fan 🍿",
        email: "popcornfan@example.com",
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=popcornfan`,
        isAnonymous: false
      };
      localStorage.setItem("mock_user_session", JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    } finally {
      setLoading(false);
    }
  };

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const signUpWithEmail = async (email, password, username) => {
    setLoading(true);
    // 1. Check local mock storage first to fail quickly
    let localUsers = [];
    try {
      localUsers = JSON.parse(localStorage.getItem("mock_registered_users") || "[]");
    } catch (e) {
      localUsers = [];
    }
    const existsLocally = localUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (existsLocally) {
      setLoading(false);
      throw new Error("Email already registered!");
    }

    // 2. Check Firestore in case user document exists with same email
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await withTimeout(getDocs(q), 2000, null);
      if (querySnapshot && !querySnapshot.empty) {
        throw new Error("Email already registered!");
      }
    } catch (e) {
      if (e.message === "Email already registered!") {
        setLoading(false);
        throw e;
      }
      console.warn("Firestore email check failed or offline:", e);
    }

    // 3. Attempt Firebase Auth sign-up
    try {
      const result = await withTimeout(createUserWithEmailAndPassword(auth, email, password), 4000, null);
      if (!result) {
        throw new Error("Sign up timed out.");
      }
      await updateProfile(result.user, { displayName: username });
      const updatedUser = {
        ...result.user,
        displayName: username
      };
      setUser(updatedUser);
      createUserProfile(updatedUser);
      setLoading(false);
      return updatedUser;
    } catch (error) {
      // If Firebase auth throws "email-already-in-use", fail immediately instead of falling back to mock user creation
      if (error.code === "auth/email-already-in-use" || error.message?.includes("email-already-in-use") || error.message === "Email already registered!") {
        setLoading(false);
        throw new Error("Email already registered!");
      }
      
      console.warn("Firebase email signup failed, using local mock storage fallback.", error);
      const mockUser = {
        uid: `mock-email-user-${Math.random().toString(36).substring(2, 11)}`,
        displayName: username,
        email: email,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
        isAnonymous: false
      };
      localUsers.push({ email, password, displayName: username, uid: mockUser.uid });
      localStorage.setItem("mock_registered_users", JSON.stringify(localUsers));
      localStorage.setItem("mock_user_session", JSON.stringify(mockUser));
      setUser(mockUser);
      setLoading(false);
      return mockUser;
    }
  };

  const signInWithEmail = async (email, password) => {
    setLoading(true);
    try {
      const result = await withTimeout(signInWithEmailAndPassword(auth, email, password), 4000, null);
      if (!result) {
        throw new Error("Sign in timed out.");
      }
      setUser(result.user);
      createUserProfile(result.user);
      setLoading(false);
      return result.user;
    } catch (error) {
      console.warn("Firebase email signin failed, trying local mock storage fallback.", error);
      let localUsers = [];
      try {
        localUsers = JSON.parse(localStorage.getItem("mock_registered_users") || "[]");
      } catch (e) {
        localUsers = [];
      }
      const found = localUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!found) {
        setLoading(false);
        throw new Error("Invalid email or password!");
      }
      const mockUser = {
        uid: found.uid,
        displayName: found.displayName,
        email: found.email,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${found.displayName}`,
        isAnonymous: false
      };
      localStorage.setItem("mock_user_session", JSON.stringify(mockUser));
      setUser(mockUser);
      setLoading(false);
      return mockUser;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("mock_user_session");
      localStorage.removeItem("google_auth_disabled");
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginWithGoogle, 
      logout,
      signUpWithEmail,
      signInWithEmail,
      authModalOpen,
      setAuthModalOpen
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
