// planner.js: Add JavaScript logic or question data here later.

/* =========================================
   HABESHA EXAM CENTER
   File: planner.js
   Purpose: Student study planner
   Storage: Browser localStorage
========================================= */

(function () {
  "use strict";

  const STORAGE_PREFIX = "hec_study_planner_";

  let tasks = [];
  let filter = "all";
  let searchTerm = "";
  let editingId = null;
  let initialized = false;

  /* -----------------------------------------
     UTILITIES
  ----------------------------------------- */

  function $(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function createId() {
    return "task_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 9);
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);

      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.error("Planner storage read failed:", error);
      return fallback;
    }
  }

  function getUserId() {
    if (
      window.HECStorage &&
      typeof window.HECStorage.getCurrentUserId === "function"
    ) {
      return window.HECStorage.getCurrentUserId();
    }

    return localStorage.getItem("hec_current_user") || "";
  }

  function getStorageKey() {
    const userId = getUserId();

    return userId ? STORAGE_PREFIX + userId : "";
  }

  function showMessage(message, type) {
    const element = $("[data-planner-message]");

    if (!element) return;

    element.textContent = message;
    element.dataset.messageType = type || "info";
    element.hidden = false;
    element.setAttribute("role", "status");
  }

  function hideMessage() {
    const element = $("[data-planner-message]");

    if (element) {
      element.textContent = "";
      element.hidden = true;
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return "No due date";

    const date = new Date(dateValue + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  }

  function todayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
  }

  /* -----------------------------------------
     LOAD AND SAVE
  ----------------------------------------- */

  function loadTasks() {
    const key = getStorageKey();

    if (!key) {
      tasks = [];
      showMessage("Please sign in to use your study planner.", "error");
      return false;
    }

    const stored = readJSON(key, []);

    if (!Array.isArray(stored)) {
      tasks = [];
      showMessage(
        "Your saved planner data could not be read.",
        "error"
      );
      return false;
    }

    tasks = stored.filter(function (task) {
      return task &&
        typeof task.id === "string" &&
        typeof task.title === "string";
    });

    return true;
  }

  function saveTasks() {
    const key = getStorageKey();

    if (!key) {
      showMessage("Please sign in before saving tasks.", "error");
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error("Planner storage write failed:", error);

      showMessage(
        "Could not save your tasks. Your browser storage may be full.",
        "error"
      );

      return false;
    }
  }

  /* -----------------------------------------
     FILTERS
  ----------------------------------------- */

  function getFilteredTasks() {
    const query = searchTerm.toLowerCase();
    const today = todayString();

    return tasks.filter(function (task) {
      const matchesSearch = [
        task.title,
        task.subject,
        task.description
      ].join(" ").toLowerCase().includes(query);

      let matchesFilter = true;

      if (filter === "pending") {
        matchesFilter = !task.completed;
      } else if (filter === "completed") {
        matchesFilter = Boolean(task.completed);
      } else if (filter === "today") {
        matchesFilter =
          task.dueDate === today && !task.completed;
      } else if (filter === "overdue") {
        matchesFilter =
          Boolean(task.dueDate) &&
          task.dueDate < today &&
          !task.completed;
      }

      return matchesSearch && matchesFilter;
    }).sort(function (a, b) {
      if (a.completed !== b.completed) {
        return Number(a.completed) - Number(b.completed);
      }

      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return a.dueDate.localeCompare(b.dueDate);
    });
  }

  /* -----------------------------------------
     SUMMARY
  ----------------------------------------- */

  function updateSummary() {
    const total = tasks.length;
    const completed = tasks.filter(function (task) {
      return task.completed;
    }).length;

    const pending = total - completed;
    const overdue = tasks.filter(function (task) {
      return !task.completed &&
        task.dueDate &&
        task.dueDate < todayString();
    }).length;

    const stats = {
      "[data-planner-total]": total,
      "[data-planner-completed]": completed,
      "[data-planner-pending]": pending,
      "[data-planner-overdue]": overdue
    };

    Object.keys(stats).forEach(function (selector) {
      const element = $(selector);

      if (element) {
        element.textContent = String(stats[selector]);
      }
    });

    const percentage = total
      ? Math.round(completed / total * 100)
      : 0;

    const progress = $("[data-planner-progress]");

    if (progress) {
      if ("value" in progress) {
        progress.value = percentage;
      } else {
        progress.style.width = percentage + "%";
      }

      progress.setAttribute("aria-valuenow", String(percentage));
    }

    const progressText = $("[data-planner-progress-text]");

    if (progressText) {
      progressText.textContent =
        percentage + "% of your study tasks completed";
    }
  }

  /* -----------------------------------------
     TASK FORM
  ----------------------------------------- */

  function resetForm() {
    const form = $("[data-planner-form]");

    if (form) form.reset();

    editingId = null;

    const heading = $("[data-planner-form-title]");
    const submit = $("[data-planner-submit]");
    const cancel = $("[data-planner-cancel]");

    if (heading) heading.textContent = "Add a study task";
    if (submit) submit.textContent = "Add task";
    if (cancel) cancel.hidden = true;
  }

  function editTask(id) {
    const task = tasks.find(function (item) {
      return item.id === id;
    });

    if (!task) return;

    const form = $("[data-planner-form]");
    if (!form) {
      showMessage("The planner form is missing from planner.html.", "error");
      return;
    }

    const title = $("[name='title']", form);
    const subject = $("[name='subject']", form);
    const dueDate = $("[name='dueDate']", form);
    const description = $("[name='description']", form);

    if (title) title.value = task.title;
    if (subject) subject.value = task.subject || "";
    if (dueDate) dueDate.value = task.dueDate || "";
    if (description) description.value = task.description || "";

    editingId = id;

    const heading = $("[data-planner-form-title]");
    const submit = $("[data-planner-submit]");
    const cancel = $("[data-planner-cancel]");

    if (heading) heading.textContent = "Edit study task";
    if (submit) submit.textContent = "Save changes";
    if (cancel) cancel.hidden = false;

    if (title) title.focus();
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const title = text($("[name='title']", form)?.value);
    const subject = text($("[name='subject']", form)?.value);
    const dueDate = text($("[name='dueDate']", form)?.value);
    const description = text(
      $("[name='description']", form)?.value
    );

    if (!title) {
      showMessage("Enter a title for your study task.", "error");
      return;
    }

    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      showMessage("Choose a valid due date.", "error");
      return;
    }

    const previousTasks = JSON.stringify(tasks);

    if (editingId) {
      const task = tasks.find(function (item) {
        return item.id === editingId;
      });

      if (!task) {
        showMessage("The task could not be found.", "error");
        return;
      }

      task.title = title;
      task.subject = subject;
      task.dueDate = dueDate;
      task.description = description;
      task.updatedAt = new Date().toISOString();
    } else {
      tasks.push({
        id: createId(),
        title: title,
        subject: subject,
        dueDate: dueDate,
        description: description,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: ""
      });
    }

    if (!saveTasks()) {
      tasks = JSON.parse(previousTasks);
      return;
    }

    resetForm();
    render();
    showMessage(
      editingId ? "Task updated." : "Study task saved.",
      "success"
    );
  }

  /* -----------------------------------------
     COMPLETE OR REOPEN TASK
  ----------------------------------------- */

  function toggleTask(id) {
    const task = tasks.find(function (item) {
      return item.id === id;
    });

    if (!task) return;

    const oldValue = task.completed;
    task.completed = !task.completed;

    if (!saveTasks()) {
      task.completed = oldValue;
      return;
    }

    render();

    showMessage(
      task.completed
        ? "Task marked as completed."
        : "Task moved back to pending.",
      "success"
    );
  }

  /* -----------------------------------------
     DELETE TASK
  ----------------------------------------- */

  function deleteTask(id) {
    const task = tasks.find(function (item) {
      return item.id === id;
    });

    if (!task) return;

    if (!window.confirm("Delete this study task?")) {
      return;
    }

    const previousTasks = tasks.slice();

    tasks = tasks.filter(function (item) {
      return item.id !== id;
    });

    if (!saveTasks()) {
      tasks = previousTasks;
      return;
    }

    render();
    showMessage("Study task deleted.", "success");
  }

  /* -----------------------------------------
     RENDER TASK LIST
  ----------------------------------------- */

  function makeButton(label, action, id, className) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.dataset.plannerAction = action;
    button.dataset.taskId = id;
    button.className = className || "";

    return button;
  }

  function render() {
    const container = $("[data-planner-list]");

    updateSummary();

    if (!container) return;

    container.replaceChildren();

    const filtered = getFilteredTasks();

    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "planner-empty";

      empty.textContent = tasks.length
        ? "No tasks match your current filter."
        : "Your study plan is empty. Add a task to get started.";

      container.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(function (task) {
      const article = document.createElement("article");
      article.className = "planner-task";
      article.classList.toggle("completed", Boolean(task.completed));

      const heading = document.createElement("h3");
      heading.textContent = task.title;

      const metadata = document.createElement("p");
      metadata.textContent = [
        task.subject || "General study",
        task.dueDate ? "Due: " + formatDate(task.dueDate) : "No due date",
        task.completed ? "Completed" : "Pending"
      ].join(" · ");

      article.append(heading, metadata);

      if (task.description) {
        const description = document.createElement("p");
        description.textContent = task.description;
        article.appendChild(description);
      }

      const actions = document.createElement("div");
      actions.className = "planner-task-actions";

      actions.append(
        makeButton(
          task.completed ? "Reopen" : "Mark complete",
          "toggle",
          task.id
        ),
        makeButton("Edit", "edit", task.id),
        makeButton("Delete", "delete", task.id)
      );

      article.appendChild(actions);
      fragment.appendChild(article);
    });

    container.appendChild(fragment);
  }

  /* -----------------------------------------
     EVENT HANDLERS
  ----------------------------------------- */

  function initialize() {
    if (initialized) return;
    initialized = true;

    loadTasks();

    const form = $("[data-planner-form]");

    if (form) {
      form.addEventListener("submit", handleFormSubmit);
    }

    const cancel = $("[data-planner-cancel]");

    if (cancel) {
      cancel.addEventListener("click", resetForm);
    }

    const search = $("[data-planner-search]");

    if (search) {
      search.addEventListener("input", function () {
        searchTerm = text(search.value).toLowerCase();
        render();
      });
    }

    const filterSelect = $("[data-planner-filter]");

    if (filterSelect) {
      filterSelect.addEventListener("change", function () {
        filter = filterSelect.value || "all";
        render();
      });
    }

    const list = $("[data-planner-list]");

    if (list) {
      list.addEventListener("click", function (event) {
        const button = event.target.closest("[data-planner-action]");

        if (!button || !list.contains(button)) return;

        const id = button.dataset.taskId;

        switch (button.dataset.plannerAction) {
          case "toggle":
            toggleTask(id);
            break;

          case "edit":
            editTask(id);
            break;

          case "delete":
            deleteTask(id);
            break;
        }
      });
    }

    render();
  }

  /* -----------------------------------------
     PUBLIC API
  ----------------------------------------- */

  window.HECPlanner = Object.freeze({
    reload: function () {
      loadTasks();
      render();
    },

    getTasks: function () {
      return tasks.map(function (task) {
        return Object.assign({}, task);
      });
    },

    render: render
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
