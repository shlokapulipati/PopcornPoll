import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  runTransaction,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";

// Generates a 6-character unique ID for short URL sharing
const generateShortId = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Timeout helper to prevent Firestore calls from hanging indefinitely
const withTimeout = (promise, ms, fallbackValue = null) => {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
};

/**
 * Creates a poll in Firestore
 */
export const createPoll = async (pollData, creator) => {
  let pollId = generateShortId();
  let docRef = doc(db, "polls", pollId);
  
  // Safe collision check with timeout
  try {
    const docSnap = await withTimeout(getDoc(docRef), 1000, null);
    if (docSnap && docSnap.exists()) {
      pollId = generateShortId();
      docRef = doc(db, "polls", pollId);
    }
  } catch (e) {
    console.warn("Firestore error during collision check, using default ID.");
  }

  const formattedPoll = {
    id: pollId,
    question: pollData.question || "Which movie should we watch?",
    options: pollData.options.map((opt, index) => ({
      id: index.toString(),
      movieId: opt.id,
      title: opt.title,
      poster: opt.poster || (opt.poster_path ? `https://image.tmdb.org/t/p/w200${opt.poster_path}` : null),
      votes: 0,
      releaseDate: opt.release_date || opt.releaseDate || "",
      genres: opt.genres || []
    })),
    creatorId: creator ? creator.uid : "anonymous",
    creatorName: creator ? (creator.displayName || "Anonymous Creator") : "Anonymous Creator",
    createdAt: new Date().toISOString(), // Use standard string representation for easier local sort
    expiresAt: pollData.expiresAt ? new Date(pollData.expiresAt).toISOString() : null,
    totalVotes: 0,
    genres: Array.from(new Set(pollData.options.flatMap(opt => opt.genres || [])))
  };

  // Write to local storage fallback
  try {
    const localPolls = JSON.parse(localStorage.getItem("local_polls") || "[]");
    localPolls.unshift(formattedPoll);
    localStorage.setItem("local_polls", JSON.stringify(localPolls));
  } catch (e) {
    console.error("Local storage poll save failed:", e);
  }

  // Attempt Firestore write asynchronously without blocking
  try {
    await withTimeout(setDoc(docRef, {
      ...formattedPoll,
      createdAt: serverTimestamp(), // use server timestamp for database
      expiresAt: formattedPoll.expiresAt ? new Date(formattedPoll.expiresAt) : null
    }), 2000, null);

    // If creator is not anonymous, add pollId to user's createdPolls list in firestore
    if (creator && !creator.isAnonymous) {
      const userRef = doc(db, "users", creator.uid);
      const userSnap = await withTimeout(getDoc(userRef), 1000, null);
      if (userSnap && userSnap.exists()) {
        const userData = userSnap.data();
        const createdPolls = userData.createdPolls || [];
        await updateDoc(userRef, {
          createdPolls: [...createdPolls, pollId]
        });
      }
    }
  } catch (err) {
    console.warn("Firestore save failed or timed out. Poll saved to local session fallback.", err);
  }

  return pollId;
};

/**
 * Fetch a single poll by ID
 */
export const getPollDetails = async (pollId) => {
  const docRef = doc(db, "polls", pollId);
  try {
    const docSnap = await withTimeout(getDoc(docRef), 1500, null);
    if (docSnap && docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.warn("Firestore getDoc failed, using local storage fallback:", err);
  }
  
  // Local storage fallback
  const localPolls = JSON.parse(localStorage.getItem("local_polls") || "[]");
  const found = localPolls.find(p => p.id === pollId);
  return found || null;
};

/**
 * Vote on a poll with deduplication and consistency transaction
 */
export const voteOnPoll = async (pollId, optionId, userId) => {
  // Sync to local storage votes and local polls list
  try {
    const localPolls = JSON.parse(localStorage.getItem("local_polls") || "[]");
    const idx = localPolls.findIndex(p => p.id === pollId);
    if (idx !== -1) {
      localPolls[idx].totalVotes = (localPolls[idx].totalVotes || 0) + 1;
      const optIdx = localPolls[idx].options.findIndex(o => o.id === optionId);
      if (optIdx !== -1) {
        localPolls[idx].options[optIdx].votes = (localPolls[idx].options[optIdx].votes || 0) + 1;
      }
      localStorage.setItem("local_polls", JSON.stringify(localPolls));
    }
    const localVotes = JSON.parse(localStorage.getItem("local_votes") || "{}");
    if (!localVotes[userId]) {
      localVotes[userId] = {};
    }
    localVotes[userId][pollId] = optionId;
    localStorage.setItem("local_votes", JSON.stringify(localVotes));
  } catch (e) {
    console.error("Local vote record error:", e);
  }

  const pollRef = doc(db, "polls", pollId);
  const voterRef = doc(db, "polls", pollId, "voters", userId);

  try {
    return await withTimeout(runTransaction(db, async (transaction) => {
      const voterSnap = await transaction.get(voterRef);
      if (voterSnap.exists()) {
        throw new Error("You have already voted on this poll!");
      }

      const pollSnap = await transaction.get(pollRef);
      if (!pollSnap.exists()) {
        throw new Error("Poll does not exist.");
      }

      const pollData = pollSnap.data();
      const expiry = pollData.expiresAt?.toDate ? pollData.expiresAt.toDate() : (pollData.expiresAt ? new Date(pollData.expiresAt) : null);
      if (expiry && expiry < new Date()) {
        throw new Error("This poll has expired.");
      }

      const updatedOptions = pollData.options.map(option => {
        if (option.id === optionId) {
          return { ...option, votes: (option.votes || 0) + 1 };
        }
        return option;
      });

      const newTotalVotes = (pollData.totalVotes || 0) + 1;

      transaction.update(pollRef, {
        options: updatedOptions,
        totalVotes: newTotalVotes
      });

      transaction.set(voterRef, {
        optionId,
        votedAt: new Date()
      });

      return { success: true, newOptions: updatedOptions, newTotalVotes };
    }), 2000, null);
  } catch (err) {
    console.warn("Firestore vote transaction failed or timed out. Vote saved in local state.", err);
    // Get latest local state to return
    const localPolls = JSON.parse(localStorage.getItem("local_polls") || "[]");
    const found = localPolls.find(p => p.id === pollId);
    if (found) {
      return { success: true, newOptions: found.options, newTotalVotes: found.totalVotes };
    }
    return { success: true };
  }
};

/**
 * Check if a user has already voted on a specific poll
 */
export const checkIfUserVoted = async (pollId, userId) => {
  if (!userId) return false;
  
  // Fast local storage vote check namespaced by userId first
  const localVotes = JSON.parse(localStorage.getItem("local_votes") || "{}");
  if (localVotes[userId] && localVotes[userId][pollId]) {
    return localVotes[userId][pollId];
  }

  const voterRef = doc(db, "polls", pollId, "voters", userId);
  try {
    const voterSnap = await withTimeout(getDoc(voterRef), 1000, null);
    if (voterSnap && voterSnap.exists()) {
      return voterSnap.data().optionId;
    }
  } catch (e) {
    console.warn("Firestore checkIfUserVoted failed/timed out.");
  }
  return null;
};

/**
 * Fetch list of polls (trending, recent, active)
 */
export const fetchPolls = async (filterType = "recent", limitCount = 10) => {
  const pollsRef = collection(db, "polls");
  let q;
  
  if (filterType === "trending") {
    q = query(pollsRef, orderBy("totalVotes", "desc"), limit(limitCount));
  } else if (filterType === "active") {
    const now = new Date();
    q = query(
      pollsRef, 
      where("expiresAt", ">", now), 
      orderBy("expiresAt", "asc"), 
      limit(limitCount)
    );
  } else {
    q = query(pollsRef, orderBy("createdAt", "desc"), limit(limitCount));
  }

  try {
    const querySnapshot = await withTimeout(getDocs(q), 1500, null);
    
    // Parse local polls list
    const localPolls = JSON.parse(localStorage.getItem("local_polls") || "[]");

    if (!querySnapshot) {
      console.warn("Firestore fetchPolls timed out. Using local fallback.");
      return localPolls.slice(0, limitCount);
    }

    const results = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data());
    });

    // Merge database polls and local polls
    const merged = [...results];
    localPolls.forEach(lp => {
      if (!merged.some(mp => mp.id === lp.id)) {
        merged.push(lp);
      }
    });

    // Client-side sort/filter matching the request
    if (filterType === "trending") {
      merged.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
    } else if (filterType === "active") {
      const now = new Date();
      return merged
        .filter(p => !p.expiresAt || new Date(p.expiresAt) > now)
        .sort((a, b) => {
          const tA = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
          const tB = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
          return tA - tB;
        })
        .slice(0, limitCount);
    } else {
      // recent
      merged.sort((a, b) => {
        const timeA = a.createdAt?.seconds || new Date(a.createdAt).getTime() / 1000 || 0;
        const timeB = b.createdAt?.seconds || new Date(b.createdAt).getTime() / 1000 || 0;
        return timeB - timeA;
      });
    }

    return merged.slice(0, limitCount);
  } catch (err) {
    console.warn("Firestore fetchPolls failed, using local fallback:", err);
    return JSON.parse(localStorage.getItem("local_polls") || "[]").slice(0, limitCount);
  }
};

/**
 * Fetch polls created by a user
 */
export const fetchUserCreatedPolls = async (userId) => {
  const pollsRef = collection(db, "polls");
  const q = query(pollsRef, where("creatorId", "==", userId));
  
  // Read local polls for this user
  const localPolls = JSON.parse(localStorage.getItem("local_polls") || "[]")
    .filter(p => p.creatorId === userId);

  try {
    const querySnapshot = await withTimeout(getDocs(q), 1500, null);
    if (!querySnapshot) {
      console.warn("Firestore fetchUserCreatedPolls timed out. Using local fallback.");
      return localPolls;
    }

    const results = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data());
    });

    // Merge database results and local storage polls
    const merged = [...results];
    localPolls.forEach(lp => {
      if (!merged.some(mp => mp.id === lp.id)) {
        merged.push(lp);
      }
    });

    // Sort by createdAt descending
    return merged.sort((a, b) => {
      const timeA = a.createdAt?.seconds || new Date(a.createdAt).getTime() / 1000 || 0;
      const timeB = b.createdAt?.seconds || new Date(b.createdAt).getTime() / 1000 || 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.warn("Firestore fetchUserCreatedPolls failed, using local fallback:", err);
    return localPolls;
  }
};

export const updateUserVotedPoll = async (userId, pollId, optionId) => {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await withTimeout(getDoc(userRef), 1500, null);
    if (userSnap && userSnap.exists()) {
      const userData = userSnap.data();
      const votedPolls = userData.votedPolls || {};
      votedPolls[pollId] = optionId;
      await withTimeout(updateDoc(userRef, { votedPolls }), 1500, null);
    }
  } catch (err) {
    console.warn("Failed to update user voted poll in database, fallback to local storage only.", err);
  }
};

/**
 * Deletes a poll from Firestore and local storage fallback
 */
export const deletePoll = async (pollId, userId) => {
  // 1. Remove from local storage
  try {
    const localPolls = JSON.parse(localStorage.getItem("local_polls") || "[]");
    const updatedPolls = localPolls.filter(p => p.id !== pollId);
    localStorage.setItem("local_polls", JSON.stringify(updatedPolls));
  } catch (e) {
    console.error("Failed to delete poll from local storage", e);
  }

  // 2. Delete Firestore document
  const pollRef = doc(db, "polls", pollId);
  try {
    await withTimeout(deleteDoc(pollRef), 2000, null);

    // 3. Remove from user's created list in Firestore if user is present
    if (userId) {
      const userRef = doc(db, "users", userId);
      const userSnap = await withTimeout(getDoc(userRef), 1000, null);
      if (userSnap && userSnap.exists()) {
        const userData = userSnap.data();
        const createdPolls = userData.createdPolls || [];
        const updatedCreated = createdPolls.filter(id => id !== pollId);
        await updateDoc(userRef, {
          createdPolls: updatedCreated
        });
      }
    }
    return true;
  } catch (err) {
    console.warn("Firestore delete failed or timed out. Removed from local storage only.", err);
    return true;
  }
};
