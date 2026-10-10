// question-loader.js: Add JavaScript logic or question data here later.
/* =========================================
   HABESHA EXAM CENTER
   File: question-loader.js
   Purpose: Load the selected subject bank
========================================= */

(function () {
  "use strict";

  const BANK_GLOBAL = "HEC_QUESTION_BANK";

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function buildBankFilename(selection) {
    if (!selection || !selection.grade || !selection.subject) {
      throw new Error(
        "A grade and subject are required to load a question bank."
      );
    }

    const grade = String(selection.grade);
    const subject = slugify(selection.subject);

    if (!["6", "8", "12"].includes(grade)) {
      throw new Error("The selected grade is not supported.");
    }

    if (grade === "6" || grade === "8") {
      const region = String(selection.region || "").toLowerCase();

      let regionSlug;

      if (region === "amhara") {
        regionSlug = "amhara";
      } else if (
        region === "addis-ababa" ||
        region === "addis" ||
        region === "addisababa"
      ) {
        regionSlug = "addis";
      } else {
        throw new Error(
          "Choose Amhara or Addis Ababa before selecting a subject."
        );
      }

      return "grade" + grade + "-" + regionSlug + "-" + subject + ".js";
    }

    const stream = String(selection.stream || "").toLowerCase();

    if (!["natural", "social"].includes(stream)) {
      throw new Error(
        "Choose Natural Science or Social Science for Grade 12."
      );
    }

    return "grade12-" + stream + "-" + subject + ".js";
  }

  function validateBank(bank, selection) {
    if (!bank || typeof bank !== "object") {
      throw new Error("The question bank is empty or unavailable.");
    }

    if (!Array.isArray(bank.questions)) {
      throw new Error("The question bank does not contain a questions list.");
    }

    if (bank.questions.length === 0) {
      throw new Error(
        "Questions for this subject are coming soon."
      );
    }

    const invalidQuestion = bank.questions.find(function (question) {
      return !question ||
        question.id === undefined ||
        typeof question.question !== "string" ||
        !Array.isArray(question.options) ||
        question.options.length < 2 ||
        !Number.isInteger(question.answer) ||
        question.answer < 0 ||
        question.answer >= question.options.length;
    });

    if (invalidQuestion) {
      throw new Error(
        "The question bank contains an incorrectly formatted question."
      );
    }

    if (
      bank.subject &&
      slugify(bank.subject) !== slugify(selection.subject)
    ) {
      throw new Error(
        "The loaded question bank does not match the selected subject."
      );
    }

    return bank;
  }

  function loadScript(filename) {
    return new Promise(function (resolve, reject) {
      const script = document.createElement("script");

      script.src = filename;
      script.async = true;
      script.dataset.hecQuestionBank = "true";

      script.onload = function () {
        script.remove();
        resolve();
      };

      script.onerror = function () {
        script.remove();
        reject(
          new Error(
            "Question bank not found. This subject's questions may be coming soon."
          )
        );
      };

      document.head.appendChild(script);
    });
  }

  async function loadQuestionBank(selection) {
    const filename = buildBankFilename(selection);

    /* Remove a previous bank before loading another one. */
    try {
      delete window[BANK_GLOBAL];
    } catch (error) {
      window[BANK_GLOBAL] = undefined;
    }

    await loadScript(filename);

    const bank = window[BANK_GLOBAL];

    return validateBank(bank, selection);
  }

  async function loadSelectedQuestionBank() {
    if (
      !window.HECSelection ||
      typeof window.HECSelection.getSelectedExam !== "function"
    ) {
      throw new Error(
        "The selection module is not loaded. Load selection.js first."
      );
    }

    const exam = window.HECSelection.getSelectedExam();

    if (!exam) {
      throw new Error(
        "No subject has been selected. Return to the subject selection page."
      );
    }

    return loadQuestionBank(exam);
  }

  window.HECQuestionLoader = Object.freeze({
    slugify,
    buildBankFilename,
    validateBank,
    loadQuestionBank,
    loadSelectedQuestionBank
  });
})();