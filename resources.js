// resources.js: Add JavaScript logic or question data here later.

/* =========================================
   HABESHA EXAM CENTER
   File: resources.js
   Purpose: Learning resources manager
   Features:
   - Short notes
   - Textbooks and download links
   - Educational videos
   - Search and filters
   - Grade, region, stream and subject filters
   - Clear unavailable-resource notices
========================================= */

(function () {
  "use strict";

  const CONFIG = {
    pageTitle: "Learning Resources",
    comingSoonMessage:
      "These learning resources will be uploaded soon. Please check back later."
  };

  let resources = [];
  let activeCategory = "all";
  let searchTerm = "";

  /* -----------------------------------------
     UTILITIES
  ----------------------------------------- */

  function $(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function $all(selector, parent) {
    return Array.from(
      (parent || document).querySelectorAll(selector)
    );
  }

  function getText(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalize(value) {
    return getText(value).toLowerCase();
  }

  function safeURL(value) {
    try {
      const url = new URL(value, window.location.href);

      if (
        url.protocol === "https:" ||
        url.protocol === "http:"
      ) {
        return url.href;
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function showMessage(message, type) {
    const element = $("[data-resources-message]");

    if (element) {
      element.textContent = message;
      element.hidden = false;
      element.dataset.messageType = type || "info";
      element.setAttribute("role", "status");
    }
  }

  function hideMessage() {
    const element = $("[data-resources-message]");

    if (element) {
      element.hidden = true;
      element.textContent = "";
    }
  }

  /* -----------------------------------------
     RESOURCE CATEGORIES
  ----------------------------------------- */

  const CATEGORIES = Object.freeze({
    notes: "Short notes",
    textbooks: "Textbooks",
    videos: "Educational videos",
    links: "Other learning resources"
  });

  function normalizeCategory(category) {
    const value = normalize(category);

    if (
      value === "note" ||
      value === "notes" ||
      value === "short notes"
    ) {
      return "notes";
    }

    if (
      value === "book" ||
      value === "books" ||
      value === "textbook" ||
      value === "textbooks"
    ) {
      return "textbooks";
    }

    if (
      value === "video" ||
      value === "videos" ||
      value === "educational videos"
    ) {
      return "videos";
    }

    return "links";
  }

  /* -----------------------------------------
     RESOURCE DATA
     
     Resources are intentionally empty until
     the owner uploads verified materials.
     
     Add resources using setResources() or
     the example structure documented below.
  ----------------------------------------- */

  function normalizeResource(resource, index) {
    if (!resource || typeof resource !== "object") {
      return null;
    }

    const title = getText(resource.title);

    if (!title) {
      return null;
    }

    return {
      id: getText(resource.id) || "resource-" + index,
      title: title,
      description: getText(resource.description),
      category: normalizeCategory(resource.category),
      grade: getText(resource.grade),
      region: getText(resource.region),
      stream: getText(resource.stream),
      subject: getText(resource.subject),
      language: getText(resource.language || "English"),
      url: safeURL(getText(resource.url)),
      source: getText(resource.source),
      uploadedAt: getText(resource.uploadedAt)
    };
  }

  function setResources(items) {
    if (!Array.isArray(items)) {
      showMessage(
        "Resources could not be loaded because the data format is invalid.",
        "error"
      );

      return false;
    }

    resources = items
      .map(normalizeResource)
      .filter(Boolean);

    render();

    return true;
  }

  function getResources() {
    return resources.slice();
  }

  /* -----------------------------------------
     CURRENT STUDENT SELECTION
  ----------------------------------------- */

  function getCurrentSelection() {
    if (
      window.HECStorage &&
      typeof window.HECStorage.getCurrentSelection === "function"
    ) {
      return window.HECStorage.getCurrentSelection() || {};
    }

    return {};
  }

  function matchesStudentSelection(resource) {
    const selection = getCurrentSelection();

    const grade = getText(selection.grade);
    const region = getText(selection.region);
    const stream = getText(selection.stream);
    const subject = getText(selection.subject);

    if (resource.grade && grade &&
        resource.grade !== grade) {
      return false;
    }

    if (resource.region && region &&
        normalize(resource.region) !== normalize(region)) {
      return false;
    }

    if (resource.stream && stream &&
        normalize(resource.stream) !== normalize(stream)) {
      return false;
    }

    if (resource.subject && subject &&
        normalize(resource.subject) !== normalize(subject)) {
      return false;
    }

    return true;
  }

  /* -----------------------------------------
     SEARCH AND FILTERING
  ----------------------------------------- */

  function getFilteredResources() {
    return resources.filter(function (resource) {
      if (!matchesStudentSelection(resource)) {
        return false;
      }

      if (
        activeCategory !== "all" &&
        resource.category !== activeCategory
      ) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const searchableText = [
        resource.title,
        resource.description,
        resource.subject,
        resource.category,
        resource.grade,
        resource.region,
        resource.stream,
        resource.language,
        resource.source
      ].join(" ").toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }

  function initializeSearch() {
    const searchInput = $("[data-resources-search]");

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        searchTerm = normalize(searchInput.value);
        render();
      });
    }

    const categoryControls = $all(
      "[data-resource-category]"
    );

    categoryControls.forEach(function (control) {
      control.addEventListener("click", function () {
        const category = normalize(
          control.dataset.resourceCategory || "all"
        );

        activeCategory =
          category === "all" || CATEGORIES[category]
            ? category
            : "all";

        categoryControls.forEach(function (item) {
          const active =
            normalize(item.dataset.resourceCategory || "all") ===
            activeCategory;

          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        render();
      });
    });
  }

  /* -----------------------------------------
     RESOURCE CARD
  ----------------------------------------- */

  function createResourceCard(resource) {
    const article = document.createElement("article");

    article.className = "resource-card";
    article.dataset.resourceId = resource.id;

    const heading = document.createElement("h3");
    heading.textContent = resource.title;

    const category = document.createElement("p");
    category.className = "resource-category";
    category.textContent = CATEGORIES[resource.category];

    article.append(heading, category);

    if (resource.description) {
      const description = document.createElement("p");
      description.className = "resource-description";
      description.textContent = resource.description;
      article.appendChild(description);
    }

    const details = [];

    if (resource.grade) {
      details.push("Grade " + resource.grade);
    }

    if (resource.subject) {
      details.push(resource.subject);
    }

    if (resource.language) {
      details.push(resource.language);
    }

    if (details.length) {
      const metadata = document.createElement("p");
      metadata.className = "resource-metadata";
      metadata.textContent = details.join(" · ");
      article.appendChild(metadata);
    }

    if (resource.source) {
      const source = document.createElement("p");
      source.className = "resource-source";
      source.textContent = "Source: " + resource.source;
      article.appendChild(source);
    }

    if (resource.url) {
      const link = document.createElement("a");

      link.href = resource.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      link.textContent =
        resource.category === "videos"
          ? "Watch video"
          : resource.category === "textbooks"
            ? "Open textbook"
            : "Open resource";

      article.appendChild(link);
    } else {
      const unavailable = document.createElement("p");

      unavailable.className = "resource-unavailable";
      unavailable.textContent =
        "This resource will be available soon.";

      article.appendChild(unavailable);
    }

    return article;
  }

  /* -----------------------------------------
     EMPTY STATE
  ----------------------------------------- */

  function renderEmptyState(container) {
    const empty = document.createElement("section");
    empty.className = "resources-empty-state";

    const heading = document.createElement("h3");
    heading.textContent = "Resources coming soon";

    const paragraph = document.createElement("p");
    paragraph.textContent = searchTerm
      ? "No resources match your search. Try another keyword or category."
      : CONFIG.comingSoonMessage;

    empty.append(heading, paragraph);
    container.appendChild(empty);
  }

  /* -----------------------------------------
     RENDER RESOURCES
  ----------------------------------------- */

  function render() {
    const container = $("[data-resources-list]");
    const countElement = $("[data-resources-count]");

    const filtered = getFilteredResources();

    if (countElement) {
      countElement.textContent = String(filtered.length);
    }

    if (!container) {
      return;
    }

    container.replaceChildren();

    if (filtered.length === 0) {
      renderEmptyState(container);
      return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(function (resource) {
      fragment.appendChild(createResourceCard(resource));
    });

    container.appendChild(fragment);
    hideMessage();
  }

  /* -----------------------------------------
     REFRESH
  ----------------------------------------- */

  function refresh() {
    render();
    showMessage("Learning resources refreshed.", "success");
  }

  /* -----------------------------------------
     INITIALIZATION
  ----------------------------------------- */

  function initialize() {
    initializeSearch();

    const refreshButton = $("[data-resources-refresh]");

    if (refreshButton) {
      refreshButton.addEventListener("click", refresh);
    }

    const title = $("[data-resources-title]");

    if (title) {
      title.textContent = CONFIG.pageTitle;
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", initialize);

  /* -----------------------------------------
     PUBLIC API
  ----------------------------------------- */

  window.HECResources = Object.freeze({
    getResources: getResources,
    setResources: setResources,
    getFilteredResources: getFilteredResources,
    refresh: refresh,
    categories: CATEGORIES
  });

})();
