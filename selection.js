// selection.js: Add JavaScript logic or question data here later.
/* =========================================
   HABESHA EXAM CENTER
   File: selection.js
   Purpose: Grade, region and stream selection
========================================= */

(function () {
  "use strict";

  const SELECTION_KEY = "hec_current_selection";
  const SELECTED_EXAM_KEY = "hec_selected_exam";
  const USERS_KEY = "hec_users";
  const CURRENT_USER_KEY = "hec_current_user";

  const VALID_GRADES = ["6", "8", "12"];
  const VALID_REGIONS = ["amhara", "addis-ababa"];
  const VALID_STREAMS = ["natural", "social"];

  function normalizeGrade(grade) {
    return String(grade || "").trim();
  }

  function normalizeRegion(region) {
    const value = String(region || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");

    if (value === "addis" || value === "addisababa") {
      return "addis-ababa";
    }

    return value;
  }

  function normalizeStream(stream) {
    const value = String(stream || "").trim().toLowerCase();

    if (value === "natural-science" || value === "natural science") {
      return "natural";
    }

    if (value === "social-science" || value === "social science") {
      return "social";
    }

    return value;
  }

  function validateSelection(selection) {
    if (!selection || typeof selection !== "object") {
      return {
        valid: false,
        message: "Choose your grade first."
      };
    }

    const grade = normalizeGrade(selection.grade);

    if (!VALID_GRADES.includes(grade)) {
      return {
        valid: false,
        message: "Choose Grade 6, Grade 8, or Grade 12."
      };
    }

    if (grade === "6" || grade === "8") {
      const region = normalizeRegion(selection.region);

      if (!VALID_REGIONS.includes(region)) {
        return {
          valid: false,
          message: "Choose Amhara or Addis Ababa."
        };
      }

      return {
        valid: true,
        value: {
          grade: grade,
          region: region,
          stream: "",
          updatedAt: new Date().toISOString()
        }
      };
    }

    const stream = normalizeStream(selection.stream);

    if (!VALID_STREAMS.includes(stream)) {
      return {
        valid: false,
        message: "Choose Natural Science or Social Science."
      };
    }

    return {
      valid: true,
      value: {
        grade: grade,
        region: "",
        stream: stream,
        updatedAt: new Date().toISOString()
      }
    };
  }

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.error("Could not read selection data:", error);
      return fallback;
    }
  }

  function saveSelection(selection) {
    const result = validateSelection(selection);

    if (!result.valid) {
      return result;
    }

    try {
      localStorage.setItem(
        SELECTION_KEY,
        JSON.stringify(result.value)
      );
    } catch (error) {
      return {
        valid: false,
        message: "Could not save your selection on this device."
      };
    }

    updateCurrentUser(result.value);

    return {
      valid: true,
      value: result.value,
      message: "Your selection has been saved."
    };
  }

  function updateCurrentUser(selection) {
    const userId = readCurrentUserId();

    if (!userId) {
      return;
    }

    const users = readJSON(USERS_KEY, []);

    if (!Array.isArray(users)) {
      return;
    }

    const index = users.findIndex(function (user) {
      return user && user.id === userId;
    });

    if (index === -1) {
      return;
    }

    users[index].grade = selection.grade;
    users[index].region = selection.region;
    users[index].stream = selection.stream;

    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error("Could not update the user's selection:", error);
    }
  }

  function readCurrentUserId() {
    try {
      return localStorage.getItem(CURRENT_USER_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function getSelection() {
    const saved = readJSON(SELECTION_KEY, null);

    if (saved) {
      const result = validateSelection(saved);

      if (result.valid) {
        return result.value;
      }
    }

    const userId = readCurrentUserId();
    const users = readJSON(USERS_KEY, []);

    if (!userId || !Array.isArray(users)) {
      return null;
    }

    const user = users.find(function (item) {
      return item && item.id === userId;
    });

    if (!user) {
      return null;
    }

    const result = validateSelection({
      grade: user.grade,
      region: user.region,
      stream: user.stream
    });

    return result.valid ? result.value : null;
  }

  function saveSelectedExam(exam) {
    if (!exam || typeof exam !== "object") {
      return {
        success: false,
        message: "Choose a subject first."
      };
    }

    const selection = getSelection();

    if (!selection) {
      return {
        success: false,
        message: "Choose your grade and curriculum first."
      };
    }

    const subject = String(exam.subject || "")
      .trim()
      .toLowerCase();

    if (!/^[a-z0-9-]+$/.test(subject)) {
      return {
        success: false,
        message: "The selected subject is invalid."
      };
    }

    const selectedExam = {
      grade: selection.grade,
      region: selection.region,
      stream: selection.stream,
      subject: subject,
      subjectTitle: String(exam.subjectTitle || subject),
      selectedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(
        SELECTED_EXAM_KEY,
        JSON.stringify(selectedExam)
      );
    } catch (error) {
      return {
        success: false,
        message: "Could not save your subject selection."
      };
    }

    return {
      success: true,
      exam: selectedExam
    };
  }

  function getSelectedExam() {
    const exam = readJSON(SELECTED_EXAM_KEY, null);

    if (!exam || typeof exam !== "object") {
      return null;
    }

    return exam;
  }

  function getRegionTitle(region) {
    const names = {
      amhara: "Amhara",
      "addis-ababa": "Addis Ababa"
    };

    return names[normalizeRegion(region)] || "Not selected";
  }

  function getStreamTitle(stream) {
    const names = {
      natural: "Natural Science",
      social: "Social Science"
    };

    return names[normalizeStream(stream)] || "Not selected";
  }

  window.HECSelection = Object.freeze({
    validateSelection,
    saveSelection,
    getSelection,
    saveSelectedExam,
    getSelectedExam,
    getRegionTitle,
    getStreamTitle
  });
})();