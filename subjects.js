// subjects.js: Add JavaScript logic or question data here later.

/* =========================================
   HABESHA EXAM CENTER
   File: subjects.js
   Purpose: Subject catalogue and navigation
   Dependencies: grades.js
========================================= */

(function () {
  "use strict";

  const SUBJECTS = {
    "6": {
      "amhara": [
        { id: "english", name: "English" },
        { id: "mathematics", name: "Mathematics" },
        { id: "amharic", name: "Amharic" },
        { id: "afaan-oromo", name: "Afaan Oromo" },
        { id: "general-science", name: "General Science" },
        { id: "social-studies", name: "Social Studies" },
        { id: "citizenship", name: "Civics and Ethical Education" },
        { id: "ict", name: "Information and Communication Technology" },
        { id: "health-and-physical-education", name: "Health and Physical Education" },
        { id: "art", name: "Art Education" }
      ],

      "addis-ababa": [
        { id: "english", name: "English" },
        { id: "mathematics", name: "Mathematics" },
        { id: "amharic", name: "Amharic" },
        { id: "afaan-oromo", name: "Afaan Oromo" },
        { id: "general-science", name: "General Science" },
        { id: "social-studies", name: "Social Studies" },
        { id: "citizenship", name: "Civics and Ethical Education" },
        { id: "ict", name: "Information and Communication Technology" },
        { id: "health-and-physical-education", name: "Health and Physical Education" },
        { id: "art", name: "Art Education" }
      ]
    },

    "8": {
      "amhara": [
        { id: "english", name: "English" },
        { id: "mathematics", name: "Mathematics" },
        { id: "amharic", name: "Amharic" },
        { id: "afaan-oromo", name: "Afaan Oromo" },
        { id: "biology", name: "Biology" },
        { id: "chemistry", name: "Chemistry" },
        { id: "physics", name: "Physics" },
        { id: "social-studies", name: "Social Studies" },
        { id: "citizenship", name: "Civics and Ethical Education" },
        { id: "ict", name: "Information and Communication Technology" },
        { id: "health-and-physical-education", name: "Health and Physical Education" }
      ],

      "addis-ababa": [
        { id: "english", name: "English" },
        { id: "mathematics", name: "Mathematics" },
        { id: "amharic", name: "Amharic" },
        { id: "afaan-oromo", name: "Afaan Oromo" },
        { id: "biology", name: "Biology" },
        { id: "chemistry", name: "Chemistry" },
        { id: "physics", name: "Physics" },
        { id: "social-studies", name: "Social Studies" },
        { id: "citizenship", name: "Civics and Ethical Education" },
        { id: "ict", name: "Information and Communication Technology" },
        { id: "health-and-physical-education", name: "Health and Physical Education" }
      ]
    },

    "12": {
      "natural": [
        { id: "english", name: "English" },
        { id: "mathematics", name: "Mathematics" },
        { id: "aptitude", name: "General Aptitude" },
        { id: "physics", name: "Physics" },
        { id: "chemistry", name: "Chemistry" },
        { id: "biology", name: "Biology" }
      ],

      "social": [
        { id: "english", name: "English" },
        { id: "mathematics", name: "Mathematics" },
        { id: "aptitude", name: "General Aptitude" },
        { id: "geography", name: "Geography" },
        { id: "history", name: "History" },
        { id: "economics", name: "Economics" }
      ]
    }
  };

  const DEFAULT_REGION = "amhara";

  function normalizeGrade(grade) {
    return String(grade == null ? "" : grade);
  }

  function normalizeRegion(region) {
    const value = String(region || "").toLowerCase().trim();

    if (
      value === "addis" ||
      value === "addis ababa" ||
      value === "addis_ababa" ||
      value === "addis-ababa"
    ) {
      return "addis-ababa";
    }

    if (value === "amhara" || value === "amhara region") {
      return "amhara";
    }

    return "";
  }

  function normalizeStream(stream) {
    const value = String(stream || "").toLowerCase().trim();

    if (value === "natural" || value === "natural science") {
      return "natural";
    }

    if (
      value === "social" ||
      value === "social science" ||
      value === "social sciences"
    ) {
      return "social";
    }

    return "";
  }

  function getCurrentSelection() {
    if (
      window.HECGrades &&
      typeof window.HECGrades.getCurrentSelection === "function"
    ) {
      return window.HECGrades.getCurrentSelection();
    }

    try {
      return JSON.parse(
        localStorage.getItem("hec_current_selection") || "null"
      );
    } catch (error) {
      return null;
    }
  }

  function getSubjects(options) {
    options = options || {};

    const grade = normalizeGrade(options.grade);
    const region = normalizeRegion(options.region);
    const stream = normalizeStream(options.stream);

    if (grade === "6" || grade === "8") {
      const selectedRegion = region || DEFAULT_REGION;
      const subjects = SUBJECTS[grade][selectedRegion];

      return subjects
        ? subjects.map(function (subject) {
            return Object.assign({}, subject);
          })
        : [];
    }

    if (grade === "12") {
      const subjects = SUBJECTS["12"][stream];

      return subjects
        ? subjects.map(function (subject) {
            return Object.assign({}, subject);
          })
        : [];
    }

    return [];
  }

  function getSubject(options) {
    options = options || {};

    const subjectId = String(options.subject || "").toLowerCase();

    return getSubjects(options).find(function (subject) {
      return subject.id === subjectId;
    }) || null;
  }

  function getSubjectTitle(subjectId, options) {
    const subject = getSubject(Object.assign({}, options, {
      subject: subjectId
    }));

    return subject ? subject.name : "";
  }

  function getExamName(grade) {
    if (window.HECGrades && window.HECGrades.getGrade) {
      const item = window.HECGrades.getGrade(grade);

      if (item) return item.examName;
    }

    if (String(grade) === "6") {
      return "Grade 6 Regional Examination";
    }

    if (String(grade) === "8") {
      return "Grade 8 Regional Examination";
    }

    if (String(grade) === "12") {
      return "Ethiopian University Entrance Examination";
    }

    return "Examination";
  }

  function getAvailability(subject, options) {
    const item = getSubject(Object.assign({}, options, {
      subject: subject
    }));

    if (!item) {
      return {
        available: false,
        message: "Choose a valid grade, curriculum, and subject."
      };
    }

    /*
      Question banks and resources will be registered separately.
      A subject appearing in this catalogue does not mean its
      questions or learning resources have already been uploaded.
    */

    let hasQuestions = false;

    if (
      window.HECQuestionLoader &&
      typeof window.HECQuestionLoader.loadQuestionBank === "function"
    ) {
      hasQuestions = true;
    }

    return {
      available: false,
      questionsRegistered: hasQuestions,
      subject: item,
      message: "Learning materials and examination questions for " +
        item.name + " will be uploaded soon."
    };
  }

  function saveSubjectSelection(options) {
    options = options || {};

    const current = getCurrentSelection() || {};

    const grade = normalizeGrade(options.grade || current.grade);
    const region = normalizeRegion(options.region || current.region);
    const stream = normalizeStream(options.stream || current.stream);
    const subjectId = String(options.subject || "").toLowerCase();

    const subjects = getSubjects({
      grade: grade,
      region: region,
      stream: stream
    });

    const subject = subjects.find(function (item) {
      return item.id === subjectId;
    });

    if (!subject) {
      return {
        success: false,
        message: "This subject does not match the selected curriculum."
      };
    }

    const selection = {
      grade: grade,
      region: grade === "12" ? "" : region,
      stream: grade === "12" ? stream : "",
      subject: subject.id,
      subjectTitle: subject.name,
      examName: getExamName(grade)
    };

    try {
      if (
        window.HECSelection &&
        typeof window.HECSelection.saveSelectedExam === "function"
      ) {
        const result = window.HECSelection.saveSelectedExam(selection);

        if (result === false) {
          return {
            success: false,
            message: "Could not save the subject selection."
          };
        }
      } else if (
        window.HECStorage &&
        typeof window.HECStorage.saveSelectedExam === "function"
      ) {
        if (!window.HECStorage.saveSelectedExam(selection)) {
          return {
            success: false,
            message: "Could not save the subject selection."
          };
        }
      } else {
        localStorage.setItem(
          "hec_selected_exam",
          JSON.stringify(selection)
        );
      }

      document.dispatchEvent(new CustomEvent("hec:subject-selected", {
        detail: selection
      }));

      return {
        success: true,
        selection: selection
      };
    } catch (error) {
      console.error("Subject selection failed:", error);

      return {
        success: false,
        message: "Could not save the subject selection."
      };
    }
  }

  function renderSubjects() {
    const container = document.querySelector("[data-subject-list]");

    if (!container) return;

    const selection = getCurrentSelection();

    if (!selection || !selection.grade) {
      container.textContent =
        "Choose your grade and curriculum to see your subjects.";
      return;
    }

    const subjects = getSubjects({
      grade: selection.grade,
      region: selection.region,
      stream: selection.stream
    });

    container.replaceChildren();

    if (!subjects.length) {
      container.textContent =
        "Select a valid curriculum or Grade 12 stream.";
      return;
    }

    const fragment = document.createDocumentFragment();

    subjects.forEach(function (subject) {
      const card = document.createElement("article");
      card.className = "subject-card";

      const heading = document.createElement("h3");
      heading.textContent = subject.name;

      const description = document.createElement("p");
      description.textContent =
        "Practice examinations and learning materials will be uploaded soon.";

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Open subject";
      button.dataset.subjectId = subject.id;

      button.addEventListener("click", function () {
        const result = saveSubjectSelection({
          grade: selection.grade,
          region: selection.region,
          stream: selection.stream,
          subject: subject.id
        });

        if (!result.success) {
          window.alert(result.message);
          return;
        }

        const url = new URL("subject.html", window.location.href);
        url.searchParams.set("grade", selection.grade);
        url.searchParams.set("subject", subject.id);

        if (selection.region) {
          url.searchParams.set("region", selection.region);
        }

        if (selection.stream) {
          url.searchParams.set("stream", selection.stream);
        }

        window.location.href = url.href;
      });

      card.append(heading, description, button);
      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  function initialize() {
    renderSubjects();

    document.addEventListener("hec:grade-selected", renderSubjects);
    document.addEventListener("hec:selection-saved", renderSubjects);
  }

  window.HECSubjects = Object.freeze({
    getSubjects: getSubjects,
    getSubject: getSubject,
    getSubjectTitle: getSubjectTitle,
    getAvailability: getAvailability,
    saveSubjectSelection: saveSubjectSelection,
    render: renderSubjects,
    getExamName: getExamName
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
