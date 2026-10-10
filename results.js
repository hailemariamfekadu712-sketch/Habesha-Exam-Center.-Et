// results.js: Add JavaScript logic or question data here later.
/* =========================================
   HABESHA EXAM CENTER
   File: results.js
   Purpose: Results and answer review
========================================= */

(function () {
  "use strict";

  let currentAttempt = null;
  let activeFilter = "all";

  /* -----------------------------------------
     UTILITIES
  ----------------------------------------- */

  function getElement(selector) {
    return document.querySelector(selector);
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

  function getAttemptId() {
    return new URLSearchParams(window.location.search).get("attempt");
  }

  function getAttemptById(attemptId) {
    if (!attemptId) {
      return null;
    }

    if (
      window.HECStorage &&
      typeof window.HECStorage.findExamAttempt === "function"
    ) {
      const attempt = window.HECStorage.findExamAttempt(attemptId);

      if (attempt) {
        return attempt;
      }
    }

    /*
      Fallback for a result that was just submitted but could
      not be saved into the signed-in user's exam history.
    */

    const lastAttempt = readJSON("hec_last_attempt_result", null);

    if (lastAttempt && lastAttempt.id === attemptId) {
      return lastAttempt;
    }

    return null;
  }

  function formatDate(value) {
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
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;

    if (minutes >= 60) {
      return Math.floor(minutes / 60) + "h " +
        (minutes % 60) + "m";
    }

    return minutes + "m " + remainingSeconds + "s";
  }

  function showMessage(message) {
    const element = getElement("[data-results-message]");

    if (element) {
      element.textContent = message;
      element.hidden = false;
      element.setAttribute("role", "alert");
    }
  }

  /* -----------------------------------------
     NORMALIZE OLD AND NEW ATTEMPTS
  ----------------------------------------- */

  function normalizeAttempt(attempt) {
    if (!attempt || typeof attempt !== "object") {
      return null;
    }

    const total = Number(
      attempt.totalQuestions ??
      attempt.total ??
      0
    );

    const correct = Number(attempt.correct ?? 0);
    const incorrect = Number(attempt.incorrect ?? 0);
    const unanswered = Number(attempt.unanswered ?? 0);

    const percentage = Number.isFinite(Number(attempt.percentage))
      ? Number(attempt.percentage)
      : total > 0
        ? correct / total * 100
        : 0;

    return {
      ...attempt,
      totalQuestions: total,
      correct: correct,
      incorrect: incorrect,
      unanswered: unanswered,
      percentage: percentage,
      review: Array.isArray(attempt.review) ? attempt.review : []
    };
  }

  /* -----------------------------------------
     PAGE HEADER
  ----------------------------------------- */

  function renderHeader(attempt) {
    const title = getElement("[data-results-title]");
    const subtitle = getElement("[data-results-subtitle]");

    if (title) {
      title.textContent = "Examination Results";
    }

    if (subtitle) {
      const parts = [
        attempt.subjectTitle || attempt.subject || "Examination",
        "Grade " + attempt.grade
      ];

      if (attempt.region) {
        parts.push(
          window.HECSelection
            ? window.HECSelection.getRegionTitle(attempt.region)
            : attempt.region
        );
      }

      if (attempt.stream) {
        parts.push(
          window.HECSelection
            ? window.HECSelection.getStreamTitle(attempt.stream)
            : attempt.stream
        );
      }

      subtitle.textContent = parts.join(" · ");
    }
  }

  /* -----------------------------------------
     MAIN SCORE
  ----------------------------------------- */

  function renderScore(attempt) {
    const percentage = Math.max(
      0,
      Math.min(100, attempt.percentage)
    );

    const scoreElement = getElement("[data-results-percentage]");
    const circle = getElement("[data-results-score-circle]");
    const correctElement = getElement("[data-results-correct]");
    const incorrectElement = getElement("[data-results-incorrect]");
    const unansweredElement = getElement("[data-results-unanswered]");
    const totalElement = getElement("[data-results-total]");

    if (scoreElement) {
      scoreElement.textContent =
        percentage.toFixed(percentage % 1 === 0 ? 0 : 2) + "%";
    }

    if (circle) {
      circle.classList.remove("good", "average", "low");

      if (percentage >= 80) {
        circle.classList.add("good");
      } else if (percentage >= 50) {
        circle.classList.add("average");
      } else {
        circle.classList.add("low");
      }
    }

    if (correctElement) {
      correctElement.textContent = String(attempt.correct);
    }

    if (incorrectElement) {
      incorrectElement.textContent = String(attempt.incorrect);
    }

    if (unansweredElement) {
      unansweredElement.textContent = String(attempt.unanswered);
    }

    if (totalElement) {
      totalElement.textContent = String(attempt.totalQuestions);
    }
  }

  /* -----------------------------------------
     EXAM DETAILS
  ----------------------------------------- */

  function renderDetails(attempt) {
    const examType = getElement("[data-results-exam-type]");
    const started = getElement("[data-results-started]");
    const completed = getElement("[data-results-completed]");
    const duration = getElement("[data-results-duration]");
    const reason = getElement("[data-results-submission-reason]");

    if (examType) {
      examType.textContent = attempt.examType === "mock"
        ? "Mock examination"
        : "Practice examination";
    }

    if (started) {
      started.textContent = formatDate(attempt.startedAt);
    }

    if (completed) {
      completed.textContent = formatDate(attempt.completedAt);
    }

    if (duration) {
      duration.textContent = formatDuration(
        attempt.timeSpentSeconds ?? attempt.durationSeconds
      );
    }

    if (reason) {
      const reasons = {
        manual: "Submitted by student",
        "time-expired": "Submitted when time expired"
      };

      reason.textContent =
        reasons[attempt.submissionReason] || "Submitted";
    }
  }

  /* -----------------------------------------
     FILTER CONTROLS
  ----------------------------------------- */

  function initializeFilters() {
    document.querySelectorAll("[data-results-filter]").forEach(
      function (button) {
        button.addEventListener("click", function () {
          activeFilter = button.dataset.resultsFilter || "all";

          document.querySelectorAll("[data-results-filter]").forEach(
            function (item) {
              const isActive =
                item.dataset.resultsFilter === activeFilter;

              item.classList.toggle("active", isActive);
              item.setAttribute("aria-pressed", String(isActive));
            }
          );

          renderReview(currentAttempt);
        });
      }
    );
  }

  function matchesFilter(question) {
    if (activeFilter === "all") {
      return true;
    }

    if (activeFilter === "marked") {
      return Boolean(question.markedForReview);
    }

    return question.status === activeFilter;
  }

  /* -----------------------------------------
     ANSWER REVIEW
  ----------------------------------------- */

  function renderReview(attempt) {
    if (!attempt) {
      return;
    }

    const container = getElement("[data-results-review-list]");
    const countElement = getElement("[data-results-review-count]");

    if (!container) {
      return;
    }

    container.replaceChildren();

    const questions = attempt.review.filter(matchesFilter);

    if (countElement) {
      countElement.textContent =
        questions.length + " question(s)";
    }

    if (questions.length === 0) {
      const empty = document.createElement("div");
      empty.className = "results-empty";

      const title = document.createElement("h2");
      title.textContent = "No questions found";

      const message = document.createElement("p");
      message.textContent =
        "There are no questions matching this filter.";

      empty.append(title, message);
      container.appendChild(empty);

      return;
    }

    questions.forEach(function (question, index) {
      container.appendChild(createQuestionCard(question, index));
    });
  }

  function createQuestionCard(question, index) {
    const article = document.createElement("article");

    article.className = "results-question " + question.status;

    const top = document.createElement("div");
    top.className = "results-question-top";

    const number = document.createElement("span");
    number.className = "results-question-number";
    number.textContent = "Question " + (index + 1);

    const status = document.createElement("span");
    status.className = "results-question-status " + question.status;

    const statusLabels = {
      correct: "Correct",
      incorrect: "Incorrect",
      unanswered: "Unanswered"
    };

    status.textContent = statusLabels[question.status] || "Reviewed";

    top.append(number, status);
    article.appendChild(top);

    const questionText = document.createElement("div");
    questionText.className = "results-question-text";
    questionText.textContent = question.question || "";

    article.appendChild(questionText);

    const answerList = document.createElement("div");
    answerList.className = "results-answer-list";

    (question.options || []).forEach(function (option, optionIndex) {
      const answer = document.createElement("div");
      answer.className = "results-answer";

      const isCorrect = optionIndex === question.correctAnswer;
      const isSelected = optionIndex === question.selectedAnswer;

      if (isCorrect) {
        answer.classList.add("correct-answer");
      }

      if (isSelected && !isCorrect) {
        answer.classList.add("selected-wrong");
      }

      const marker = document.createElement("span");
      marker.className = "results-answer-marker";
      marker.textContent = String.fromCharCode(65 + optionIndex);

      const textWrapper = document.createElement("div");
      textWrapper.className = "results-answer-text";
      textWrapper.textContent = String(option);

      if (isCorrect || isSelected) {
        const note = document.createElement("span");
        note.className = "results-answer-note";

        if (isCorrect && isSelected) {
          note.textContent = "Your answer · Correct answer";
        } else if (isCorrect) {
          note.textContent = "Correct answer";
        } else {
          note.textContent = "Your answer";
        }

        textWrapper.appendChild(document.createElement("br"));
        textWrapper.appendChild(note);
      }

      answer.append(marker, textWrapper);
      answerList.appendChild(answer);
    });

    article.appendChild(answerList);

    if (question.explanation) {
      const explanation = document.createElement("div");
      explanation.className = "results-explanation";

      const heading = document.createElement("h3");
      heading.textContent = "Explanation";

      const paragraph = document.createElement("p");
      paragraph.textContent = question.explanation;

      explanation.append(heading, paragraph);
      article.appendChild(explanation);
    }

    return article;
  }

  /* -----------------------------------------
     ACTION BUTTONS
  ----------------------------------------- */

  function initializeActions(attempt) {
    const retryButton = getElement("[data-results-retry]");
    const historyButton = getElement("[data-results-history]");
    const dashboardButton = getElement("[data-results-dashboard]");

    if (retryButton) {
      retryButton.addEventListener("click", function () {
        const url = new URL("exam.html", window.location.href);

        url.searchParams.set("mode", attempt.examType || "practice");

        window.location.href = url.href;
      });
    }

    if (historyButton) {
      historyButton.addEventListener("click", function () {
        window.location.href = "history.html";
      });
    }

    if (dashboardButton) {
      dashboardButton.addEventListener("click", function () {
        window.location.href = "dashboard.html";
      });
    }
  }

  /* -----------------------------------------
     INITIALIZE RESULTS PAGE
  ----------------------------------------- */

  function initialize() {
    initializeFilters();

    const attemptId = getAttemptId();

    if (!attemptId) {
      showMessage(
        "No examination attempt was specified. Open a result from your exam history."
      );
      return;
    }

    const storedAttempt = getAttemptById(attemptId);
    currentAttempt = normalizeAttempt(storedAttempt);

    if (!currentAttempt) {
      showMessage(
        "This result could not be found on this device. It may have been cleared from browser storage."
      );
      return;
    }

    renderHeader(currentAttempt);
    renderScore(currentAttempt);
    renderDetails(currentAttempt);
    renderReview(currentAttempt);
    initializeActions(currentAttempt);

    const saveWarning = new URLSearchParams(window.location.search)
      .get("save");

    if (saveWarning === "failed") {
      showMessage(
        "Your result is displayed, but it was not saved to your exam history. Keep this page open and try again after checking your browser storage."
      );
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);

  window.HECResults = Object.freeze({
    renderScore: renderScore,
    renderDetails: renderDetails,
    renderReview: renderReview,
    getCurrentAttempt: function () {
      return currentAttempt;
    }
  });
})();