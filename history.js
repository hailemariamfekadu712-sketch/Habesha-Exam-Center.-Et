// history.js: Add JavaScript logic or question data here later.

/* =========================================
   HABESHA EXAM CENTER
   File: history.js
   Purpose: Examination history and saved results
========================================= */

(function () {
  "use strict";

  let allAttempts = [];
  let activeType = "all";
  let activeSubject = "all";

  /* -----------------------------------------
     UTILITIES
  ----------------------------------------- */

  function $(selector) {
    return document.querySelector(selector);
  }

  function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
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
    const total = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(total / 60);
    const remaining = Math.floor(total % 60);

    if (minutes >= 60) {
      return Math.floor(minutes / 60) + "h " +
        (minutes % 60) + "m";
    }

    return minutes + "m " + remaining + "s";
  }

  function normalizeAttempt(attempt) {
    const total = Number(
      attempt.totalQuestions ?? attempt.total ?? 0
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
      id: String(attempt.id),
      grade: String(attempt.grade || ""),
      region: String(attempt.region || ""),
      stream: String(attempt.stream || ""),
      subject: String(attempt.subject || "unknown"),
      subjectTitle: String(
        attempt.subjectTitle || attempt.subject || "Examination"
      ),
      examType: attempt.examType === "mock" ? "mock" : "practice",
      startedAt: attempt.startedAt || "",
      completedAt: attempt.completedAt || "",
      totalQuestions: total,
      correct: correct,
      incorrect: incorrect,
      unanswered: unanswered,
      percentage: percentage,
      timeSpentSeconds: Number(attempt.timeSpentSeconds ?? 0)
    };
  }

  /* -----------------------------------------
     LOAD SIGNED-IN USER'S HISTORY
  ----------------------------------------- */

  function loadAttempts() {
    if (
      !window.HECStorage ||
      typeof window.HECStorage.getExamHistory !== "function"
    ) {
      console.error(
        "History unavailable: load storage.js before history.js."
      );

      return [];
    }

    const history = window.HECStorage.getExamHistory();

    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .filter(function (attempt) {
        return attempt &&
          typeof attempt === "object" &&
          attempt.id;
      })
      .map(normalizeAttempt)
      .sort(function (a, b) {
        return new Date(b.completedAt || b.startedAt || 0) -
          new Date(a.completedAt || a.startedAt || 0);
      });
  }

  /* -----------------------------------------
     FILTERS
  ----------------------------------------- */

  function getFilteredAttempts() {
    return allAttempts.filter(function (attempt) {
      const matchesType =
        activeType === "all" ||
        attempt.examType === activeType;

      const matchesSubject =
        activeSubject === "all" ||
        attempt.subject === activeSubject;

      return matchesType && matchesSubject;
    });
  }

  function populateSubjectFilter() {
    const select = $("[data-history-subject-filter]");

    if (!select) return;

    const parameters = new URLSearchParams(window.location.search);
    const requestedSubject = parameters.get("subject");

    const previousValue = requestedSubject || activeSubject;
    const subjects = new Map();

    allAttempts.forEach(function (attempt) {
      if (!subjects.has(attempt.subject)) {
        subjects.set(attempt.subject, attempt.subjectTitle);
      }
    });

    select.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All subjects";
    select.appendChild(allOption);

    Array.from(subjects.entries())
      .sort(function (a, b) {
        return a[1].localeCompare(b[1]);
      })
      .forEach(function (entry) {
        const option = document.createElement("option");
        option.value = entry[0];
        option.textContent = entry[1];
        select.appendChild(option);
      });

    const subjectExists = Array.from(select.options).some(
      function (option) {
        return option.value === previousValue;
      }
    );

    select.value = subjectExists ? previousValue : "all";
    activeSubject = select.value;
  }

  function initializeFilters() {
    const typeButtons = document.querySelectorAll(
      "[data-history-type-filter]"
    );

    typeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeType = button.dataset.historyTypeFilter || "all";

        typeButtons.forEach(function (item) {
          const active =
            item.dataset.historyTypeFilter === activeType;

          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        renderHistory();
      });
    });

    const subjectFilter = $("[data-history-subject-filter]");

    if (subjectFilter) {
      subjectFilter.addEventListener("change", function () {
        activeSubject = subjectFilter.value;
        renderHistory();
      });
    }
  }

  /* -----------------------------------------
     SUMMARY
  ----------------------------------------- */

  function renderSummary() {
    const total = allAttempts.length;

    const average = total
      ? allAttempts.reduce(function (sum, attempt) {
          return sum + attempt.percentage;
        }, 0) / total
      : 0;

    const best = total
      ? Math.max.apply(
          null,
          allAttempts.map(function (attempt) {
            return attempt.percentage;
          })
        )
      : 0;

    const totalElement = $("[data-history-total]");
    const averageElement = $("[data-history-average]");
    const bestElement = $("[data-history-best]");

    if (totalElement) {
      totalElement.textContent = String(total);
    }

    if (averageElement) {
      averageElement.textContent = average.toFixed(1) + "%";
    }

    if (bestElement) {
      bestElement.textContent = best.toFixed(1) + "%";
    }
  }

  /* -----------------------------------------
     CREATE HISTORY CARD
  ----------------------------------------- */

  function createAttemptCard(attempt) {
    const article = document.createElement("article");
    article.className = "history-card";

    const header = document.createElement("div");
    header.className = "history-card-header";

    const heading = document.createElement("h3");
    heading.textContent = attempt.subjectTitle;

    const score = document.createElement("strong");
    score.className = "history-score";
    score.textContent = attempt.percentage.toFixed(1) + "%";

    header.append(heading, score);

    const details = document.createElement("div");
    details.className = "history-card-details";

    const fields = [
      "Grade " + (attempt.grade || "Not specified"),
      attempt.examType === "mock"
        ? "Mock examination"
        : "Practice examination",
      formatDate(attempt.completedAt || attempt.startedAt),
      attempt.correct + " correct · " +
        attempt.incorrect + " incorrect · " +
        attempt.unanswered + " unanswered",
      "Time used: " + formatDuration(attempt.timeSpentSeconds)
    ];

    if (attempt.region) {
      fields.push("Region: " + attempt.region);
    }

    if (attempt.stream) {
      fields.push("Stream: " + attempt.stream);
    }

    fields.forEach(function (value) {
      const paragraph = document.createElement("p");
      paragraph.textContent = value;
      details.appendChild(paragraph);
    });

    const actions = document.createElement("div");
    actions.className = "history-card-actions";

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.textContent = "View results";

    viewButton.addEventListener("click", function () {
      const url = new URL("results.html", window.location.href);
      url.searchParams.set("attempt", attempt.id);
      window.location.href = url.href;
    });

    actions.appendChild(viewButton);
    article.append(header, details, actions);

    return article;
  }

  /* -----------------------------------------
     RENDER HISTORY
  ----------------------------------------- */

  function renderHistory() {
    const container = $("[data-history-list]");
    const emptyState = $("[data-history-empty]");

    renderSummary();

    if (!container) {
      console.warn(
        "History list element [data-history-list] was not found."
      );
      return;
    }

    const filtered = getFilteredAttempts();
    container.replaceChildren();

    if (filtered.length === 0) {
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = allAttempts.length
          ? "No examinations match the selected filters."
          : "You have not completed an examination yet. Your results will appear here after your first submission.";
      } else {
        const message = document.createElement("p");
        message.textContent = allAttempts.length
          ? "No examinations match the selected filters."
          : "You have not completed an examination yet. Your results will appear here after your first submission.";

        container.appendChild(message);
      }

      return;
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    filtered.forEach(function (attempt) {
      container.appendChild(createAttemptCard(attempt));
    });
  }

  /* -----------------------------------------
     REFRESH
  ----------------------------------------- */

  function refresh() {
    allAttempts = loadAttempts();
    populateSubjectFilter();
    renderHistory();
  }

  function initialize() {
    allAttempts = loadAttempts();
    populateSubjectFilter();
    initializeFilters();
    renderHistory();

    const refreshButton = $("[data-history-refresh]");

    if (refreshButton) {
      refreshButton.addEventListener("click", function () {
        refresh();
        showMessage("History refreshed.");
      });
    }
  }

  function showMessage(message) {
    const element = $("[data-history-message]");

    if (element) {
      element.textContent = message;
      element.hidden = false;
      element.setAttribute("role", "status");
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);

  window.HECHistory = Object.freeze({
    loadAttempts: loadAttempts,
    getFilteredAttempts: getFilteredAttempts,
    renderHistory: renderHistory,
    refresh: refresh
  });
})();
