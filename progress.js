// progress.js: Add JavaScript logic or question data here later.

/* =========================================
   HABESHA EXAM CENTER
   File: progress.js
   Purpose: Student learning progress dashboard
========================================= */

(function () {
  "use strict";

  let attempts = [];

  /* -----------------------------------------
     UTILITIES
  ----------------------------------------- */

  function $(selector) {
    return document.querySelector(selector);
  }

  function formatPercent(value) {
    return (Number(value) || 0).toFixed(1) + "%";
  }

  function normalizeAttempt(attempt) {
    const total = Number(
      attempt.totalQuestions ?? attempt.total ?? 0
    );

    const correct = Number(attempt.correct ?? 0);

    const percentage = Number.isFinite(Number(attempt.percentage))
      ? Number(attempt.percentage)
      : total > 0
        ? correct / total * 100
        : 0;

    return {
      id: String(attempt.id || ""),
      grade: String(attempt.grade || ""),
      region: String(attempt.region || ""),
      stream: String(attempt.stream || ""),
      subject: String(attempt.subject || "unknown"),
      subjectTitle: String(
        attempt.subjectTitle || attempt.subject || "Other"
      ),
      examType: attempt.examType === "mock" ? "mock" : "practice",
      startedAt: attempt.startedAt || "",
      completedAt: attempt.completedAt || "",
      totalQuestions: total,
      correct: correct,
      incorrect: Number(attempt.incorrect ?? 0),
      unanswered: Number(attempt.unanswered ?? 0),
      percentage: percentage
    };
  }

  /* -----------------------------------------
     LOAD SAVED HISTORY
  ----------------------------------------- */

  function loadAttempts() {
    if (
      !window.HECStorage ||
      typeof window.HECStorage.getExamHistory !== "function"
    ) {
      console.error(
        "Progress unavailable: load storage.js before progress.js."
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
        return new Date(a.completedAt || a.startedAt || 0) -
          new Date(b.completedAt || b.startedAt || 0);
      });
  }

  /* -----------------------------------------
     OVERALL STATISTICS
  ----------------------------------------- */

  function calculateOverallProgress(data) {
    const totalExams = data.length;

    const totalQuestions = data.reduce(function (sum, attempt) {
      return sum + attempt.totalQuestions;
    }, 0);

    const totalCorrect = data.reduce(function (sum, attempt) {
      return sum + attempt.correct;
    }, 0);

    const totalAnswered = data.reduce(function (sum, attempt) {
      return sum + attempt.correct + attempt.incorrect;
    }, 0);

    const average = totalExams
      ? data.reduce(function (sum, attempt) {
          return sum + attempt.percentage;
        }, 0) / totalExams
      : 0;

    const highest = totalExams
      ? Math.max.apply(
          null,
          data.map(function (attempt) {
            return attempt.percentage;
          })
        )
      : 0;

    return {
      totalExams: totalExams,
      totalQuestions: totalQuestions,
      totalCorrect: totalCorrect,
      totalAnswered: totalAnswered,
      average: average,
      highest: highest
    };
  }

  function renderOverallProgress(summary) {
    const fields = {
      "[data-progress-total-exams]": summary.totalExams,
      "[data-progress-total-questions]": summary.totalQuestions,
      "[data-progress-total-correct]": summary.totalCorrect,
      "[data-progress-average]": formatPercent(summary.average),
      "[data-progress-highest]": formatPercent(summary.highest)
    };

    Object.keys(fields).forEach(function (selector) {
      const element = $(selector);

      if (element) {
        element.textContent = String(fields[selector]);
      }
    });
  }

  /* -----------------------------------------
     SUBJECT PERFORMANCE
  ----------------------------------------- */

  function calculateSubjectProgress(data) {
    const groups = {};

    data.forEach(function (attempt) {
      const key = attempt.subject;

      if (!groups[key]) {
        groups[key] = {
          subject: key,
          title: attempt.subjectTitle,
          attempts: 0,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
          totalQuestions: 0,
          scoreTotal: 0,
          highest: 0,
          latestScore: 0,
          latestDate: ""
        };
      }

      const group = groups[key];

      group.attempts++;
      group.correct += attempt.correct;
      group.incorrect += attempt.incorrect;
      group.unanswered += attempt.unanswered;
      group.totalQuestions += attempt.totalQuestions;
      group.scoreTotal += attempt.percentage;
      group.highest = Math.max(group.highest, attempt.percentage);
      group.latestScore = attempt.percentage;
      group.latestDate = attempt.completedAt || attempt.startedAt;
    });

    return Object.values(groups)
      .map(function (group) {
        group.average = group.attempts
          ? group.scoreTotal / group.attempts
          : 0;

        return group;
      })
      .sort(function (a, b) {
        return a.title.localeCompare(b.title);
      });
  }

  function renderSubjectProgress(subjects) {
    const container = $("[data-progress-subjects]");

    if (!container) {
      return;
    }

    container.replaceChildren();

    if (subjects.length === 0) {
      const message = document.createElement("p");

      message.textContent =
        "Your subject performance will appear after you complete an examination.";

      container.appendChild(message);
      return;
    }

    subjects.forEach(function (subject) {
      const article = document.createElement("article");
      article.className = "progress-subject-card";

      const heading = document.createElement("h3");
      heading.textContent = subject.title;

      const average = document.createElement("p");
      average.textContent =
        "Average score: " + formatPercent(subject.average);

      const bar = document.createElement("div");
      bar.className = "progress-bar";

      const fill = document.createElement("div");
      fill.className = "progress-bar-fill";

      fill.style.width =
        Math.max(0, Math.min(100, subject.average)) + "%";

      fill.setAttribute("role", "progressbar");
      fill.setAttribute("aria-valuemin", "0");
      fill.setAttribute("aria-valuemax", "100");
      fill.setAttribute(
        "aria-valuenow",
        String(Math.round(subject.average))
      );
      fill.setAttribute(
        "aria-label",
        subject.title + " average score"
      );

      bar.appendChild(fill);

      const highest = document.createElement("p");
      highest.textContent =
        "Best score: " + formatPercent(subject.highest);

      const count = document.createElement("p");
      count.textContent =
        "Completed exams: " + subject.attempts;

      const latest = document.createElement("p");
      latest.textContent =
        "Latest score: " + formatPercent(subject.latestScore);

      const latestDate = document.createElement("p");
      latestDate.textContent =
        "Latest attempt: " +
        formatDate(subject.latestDate);

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "View exam history";

      button.addEventListener("click", function () {
        const url = new URL("history.html", window.location.href);
        url.searchParams.set("subject", subject.subject);
        window.location.href = url.href;
      });

      article.append(
        heading,
        average,
        bar,
        highest,
        count,
        latest,
        latestDate,
        button
      );

      container.appendChild(article);
    });
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
      day: "numeric"
    }).format(date);
  }

  /* -----------------------------------------
     PRACTICE VS MOCK
  ----------------------------------------- */

  function calculateExamTypeProgress(data) {
    const result = {
      practice: {
        attempts: 0,
        scoreTotal: 0,
        average: 0
      },
      mock: {
        attempts: 0,
        scoreTotal: 0,
        average: 0
      }
    };

    data.forEach(function (attempt) {
      const type = attempt.examType === "mock"
        ? "mock"
        : "practice";

      result[type].attempts++;
      result[type].scoreTotal += attempt.percentage;
    });

    ["practice", "mock"].forEach(function (type) {
      const group = result[type];

      group.average = group.attempts
        ? group.scoreTotal / group.attempts
        : 0;
    });

    return result;
  }

  function renderExamTypeProgress(summary) {
    const elements = {
      "[data-progress-practice-count]": summary.practice.attempts,
      "[data-progress-practice-average]":
        formatPercent(summary.practice.average),
      "[data-progress-mock-count]": summary.mock.attempts,
      "[data-progress-mock-average]":
        formatPercent(summary.mock.average)
    };

    Object.keys(elements).forEach(function (selector) {
      const element = $(selector);

      if (element) {
        element.textContent = String(elements[selector]);
      }
    });
  }

  /* -----------------------------------------
     RECENT PERFORMANCE TREND
  ----------------------------------------- */

  function calculateRecentTrend(data) {
    const recent = data.slice(-3);
    const previous = data.slice(-6, -3);

    function average(items) {
      if (items.length === 0) {
        return null;
      }

      return items.reduce(function (sum, attempt) {
        return sum + attempt.percentage;
      }, 0) / items.length;
    }

    const recentAverage = average(recent);
    const previousAverage = average(previous);

    return {
      recentAverage: recentAverage,
      previousAverage: previousAverage,
      change:
        recentAverage !== null && previousAverage !== null
          ? recentAverage - previousAverage
          : null
    };
  }

  function renderRecentTrend(trend) {
    const score = $("[data-progress-recent-average]");
    const change = $("[data-progress-trend-change]");
    const message = $("[data-progress-trend-message]");

    if (score) {
      score.textContent = trend.recentAverage === null
        ? "Not enough data"
        : formatPercent(trend.recentAverage);
    }

    if (change) {
      if (trend.change === null) {
        change.textContent =
          "Complete more exams to compare performance.";
      } else {
        const sign = trend.change > 0 ? "+" : "";

        change.textContent =
          sign + trend.change.toFixed(1) + " percentage points";
      }
    }

    if (message) {
      if (trend.change === null) {
        message.textContent =
          "A comparison will appear after enough exam results are saved.";
      } else if (trend.change > 0) {
        message.textContent =
          "Your average has improved across your latest three attempts.";
      } else if (trend.change < 0) {
        message.textContent =
          "Your latest average is lower. Review the questions you missed.";
      } else {
        message.textContent =
          "Your latest average is unchanged compared with the previous three attempts.";
      }
    }
  }

  /* -----------------------------------------
     MESSAGES
  ----------------------------------------- */

  function showMessage(message) {
    const element = $("[data-progress-message]");

    if (element) {
      element.textContent = message;
      element.hidden = false;
      element.setAttribute("role", "status");
    }
  }

  /* -----------------------------------------
     REFRESH PROGRESS
  ----------------------------------------- */

  function refreshProgress() {
    attempts = loadAttempts();

    const overall = calculateOverallProgress(attempts);
    const subjects = calculateSubjectProgress(attempts);
    const examTypes = calculateExamTypeProgress(attempts);
    const trend = calculateRecentTrend(attempts);

    renderOverallProgress(overall);
    renderSubjectProgress(subjects);
    renderExamTypeProgress(examTypes);
    renderRecentTrend(trend);

    if (attempts.length === 0) {
      showMessage(
        "No completed examinations have been saved yet. Your progress will appear here after your first exam."
      );
    }

    return {
      overall: overall,
      subjects: subjects,
      examTypes: examTypes,
      trend: trend
    };
  }

  function initialize() {
    refreshProgress();

    const refreshButton = $("[data-progress-refresh]");

    if (refreshButton) {
      refreshButton.addEventListener("click", function () {
        refreshProgress();
        showMessage("Progress updated.");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);

  window.HECProgress = Object.freeze({
    loadAttempts: loadAttempts,
    calculateOverallProgress: calculateOverallProgress,
    calculateSubjectProgress: calculateSubjectProgress,
    calculateExamTypeProgress: calculateExamTypeProgress,
    calculateRecentTrend: calculateRecentTrend,
    refresh: refreshProgress
  });
})();
