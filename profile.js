// profile.js: Add JavaScript logic or question data here later.

/* =========================================
   HABESHA EXAM CENTER
   File: profile.js
   Purpose: Student profile management
   Dependencies: storage.js
========================================= */

(function () {
  "use strict";

  const SELECTORS = {
    name: [
      "[data-profile-name]",
      "#profileName"
    ],
    email: [
      "[data-profile-email]",
      "#profileEmail"
    ],
    grade: [
      "[data-profile-grade]",
      "#profileGrade"
    ],
    region: [
      "[data-profile-region]",
      "#profileRegion"
    ],
    stream: [
      "[data-profile-stream]",
      "#profileStream"
    ],
    initials: [
      "[data-profile-initials]",
      "#profileInitials"
    ],
    form: [
      "[data-profile-form]",
      "#profileForm"
    ],
    message: [
      "[data-profile-message]",
      "#profileMessage"
    ]
  };

  let currentUser = null;
  let initialized = false;

  function findElement(names, root) {
    for (const selector of names) {
      const element = (root || document).querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  function readCurrentUser() {
    if (
      window.HECStorage &&
      typeof window.HECStorage.getCurrentUser === "function"
    ) {
      return window.HECStorage.getCurrentUser();
    }

    const userId = localStorage.getItem("hec_current_user");

    if (!userId) return null;

    try {
      const users = JSON.parse(
        localStorage.getItem("hec_users") || "[]"
      );

      if (!Array.isArray(users)) return null;

      return users.find(function (user) {
        return user && user.id === userId;
      }) || null;
    } catch (error) {
      console.error("Unable to read profile:", error);
      return null;
    }
  }

  function showMessage(message, type) {
    const element = findElement(SELECTORS.message);

    if (!element) return;

    element.textContent = message;
    element.dataset.messageType = type || "info";
    element.hidden = false;
    element.setAttribute("role", "status");
  }

  function displayValue(selectors, value, fallback) {
    const element = findElement(selectors);

    if (!element) return;

    element.textContent =
      value === undefined || value === null || value === ""
        ? (fallback || "Not provided")
        : String(value);
  }

  function getInitials(name) {
    const words = String(name || "").trim().split(/\s+/).filter(Boolean);

    if (!words.length) return "?";

    return words.slice(0, 2).map(function (word) {
      return word.charAt(0).toUpperCase();
    }).join("");
  }

  function renderProfile() {
    currentUser = readCurrentUser();

    if (!currentUser) {
      showMessage("Please sign in to view your profile.", "error");
      return false;
    }

    displayValue(SELECTORS.name, currentUser.name, "Student");
    displayValue(SELECTORS.email, currentUser.email, "Not provided");
    displayValue(SELECTORS.grade, currentUser.grade, "Not selected");
    displayValue(SELECTORS.region, currentUser.region, "Not selected");
    displayValue(SELECTORS.stream, currentUser.stream, "Not applicable");

    const initials = findElement(SELECTORS.initials);

    if (initials) {
      initials.textContent = getInitials(currentUser.name);
      initials.setAttribute("aria-label", "Student initials");
    }

    const form = findElement(SELECTORS.form);

    if (form) {
      const nameInput = form.querySelector("[name='name']");
      const emailInput = form.querySelector("[name='email']");

      if (nameInput) nameInput.value = currentUser.name || "";
      if (emailInput) emailInput.value = currentUser.email || "";

      // Email identifies the existing local account.
      if (emailInput) {
        emailInput.readOnly = true;
        emailInput.setAttribute(
          "aria-describedby",
          "profileEmailHelp"
        );
      }
    }

    return true;
  }

  function saveProfile(event) {
    event.preventDefault();

    const user = readCurrentUser();

    if (!user) {
      showMessage("Your session has expired. Please sign in again.", "error");
      return;
    }

    const form = findElement(SELECTORS.form);

    if (!form) {
      showMessage("The profile form could not be found.", "error");
      return;
    }

    const nameInput = form.querySelector("[name='name']");
    const emailInput = form.querySelector("[name='email']");

    const name = nameInput ? nameInput.value.trim() : "";

    if (!name) {
      showMessage("Enter your name before saving.", "error");
      if (nameInput) nameInput.focus();
      return;
    }

    // Do not modify account identifiers or authentication credentials here.
    const updatedUser = Object.assign({}, user, {
      name: name
    });

    let saved = false;

    if (
      window.HECStorage &&
      typeof window.HECStorage.updateUser === "function"
    ) {
      saved = window.HECStorage.updateUser(updatedUser);
    } else {
      try {
        const users = JSON.parse(
          localStorage.getItem("hec_users") || "[]"
        );

        const index = users.findIndex(function (item) {
          return item && item.id === user.id;
        });

        if (index >= 0) {
          users[index] = updatedUser;
          localStorage.setItem("hec_users", JSON.stringify(users));
          saved = true;
        }
      } catch (error) {
        console.error("Profile save failed:", error);
      }
    }

    if (!saved) {
      showMessage("Your profile could not be saved.", "error");
      return;
    }

    currentUser = updatedUser;

    // Refresh any existing header that supports this event.
    document.dispatchEvent(new CustomEvent("hec:profile-updated", {
      detail: {
        id: updatedUser.id,
        name: updatedUser.name
      }
    }));

    renderProfile();
    showMessage("Profile updated successfully.", "success");
  }

  function initialize() {
    if (initialized) return;
    initialized = true;

    const form = findElement(SELECTORS.form);

    if (form) {
      form.addEventListener("submit", saveProfile);
    }

    renderProfile();
  }

  window.HECProfile = Object.freeze({
    getCurrentUser: function () {
      return readCurrentUser();
    },

    refresh: renderProfile,

    getInitials: getInitials
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
