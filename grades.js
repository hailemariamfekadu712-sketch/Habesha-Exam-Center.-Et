// grades.js: Add JavaScript logic or question data here later.

/* =========================================
   HABESHA EXAM CENTER
   File: grades.js
   Purpose: Grade and curriculum selection
========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "hec_current_selection";

  const GRADES = Object.freeze({
    "6": {
      id: "6",
      label: "Grade 6",
      examName: "Grade 6 Regional Examination",
      requiresRegion: true,
      requiresStream: false,
      regions: [
        { value: "amhara", label: "Amhara Region" },
        { value: "addis-ababa", label: "Addis Ababa City Administration" }
      ],
      streams: []
    },

    "8": {
      id: "8",
      label: "Grade 8",
      examName: "Grade 8 Regional Examination",
      requiresRegion: true,
      requiresStream: false,
      regions: [
        { value: "amhara", label: "Amhara Region" },
        { value: "addis-ababa", label: "Addis Ababa City Administration" }
      ],
      streams: []
    },

    "12": {
      id: "12",
      label: "Grade 12",
      examName: "Ethiopian University Entrance Examination",
      requiresRegion: false,
      requiresStream: true,
      regions: [],
      streams: [
        { value: "natural", label: "Natural Science" },
        { value: "social", label: "Social Science" }
      ]
    }
  });

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.error("Could not read grade selection:", error);
      return fallback;
    }
  }

  function getGrade(gradeId) {
    return GRADES[String(gradeId)] || null;
  }

  function getCurrentSelection() {
    if (
      window.HECStorage &&
      typeof window.HECStorage.getCurrentSelection === "function"
    ) {
      return window.HECStorage.getCurrentSelection();
    }

    return readJSON(STORAGE_KEY, null);
  }

  function saveSelection(selection) {
    if (!selection || !getGrade(selection.grade)) {
      return {
        success: false,
        message: "Choose a supported grade."
      };
    }

    const grade = getGrade(selection.grade);
    const region = String(selection.region || "");
    const stream = String(selection.stream || "");

    if (
      grade.requiresRegion &&
      !grade.regions.some(function (item) {
        return item.value === region;
      })
    ) {
      return {
        success: false,
        message: "Choose your region to continue."
      };
    }

    if (
      grade.requiresStream &&
      !grade.streams.some(function (item) {
        return item.value === stream;
      })
    ) {
      return {
        success: false,
        message: "Choose your Grade 12 stream to continue."
      };
    }

    const savedSelection = {
      grade: grade.id,
      region: grade.requiresRegion ? region : "",
      stream: grade.requiresStream ? stream : "",
      examName: grade.examName,
      selectedAt: new Date().toISOString()
    };

    let saved = false;

    if (
      window.HECStorage &&
      typeof window.HECStorage.saveCurrentSelection === "function"
    ) {
      saved = window.HECStorage.saveCurrentSelection(savedSelection);
    } else {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(savedSelection)
        );
        saved = true;
      } catch (error) {
        console.error("Could not save grade selection:", error);
      }
    }

    if (!saved) {
      return {
        success: false,
        message: "Could not save your selection on this device."
      };
    }

    document.dispatchEvent(new CustomEvent("hec:grade-selected", {
      detail: savedSelection
    }));

    return {
      success: true,
      selection: savedSelection
    };
  }

  function getRegionLabel(gradeId, regionId) {
    const grade = getGrade(gradeId);
    if (!grade) return "";

    const region = grade.regions.find(function (item) {
      return item.value === regionId;
    });

    return region ? region.label : "";
  }

  function getStreamLabel(gradeId, streamId) {
    const grade = getGrade(gradeId);
    if (!grade) return "";

    const stream = grade.streams.find(function (item) {
      return item.value === streamId;
    });

    return stream ? stream.label : "";
  }

  function populateOptions(select, options, placeholder) {
    if (!select) return;

    select.replaceChildren();

    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    select.appendChild(first);

    options.forEach(function (item) {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });
  }

  function setVisible(element, visible) {
    if (!element) return;

    element.hidden = !visible;
    element.setAttribute("aria-hidden", String(!visible));
  }

  function initializeGradeForm() {
    const gradeSelect = document.querySelector("[data-grade-select]");
    const regionField = document.querySelector("[data-region-field]");
    const regionSelect = document.querySelector("[data-region-select]");
    const streamField = document.querySelector("[data-stream-field]");
    const streamSelect = document.querySelector("[data-stream-select]");
    const examName = document.querySelector("[data-grade-exam-name]");
    const form = document.querySelector("[data-grade-form]");
    const message = document.querySelector("[data-grade-message]");

    if (!gradeSelect) return;

    function showMessage(value) {
      if (!message) return;
      message.textContent = value;
      message.hidden = !value;
      message.setAttribute("role", "status");
    }

    function updateGradeFields() {
      const grade = getGrade(gradeSelect.value);

      if (!grade) {
        setVisible(regionField, false);
        setVisible(streamField, false);
        if (examName) examName.textContent = "";
        populateOptions(regionSelect, [], "Choose a region");
        populateOptions(streamSelect, [], "Choose a stream");
        showMessage("");
        return;
      }

      setVisible(regionField, grade.requiresRegion);
      setVisible(streamField, grade.requiresStream);

      populateOptions(
        regionSelect,
        grade.regions,
        "Choose a region"
      );

      populateOptions(
        streamSelect,
        grade.streams,
        "Choose a stream"
      );

      if (examName) {
        examName.textContent = grade.examName;
      }

      showMessage("");
    }

    gradeSelect.addEventListener("change", updateGradeFields);

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();

        const result = saveSelection({
          grade: gradeSelect.value,
          region: regionSelect ? regionSelect.value : "",
          stream: streamSelect ? streamSelect.value : ""
        });

        if (!result.success) {
          showMessage(result.message);
          return;
        }

        showMessage("Selection saved.");

        form.dispatchEvent(new CustomEvent("hec:selection-saved", {
          bubbles: true,
          detail: result.selection
        }));
      });
    }

    const existing = getCurrentSelection();

    if (existing && getGrade(existing.grade)) {
      gradeSelect.value = String(existing.grade);
      updateGradeFields();

      if (regionSelect) regionSelect.value = existing.region || "";
      if (streamSelect) streamSelect.value = existing.stream || "";
    } else {
      updateGradeFields();
    }
  }

  window.HECGrades = Object.freeze({
    getAll: function () {
      return Object.values(GRADES).map(function (grade) {
        return JSON.parse(JSON.stringify(grade));
      });
    },

    getGrade: getGrade,
    getCurrentSelection: getCurrentSelection,
    saveSelection: saveSelection,
    getRegionLabel: getRegionLabel,
    getStreamLabel: getStreamLabel
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeGradeForm);
  } else {
    initializeGradeForm();
  }
})();
