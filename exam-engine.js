// exam-engine.js: Add JavaScript logic or question data here later.
/* =========================================
   HABESHA EXAM CENTER
   File: exam-engine.js
   Purpose: Shared examination engine
========================================= */

(function () {
  "use strict";

  const CONFIG = {
    defaultDurationMinutes: 60,
    minimumDurationSeconds: 60,
    autoSaveInterval: 5000
  };

  let state = null;
  let timerInterval = null;
  let autoSaveInterval = null;
  let submissionInProgress = false;

  /* -----------------------------------------
     UTILITIES
  ----------------------------------------- */

  function getElement(selector) {
    return document.querySelector(selector);
  }

  function getAll(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function escapeHTML(value) {
    if (window.HEC && typeof window.HEC.escapeHTML === "function") {
      return window.HEC.escapeHTML(value);
    }

    return String(value ?? "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function formatTime(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    if (hours > 0) {
      return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(remainingSeconds).padStart(2, "0")
      ].join(":");
    }

    return [
      String(minutes).padStart(2, "0"),
      String(remainingSeconds).padStart(2, "0")
    ].join(":");
  }

  function getExamConfiguration() {
    const selectedExam = window.HECSelection &&
      window.HECSelection.getSelectedExam
      ? window.HECSelection.getSelectedExam()
      : null;

    const parameters = new URLSearchParams(window.location.search);

    const mode = parameters.get("mode") === "mock"
      ? "mock"
      : "practice";

    const requestedDuration = Number(parameters.get("minutes"));

    const durationMinutes =
      Number.isFinite(requestedDuration) && requestedDuration > 0
        ? Math.min(requestedDuration, 300)
        : CONFIG.defaultDurationMinutes;

    return {
      selectedExam: selectedExam,
      mode: mode,
      durationSeconds: durationMinutes * 60
    };
  }

  function createAttemptId() {
    return "attempt_" +
      Date.now() + "_" +
      Math.random().toString(36).slice(2, 10);
  }

  /* -----------------------------------------
     START EXAM
  ----------------------------------------- */

  async function startExam(options = {}) {
    if (state && !state.submitted) {
      throw new Error("An exam is already in progress.");
    }

    if (!window.HECQuestionLoader) {
      throw new Error("Load question-loader.js before exam-engine.js.");
    }

    const configuration = getExamConfiguration();

    const selectedExam = options.exam || configuration.selectedExam;

    if (!selectedExam) {
      throw new Error(
        "Choose your grade, curriculum and subject before starting."
      );
    }

    const bank = await window.HECQuestionLoader.loadQuestionBank(
      selectedExam
    );

    if (!Array.isArray(bank.questions) || bank.questions.length === 0) {
      throw new Error("Questions for this subject are coming soon.");
    }

    const requestedDuration = Number(options.durationSeconds);

    const durationSeconds =
      Number.isFinite(requestedDuration) && requestedDuration > 0
        ? requestedDuration
        : configuration.durationSeconds;

    const questions = bank.questions.map(function (question, index) {
      return {
        id: question.id,
        question: question.question,
        options: question.options.slice(),
        answer: question.answer,
        explanation: question.explanation || "",
        originalIndex: index
      };
    });

    state = {
      attemptId: createAttemptId(),
      grade: String(selectedExam.grade),
      region: selectedExam.region || "",
      stream: selectedExam.stream || "",
      subject: selectedExam.subject,
      subjectTitle: selectedExam.subjectTitle ||
        selectedExam.subject,
      examType: options.examType || configuration.mode,
      startedAt: new Date().toISOString(),
      durationSeconds: durationSeconds,
      deadline: Date.now() + durationSeconds * 1000,
      remainingSeconds: durationSeconds,
      questions: questions,
      answers: {},
      marked: {},
      currentIndex: 0,
      submitted: false
    };

    submissionInProgress = false;

    renderQuestion();
    renderQuestionNavigation();
    updateTimer();
    updateAnswerSummary();
    startTimer();
    startAutoSave();

    document.dispatchEvent(new CustomEvent("hec:exam-started", {
      detail: getPublicState()
    }));

    return getPublicState();
  }

  /* -----------------------------------------
     CURRENT EXAM STATE
  ----------------------------------------- */

  function getPublicState() {
    if (!state) {
      return null;
    }

    return {
      attemptId: state.attemptId,
      grade: state.grade,
      region: state.region,
      stream: state.stream,
      subject: state.subject,
      subjectTitle: state.subjectTitle,
      examType: state.examType,
      startedAt: state.startedAt,
      durationSeconds: state.durationSeconds,
      remainingSeconds: state.remainingSeconds,
      totalQuestions: state.questions.length,
      currentIndex: state.currentIndex,
      answeredCount: Object.keys(state.answers).length,
      submitted: state.submitted
    };
  }

  function getCurrentQuestion() {
    if (!state || state.submitted) {
      return null;
    }

    return state.questions[state.currentIndex] || null;
  }

  /* -----------------------------------------
     RENDER CURRENT QUESTION
  ----------------------------------------- */

  function renderQuestion() {
    if (!state || state.submitted) {
      return;
    }

    const question = getCurrentQuestion();

    if (!question) {
      return;
    }

    const questionNumber = state.currentIndex + 1;

    const numberElement = getElement("[data-question-number]");
    const textElement = getElement("[data-question-text]");
    const optionsElement = getElement("[data-question-options]");
    const progressElement = getElement("[data-exam-progress]");
    const markButton = getElement("[data-mark-question]");

    if (numberElement) {
      numberElement.textContent =
        "Question " + questionNumber + " of " + state.questions.length;
    }

    if (textElement) {
      textElement.textContent = question.question;
    }

    if (optionsElement) {
      optionsElement.replaceChildren();

      question.options.forEach(function (option, optionIndex) {
        const label = document.createElement("label");
        label.className = "exam-option";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "exam-answer";
        input.value = String(optionIndex);
        input.checked =
          state.answers[question.id] === optionIndex;

        const marker = document.createElement("span");
        marker.className = "exam-option-marker";
        marker.textContent = String.fromCharCode(65 + optionIndex);

        const text = document.createElement("span");
        text.className = "exam-option-text";
        text.textContent = String(option);

        label.append(input, marker, text);

        if (input.checked) {
          label.classList.add("selected");
        }

        input.addEventListener("change", function () {
          selectAnswer(optionIndex);
        });

        optionsElement.appendChild(label);
      });
    }

    if (progressElement) {
      progressElement.textContent =
        Math.round(questionNumber / state.questions.length * 100) + "%";
    }

    if (markButton) {
      const isMarked = Boolean(state.marked[question.id]);

      markButton.textContent = isMarked
        ? "Remove review mark"
        : "Mark for review";

      markButton.setAttribute("aria-pressed", String(isMarked));
    }

    updateNavigationButtons();
    updateQuestionNavigation();
    updateAnswerSummary();
  }

  /* -----------------------------------------
     SELECT AN ANSWER
  ----------------------------------------- */

  function selectAnswer(optionIndex) {
    if (!state || state.submitted) {
      return false;
    }

    const question = getCurrentQuestion();

    if (!question) {
      return false;
    }

    if (
      !Number.isInteger(optionIndex) ||
      optionIndex < 0 ||
      optionIndex >= question.options.length
    ) {
      return false;
    }

    state.answers[question.id] = optionIndex;

    getAll("[data-question-options] .exam-option").forEach(
      function (label, index) {
        label.classList.toggle("selected", index === optionIndex);
      }
    );

    updateQuestionNavigation();
    updateAnswerSummary();
    saveDraft();

    document.dispatchEvent(new CustomEvent("hec:answer-selected", {
      detail: {
        questionId: question.id,
        selectedAnswer: optionIndex
      }
    }));

    return true;
  }

  /* -----------------------------------------
     QUESTION NAVIGATION
  ----------------------------------------- */

  function goToQuestion(index) {
    if (!state || state.submitted) {
      return false;
    }

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= state.questions.length
    ) {
      return false;
    }

    state.currentIndex = index;
    renderQuestion();

    return true;
  }

  function nextQuestion() {
    if (!state) {
      return false;
    }

    if (state.currentIndex < state.questions.length - 1) {
      return goToQuestion(state.currentIndex + 1);
    }

    return false;
  }

  function previousQuestion() {
    if (!state) {
      return false;
    }

    if (state.currentIndex > 0) {
      return goToQuestion(state.currentIndex - 1);
    }

    return false;
  }

  function toggleMarkQuestion() {
    if (!state || state.submitted) {
      return false;
    }

    const question = getCurrentQuestion();

    if (!question) {
      return false;
    }

    state.marked[question.id] = !state.marked[question.id];

    if (!state.marked[question.id]) {
      delete state.marked[question.id];
    }

    renderQuestion();
    saveDraft();

    return true;
  }

  /* -----------------------------------------
     QUESTION NUMBER NAVIGATION
  ----------------------------------------- */

  function renderQuestionNavigation() {
    const container = getElement("[data-question-navigation]");

    if (!container || !state) {
      return;
    }

    container.replaceChildren();

    state.questions.forEach(function (question, index) {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "exam-question-number";
      button.textContent = String(index + 1);
      button.dataset.questionIndex = String(index);

      button.addEventListener("click", function () {
        goToQuestion(index);
      });

      container.appendChild(button);
    });

    updateQuestionNavigation();
  }

  function updateQuestionNavigation() {
    const buttons = getAll("[data-question-navigation] button");

    buttons.forEach(function (button, index) {
      if (!state) {
        return;
      }

      const question = state.questions[index];
      const isAnswered = Object.prototype.hasOwnProperty.call(
        state.answers,
        question.id
      );

      button.classList.toggle("current", index === state.currentIndex);
      button.classList.toggle("answered", isAnswered);
      button.classList.toggle("marked", Boolean(state.marked[question.id]));

      if (index === state.currentIndex) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }

      button.setAttribute(
        "aria-label",
        "Question " + (index + 1) +
        (isAnswered ? ", answered" : ", unanswered") +
        (state.marked[question.id] ? ", marked for review" : "")
      );
    });
  }

  function updateNavigationButtons() {
    if (!state) {
      return;
    }

    const previous = getElement("[data-previous-question]");
    const next = getElement("[data-next-question]");

    if (previous) {
      previous.disabled = state.currentIndex === 0;
    }

    if (next) {
      next.disabled = state.currentIndex === state.questions.length - 1;
    }
  }

  function updateAnswerSummary() {
    if (!state) {
      return;
    }

    const answered = Object.keys(state.answers).length;
    const unanswered = state.questions.length - answered;
    const marked = Object.keys(state.marked).length;

    const answeredElement = getElement("[data-answered-count]");
    const unansweredElement = getElement("[data-unanswered-count]");
    const markedElement = getElement("[data-marked-count]");

    if (answeredElement) {
      answeredElement.textContent = String(answered);
    }

    if (unansweredElement) {
      unansweredElement.textContent = String(unanswered);
    }

    if (markedElement) {
      markedElement.textContent = String(marked);
    }
  }

  /* -----------------------------------------
     COUNTDOWN TIMER
  ----------------------------------------- */

  function startTimer() {
    stopTimer();

    timerInterval = window.setInterval(function () {
      if (!state || state.submitted) {
        stopTimer();
        return;
      }

      state.remainingSeconds = Math.max(
        0,
        Math.ceil((state.deadline - Date.now()) / 1000)
      );

      updateTimer();

      if (state.remainingSeconds <= 0) {
        stopTimer();

        submitExam({
          reason: "time-expired",
          force: true
        });
      }
    }, 250);
  }

  function stopTimer() {
    if (timerInterval !== null) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimer() {
    if (!state) {
      return;
    }

    const timer = getElement("[data-exam-timer]");

    if (!timer) {
      return;
    }

    timer.textContent = formatTime(state.remainingSeconds);

    const isUrgent = state.remainingSeconds <= 300;

    timer.classList.toggle("urgent", isUrgent);
    timer.setAttribute("aria-live", isUrgent ? "assertive" : "off");
  }

  /* -----------------------------------------
     SAVE A TEMPORARY DRAFT
  ----------------------------------------- */

  function getDraftKey() {
    if (!state) {
      return "";
    }

    return "hec_exam_draft_" + state.attemptId;
  }

  function saveDraft() {
    if (!state || state.submitted) {
      return false;
    }

    const draft = {
      attemptId: state.attemptId,
      grade: state.grade,
      region: state.region,
      stream: state.stream,
      subject: state.subject,
      examType: state.examType,
      startedAt: state.startedAt,
      deadline: state.deadline,
      durationSeconds: state.durationSeconds,
      answers: state.answers,
      marked: state.marked,
      currentIndex: state.currentIndex,
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(getDraftKey(), JSON.stringify(draft));
      return true;
    } catch (error) {
      console.warn("Unable to save exam draft:", error);
      return false;
    }
  }

  function startAutoSave() {
    stopAutoSave();

    autoSaveInterval = window.setInterval(function () {
      saveDraft();
    }, CONFIG.autoSaveInterval);
  }

  function stopAutoSave() {
    if (autoSaveInterval !== null) {
      window.clearInterval(autoSaveInterval);
      autoSaveInterval = null;
    }
  }

  /* -----------------------------------------
     SCORING
  ----------------------------------------- */

  function calculateResults() {
    if (!state) {
      throw new Error("There is no active exam.");
    }

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    const review = state.questions.map(function (question) {
      const hasAnswer = Object.prototype.hasOwnProperty.call(
        state.answers,
        question.id
      );

      const selectedAnswer = hasAnswer
        ? state.answers[question.id]
        : null;

      let status = "unanswered";

      if (hasAnswer && selectedAnswer === question.answer) {
        correct++;
        status = "correct";
      } else if (hasAnswer) {
        incorrect++;
        status = "incorrect";
      } else {
        unanswered++;
      }

      return {
        questionId: question.id,
        question: question.question,
        options: question.options,
        selectedAnswer: selectedAnswer,
        correctAnswer: question.answer,
        explanation: question.explanation,
        status: status,
        markedForReview: Boolean(state.marked[question.id])
      };
    });

    const total = state.questions.length;

    return {
      total: total,
      correct: correct,
      incorrect: incorrect,
      unanswered: unanswered,
      score: correct,
      percentage: total > 0 ? Math.round(correct / total * 10000) / 100 : 0,
      review: review
    };
  }

  /* -----------------------------------------
     SUBMIT EXAM
  ----------------------------------------- */

  async function submitExam(options = {}) {
    if (!state || state.submitted || submissionInProgress) {
      return null;
    }

    if (!options.force) {
      const unanswered = state.questions.length -
        Object.keys(state.answers).length;

      const message = unanswered > 0
        ? "You have " + unanswered +
          " unanswered question(s). Submit your exam anyway?"
        : "Are you sure you want to submit your exam?";

      if (!window.confirm(message)) {
        return null;
      }
    }

    submissionInProgress = true;

    stopTimer();
    stopAutoSave();

    state.remainingSeconds = Math.max(
      0,
      Math.ceil((state.deadline - Date.now()) / 1000)
    );

    const calculated = calculateResults();

    const attempt = {
      id: state.attemptId,
      grade: state.grade,
      region: state.region,
      stream: state.stream,
      subject: state.subject,
      subjectTitle: state.subjectTitle,
      examType: state.examType,
      startedAt: state.startedAt,
      completedAt: new Date().toISOString(),
      durationSeconds: state.durationSeconds,
      timeSpentSeconds: Math.min(
        state.durationSeconds,
        Math.max(0, state.durationSeconds - state.remainingSeconds)
      ),
      totalQuestions: calculated.total,
      correct: calculated.correct,
      incorrect: calculated.incorrect,
      unanswered: calculated.unanswered,
      score: calculated.score,
      percentage: calculated.percentage,
      answers: state.answers,
      review: calculated.review,
      submissionReason: options.reason || "manual"
    };

    /*
      Mark submitted only after the attempt has been assembled.
      A storage failure must not silently destroy the result.
    */

    let saved = false;
    let saveMessage = "";

    try {
      if (
        window.HECStorage &&
        typeof window.HECStorage.saveExamAttempt === "function"
      ) {
        const result = window.HECStorage.saveExamAttempt(attempt);
        saved = Boolean(result && result.success);

        if (!saved) {
          saveMessage = result && result.message
            ? result.message
            : "The result could not be saved.";
        }
      } else {
        saveMessage = "Exam storage is not connected.";
      }
    } catch (error) {
      console.error("Could not save exam result:", error);
      saveMessage = "The result could not be saved.";
    }

    state.submitted = true;
    submissionInProgress = false;

    try {
      localStorage.setItem(