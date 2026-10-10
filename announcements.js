// announcements.js: Add JavaScript logic or question data here later.

/* =========================================
   HABESHA EXAM CENTER
   File: announcements.js
   Purpose: Announcements and notices
========================================= */

(function () {
  "use strict";

  /*
    Add a real announcement by adding an object to ANNOUNCEMENTS.
    Use an ISO date: YYYY-MM-DD.
    Do not announce an exam date until it is confirmed.
  */

  const ANNOUNCEMENTS = [
    {
      id: "welcome",
      title: "Welcome to Habesha Exam Center",
      message:
        "Choose your grade and curriculum to explore available subjects and learning resources.",
      category: "general",
      date: "2026-10-10",
      status: "published",
      priority: 1
    },
    {
      id: "learning-materials",
      title: "Learning Materials",
      message:
        "Short notes, revision resources, and educational video links will be added as they become available.",
      category: "resources",
      date: "2026-10-10",
      status: "published",
      priority: 2
    },
    {
      id: "exam-questions",
      title: "Practice Questions",
      message:
        "Examination question banks are being prepared. A subject will show a coming-soon message until its questions are available.",
      category: "examinations",
      date: "2026-10-10",
      status: "published",
      priority: 3
    }
  ];

  const VALID_CATEGORIES = [
    "general",
    "resources",
    "examinations",
    "events",
    "maintenance"
  ];

  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
      return null;
    }

    const date = new Date(value + "T00:00:00Z");

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    if (date.toISOString().slice(0, 10) !== value) {
      return null;
    }

    return date;
  }

  function getAll(options) {
    options = options || {};

    const includeExpired = options.includeExpired === true;
    const category = String(options.category || "").toLowerCase();

    return ANNOUNCEMENTS
      .filter(function (item) {
        if (item.status !== "published") return false;

        if (
          category &&
          item.category !== category
        ) {
          return false;
        }

        if (!includeExpired) {
          const date = parseDate(item.date);

          if (!date) return false;

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (date.getTime() > today.getTime()) return false;
        }

        return true;
      })
      .sort(function (a, b) {
        return (a.priority || 99) - (b.priority || 99);
      })
      .map(function (item) {
        return Object.assign({}, item);
      });
  }

  function getById(id) {
    const item = ANNOUNCEMENTS.find(function (announcement) {
      return announcement.id === id;
    });

    return item ? Object.assign({}, item) : null;
  }

  function formatDate(value) {
    const date = parseDate(value);

    if (!date) return "Date unavailable";

    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    }).format(date);
  }

  function render(container, options) {
    if (typeof container === "string") {
      container = document.querySelector(container);
    }

    if (!container) return;

    const announcements = getAll(options);
    container.replaceChildren();

    if (!announcements.length) {
      const empty = document.createElement("p");
      empty.className = "announcement-empty";
      empty.textContent = "There are no announcements at the moment.";
      container.appendChild(empty);
      return;
    }

    announcements.forEach(function (item) {
      const article = document.createElement("article");
      article.className = "announcement-card";
      article.dataset.announcementId = item.id;

      const heading = document.createElement("h3");
      heading.textContent = item.title;

      const message = document.createElement("p");
      message.textContent = item.message;

      const metadata = document.createElement("p");
      metadata.className = "announcement-date";
      metadata.textContent =
        formatDate(item.date) + " · " +
        item.category.charAt(0).toUpperCase() +
        item.category.slice(1);

      article.append(heading, message, metadata);
      container.appendChild(article);
    });
  }

  function addAnnouncement(announcement) {
    if (!announcement || typeof announcement !== "object") {
      return {
        success: false,
        message: "A valid announcement is required."
      };
    }

    const id = String(announcement.id || "").trim();
    const title = String(announcement.title || "").trim();
    const message = String(announcement.message || "").trim();
    const category = String(
      announcement.category || "general"
    ).toLowerCase();
    const date = String(announcement.date || "");
    const priority = Number(announcement.priority || 99);

    if (!id || !title || !message || !parseDate(date)) {
      return {
        success: false,
        message: "Provide an ID, title, message, and valid date."
      };
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return {
        success: false,
        message: "Choose a valid announcement category."
      };
    }

    if (
      ANNOUNCEMENTS.some(function (item) {
        return item.id === id;
      })
    ) {
      return {
        success: false,
        message: "An announcement with this ID already exists."
      };
    }

    const newAnnouncement = {
      id: id,
      title: title,
      message: message,
      category: category,
      date: date,
      status: "published",
      priority: Number.isFinite(priority) ? priority : 99
    };

    ANNOUNCEMENTS.push(newAnnouncement);

    document.dispatchEvent(new CustomEvent("hec:announcements-updated"));

    return {
      success: true,
      announcement: Object.assign({}, newAnnouncement)
    };
  }

  function initialize() {
    document.querySelectorAll("[data-announcements]").forEach(
      function (container) {
        render(container, {
          category: container.dataset.category || ""
        });
      }
    );
  }

  window.HECAnnouncements = Object.freeze({
    getAll: getAll,
    getById: getById,
    formatDate: formatDate,
    render: render,
    addAnnouncement: addAnnouncement,
    initialize: initialize
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

  document.addEventListener("hec:announcements-updated", initialize);
})();
