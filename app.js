// app.js: Add JavaScript logic or question data here later.
/* =========================================
   HABESHA EXAM CENTER
   File: app.js
   Purpose: Shared application utilities
========================================= */

(function () {
  "use strict";

  const KEYS = {
    users: "hec_users",
    currentUser: "hec_current_user",
    rememberedEmail: "hec_remembered_email",
    selection: "hec_current_selection",
    selectedExam: "hec_selected_exam",
    lastAttempt: "hec_last_attempt_id"
  };

  /* Safely read JSON data */

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);

      if (value === null) {
        return fallback;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error("Could not read stored data:", key, error);
      return fallback;
    }
  }

  /* Safely save JSON data */

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Could not save stored data:", key, error);
      return false;
    }
  }

  /* Read and save individual values */

  function readValue(key, fallback = "") {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      console.error("Could not read stored value:", error);
      return fallback;
    }
  }

  function writeValue(key, value) {
    try {
      localStorage.setItem(key, String(value));
      return true;
    } catch (error) {
      console.error("Could not save stored value:", error);
      return false;
    }
  }

  /* Find the currently signed-in user */

  function getCurrentUserId() {
    return readValue(KEYS.currentUser, "");
  }

  function getUsers() {
    const users = readJSON(KEYS.users, []);
    return Array.isArray(users) ? users : [];
  }

  function getCurrentUser() {
    const userId = getCurrentUserId();

    if (!userId) {
      return null;
    }

    return getUsers().find(function (user) {
      return user && user.id === userId;
    }) || null;
  }

  /* Save a modified user back into the user list */

  function saveUser(updatedUser) {
    if (!updatedUser || !updatedUser.id) {
      return false;
    }

    const users = getUsers();
    const index = users.findIndex(function (user) {
      return user && user.id === updatedUser.id;
    });

    if (index === -1) {
      return false;
    }

    users[index] = updatedUser;

    return writeJSON(KEYS.users, users);
  }

  /* Sign out */

  function logout(redirectTo = "login.html") {
    try {
      localStorage.removeItem(KEYS.currentUser);
    } catch (error) {
      console.error("Could not sign out:", error);
    }

    window.location.href = redirectTo;
  }

  /* HTML escaping for text inserted into markup */

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return replacements[character];
    });
  }

  /* Display a message inside an existing element */

  function showMessage(elementOrId, message, type = "info") {
    const element = typeof elementOrId === "string"
      ? document.getElementById(elementOrId)
      : elementOrId;

    if (!element) {
      return;
    }

    element.textContent = message;
    element.className = "app-message app-message-" + type;
    element.setAttribute("role", type === "error" ? "alert" : "status");
  }

  /* Format dates consistently */

  function formatDate(value, options = {}) {
    if (!value) {
      return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options
    }).format(date);
  }

  function formatDuration(seconds) {
    const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return hours + "h " + remainingMinutes + "m";
    }

    if (minutes > 0) {
      return minutes + "m " + remainingSeconds + "s";
    }

    return remainingSeconds + "s";
  }

  /* Create a URL with query parameters */

  function buildURL(filename, parameters = {}) {
    const url = new URL(filename, window.location.href);

    Object.entries(parameters).forEach(function ([key, value]) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    return url.href;
  }

  /* Read the current page's query parameters */

  function getQueryParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /* Shared navigation helpers */

  function requireLogin(redirectTo = "login.html") {
    if (getCurrentUser()) {
      return true;
    }

    window.location.href = buildURL(redirectTo, {
      next: window.location.pathname.split("/").pop()
        + window.location.search
    });

    return false;
  }

  /* Public shared API */

  window.HEC = Object.freeze({
    KEYS,
    readJSON,
    writeJSON,
    readValue,
    writeValue,
    getUsers,
    getCurrentUserId,
    getCurrentUser,
    saveUser,
    logout,
    escapeHTML,
    showMessage,
    formatDate,
    formatDuration,
    buildURL,
    getQueryParameter,
    requireLogin
  });
})();