// storage.js: Add JavaScript logic or question data here later.
/* =========================================
   HABESHA EXAM CENTER
   File: storage.js
   Purpose: Shared browser storage helpers
========================================= */

(function () {
  "use strict";

  const KEYS = {
    users: "hec_users",
    currentUser: "hec_current_user",
    selection: "hec_current_selection",
    selectedExam: "hec_selected_exam",
    lastAttempt: "hec_last_attempt_id",
    flashcardsPrefix: "hec_flashcards_"
  };

  function readJSON(key, fallback) {
    try {
      const stored = localStorage.getItem(key);

      if (stored === null) {
        return fallback;
      }

      return JSON.parse(stored);
    } catch (error) {
      console.error("Storage read failed:", key, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Storage write failed:", key, error);
      return false;
    }
  }

  function getUsers() {
    const users = readJSON(KEYS.users, []);
    return Array.isArray(users) ? users : [];
  }

  function getCurrentUserId() {
    try {
      return localStorage.getItem(KEYS.currentUser) || "";
    } catch (error) {
      return "";
    }
  }

  function getCurrentUser() {
    const id = getCurrentUserId();

    if (!id) {
      return null;
    }

    return getUsers().find(function (user) {
      return user && user.id === id;
    }) || null;
  }

  function updateUser(updatedUser) {
    if (!updatedUser || !updatedUser.id) {
      return false;
    }

    const users = getUsers();
    const index = users.findIndex(function (user) {
      return user && user.id === updatedUser.id;
    });

    if (index < 0) {
      return false;
    }

    users[index] = updatedUser;
    return writeJSON(KEYS.users, users);
  }

  function getExamHistory(user = getCurrentUser()) {
    if (!user || !Array.isArray(user.examHistory)) {
      return [];
    }

    return user.examHistory;
  }

  function saveExamAttempt(attempt) {
    const user = getCurrentUser();

    if (!user) {
      return {
        success: false,
        message: "Sign in before saving an exam result."
      };
    }

    if (!attempt || typeof attempt !== "object") {
      return {
        success: false,
        message: "The exam result is invalid."
      };
    }

    if (!attempt.id) {
      attempt.id = "attempt_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8);
    }

    if (!Array.isArray(user.examHistory)) {
      user.examHistory = [];
    }

    const existingIndex = user.examHistory.findIndex(function (item) {
      return item && item.id === attempt.id;
    });

    if (existingIndex >= 0) {
      user.examHistory[existingIndex] = attempt;
    } else {
      user.examHistory.push(attempt);
    }

    if (!updateUser(user)) {
      return {
        success: false,
        message: "Could not save the exam result on this device."
      };
    }

    writeJSON(KEYS.lastAttempt, attempt.id);

    return { success: true, attempt: attempt };
  }

  function findExamAttempt(attemptId, user = getCurrentUser()) {
    if (!attemptId || !user || !Array.isArray(user.examHistory)) {
      return null;
    }

    return user.examHistory.find(function (attempt) {
      return attempt && attempt.id === attemptId;
    }) || null;
  }

  function getCurrentSelection() {
    return readJSON(KEYS.selection, null);
  }

  function saveCurrentSelection(selection) {
    if (!selection || typeof selection !== "object") {
      return false;
    }

    const saved = writeJSON(KEYS.selection, selection);

    if (saved) {
      const user = getCurrentUser();

      if (user) {
        user.grade = String(selection.grade || user.grade || "");
        user.region = selection.region || "";
        user.stream = selection.stream || "";
        updateUser(user);
      }
    }

    return saved;
  }

  function getSelectedExam() {
    return readJSON(KEYS.selectedExam, null);
  }

  function saveSelectedExam(exam) {
    if (!exam || typeof exam !== "object") {
      return false;
    }

    return writeJSON(KEYS.selectedExam, exam);
  }

  function getFlashcards() {
    const userId = getCurrentUserId();

    if (!userId) {
      return [];
    }

    const cards = readJSON(KEYS.flashcardsPrefix + userId, []);
    return Array.isArray(cards) ? cards : [];
  }

  function saveFlashcards(cards) {
    const userId = getCurrentUserId();

    if (!userId || !Array.isArray(cards)) {
      return false;
    }

    return writeJSON(KEYS.flashcardsPrefix + userId, cards);
  }

  function removeCurrentSession() {
    try {
      localStorage.removeItem(KEYS.currentUser);
      return true;
    } catch (error) {
      console.error("Could not clear the current session:", error);
      return false;
    }
  }

  window.HECStorage = Object.freeze({
    readJSON,
    writeJSON,
    getUsers,
    getCurrentUserId,
    getCurrentUser,
    updateUser,
    getExamHistory,
    saveExamAttempt,
    findExamAttempt,
    getCurrentSelection,
    saveCurrentSelection,
    getSelectedExam,
    saveSelectedExam,
    getFlashcards,
    saveFlashcards,
    removeCurrentSession
  });
})();