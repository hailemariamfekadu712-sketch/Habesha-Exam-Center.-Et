// exam-types.js: Add JavaScript logic or question data here later.

/* =========================================
   HABESHA EXAM CENTER
   File: exam-types.js
   Purpose: Examination types and modes
   Dependencies: storage.js, grades.js
========================================= */

(function () {
  "use strict";

  const EXAM_TYPES = Object.freeze({
    "6": {
      examName: "Grade 6 Regional Examination",
      modes: [
        {
          id: "practice",
          title: "Practice",
          description: "Practice available questions at your own pace."
        },
        {
          id: "mock",
          title: "Mock Examination",
          description: "Attempt a timed examination when questions are available."
        }
      ]
    },

    "8": {
      examName: "Grade 8 Regional Examination",
      modes: [
        {
          id: "practice",
          title: "Practice",
          description: "Practice available questions at your own pace."
        },
        {
          id: "mock",
          title: "Mock Examination",
          description: "Attempt a timed examination when questions are available."
        }
      ]
    },

    "12": {
      examName: "Ethiopian University Entrance Examination",
      modes: [
        {
          id: "practice",
          title: "Practice",
          description: "Review questions and explanations when available."
        },
        {
          id: "mock",
          title: "Mock Examination",
          description: "Attempt a timed entrance examination when questions are available."
        }
      ]
    }
  });

  function getGradeNumber(grade) {
    const value = String(grade == null ? "" : grade);
    return Object.prototype.hasOwnProperty.call(EXAM_TYPES, value)
      ? value
      : "";
  }

  function getSelection() {
    if (
      window.HECGrades &&
      typeof window.HECGrades.getCurrentSelection === "function"
    ) {
      return window.HECGrades.getCurrentSelection();
    }

    if (
      window.HECStorage &&
      typeof window.HECStorage.getCurrentSelection === "function"
    ) {
      return window.HECStorage.getCurrentSelection();
    }

    try {
      return JSON.parse(
        localStorage.getItem("hec_current_selection") || "null"
      );
    } catch (error) {
      return null;
    }
  }

  function getExamTypes(grade) {
    const number = getGradeNumber(grade);

    if (!number) return null;

    const item = EXAM_TYPES[number];

    return {
      grade: number,
      examName: item.examName,
      modes: item.modes.map(function (mode) {
        return Object.assign({}, mode);
      })
    };
  }

  function getAvailableModes(grade) {
    const exam = getExamTypes(grade);
    return exam ? exam.modes : [];
  }

  function getExamType(mode) {
    const value = String(mode || "").toLowerCase().trim();

    return getAvailableModes(getSelection()?.grade).find(function (item) {
      return item.id === value;
    }) || null;
  }

  function saveMode(mode) {
    const selection = getSelection();

    if (!selection || !getGradeNumber(selection.grade)) {
      return {
        success: false,
        message: "Choose your grade before selecting an exam mode."
      };
    }

    const exam = getExamTypes(selection.grade);
    const selectedMode = exam.modes.find(function (item) {
      return item.id === String(mode || "").toLowerCase().trim();
    });

    if (!selectedMode) {
      return {
        success: false,
        message: "Choose a valid examination mode."
      };
    }

    const selectedExam = {
      grade: String(selection.grade),
      region: selection.grade === "12" ? "" : (selection.region || ""),
      stream: selection.grade === "12" ? (selection.stream || "") : "",
      subject: selection.subject || "",
      subjectTitle: selection.subjectTitle || selection.subject || "",
      examName: exam.examName,
      mode: selectedMode.id
    };

    try {
      if (
        window.HECStorage &&
        typeof window.HECStorage.saveSelectedExam === "function"
      ) {
        if (!window.HECStorage.saveSelectedExam(selectedExam)) {
          throw new Error("Storage rejected the selection.");
        }
      } else {
        localStorage.setItem(
          "hec_selected_exam",
          JSON.stringify(selectedExam)
        );
      }

      document.dispatchEvent(new CustomEvent("hec:exam-mode-selected", {
        detail: selectedExam
      }));

      return {
        success: true,
        selection: selectedExam
      };
    } catch (error) {
      console.error("Could not save exam mode:", error);

      return {
        success: false,
        message: "Could not save your examination mode on this device."
      };
    }
  }

  function render(container) {
    if (typeof container === "string") {
      container = document.querySelector(container);
    }

    if (!container) return;

    const selection = getSelection();

    if (!selection || !getGradeNumber(selection.grade)) {
      container.textContent = "Choose a grade to see examination modes.";
      return;
    }

    const exam = getExamTypes(selection.grade);
    container.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = exam.examName;
    container.appendChild(heading);

    exam.modes.forEach(function (mode) {
      const card = document.createElement("article");
      card.className = "exam-mode-card";

      const title = document.createElement("h3");
      title.textContent = mode.title;

      const description = document.createElement("p");
      description.textContent = mode.description;

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Choose " + mode.title;

      button.addEventListener("click", function () {
        const result = saveMode(mode.id);

        if (!result.success) {
          window.alert(result.message);
          return;
        }

        const url = new URL("subject.html", window.location.href);
        url.searchParams.set("grade", selection.grade);
        url.searchParams.set("mode", mode.id);

        if (selection.subject) {
          url.searchParams.set("subject", selection.subject);
        }

        if (selection.region) {
          url.searchParams.set("region", selection.region);
        }

        if (selection.stream) {
          url.searchParams.set("stream", selection.stream);
        }

        window.location.href = url.href;
      });

      card.append(title, description, button);
      container.appendChild(card);
    });
  }

  window.HECExamTypes = Object.freeze({
    getExamTypes: getExamTypes,
    getAvailableModes: getAvailableModes,
    getExamType: getExamType,
    saveMode: saveMode,
    render: render
  });
})();
