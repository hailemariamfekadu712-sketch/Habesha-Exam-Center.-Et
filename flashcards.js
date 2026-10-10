// flashcards.js: Add JavaScript logic or question data here later.

/* =========================================
   HABESHA EXAM CENTER
   File: flashcards.js
   Purpose: Student flashcard study system
   Storage: HECStorage
========================================= */

(function () {
  "use strict";

  const state = {
    cards: [],
    filteredCards: [],
    currentIndex: 0,
    showAnswer: false,
    filter: "all",
    search: "",
    editingId: null
  };

  /* -----------------------------------------
     UTILITIES
  ----------------------------------------- */

  function $(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function createId() {
    return "flashcard_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 9);
  }

  function normalizeText(value) {
    return String(value == null ? "" : value).trim();
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      function (character) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[character];
      }
    );
  }

  function showMessage(message, type) {
    const element = $("[data-flashcards-message]");

    if (!element) return;

    element.textContent = message;
    element.dataset.messageType = type || "info";
    element.hidden = false;
    element.setAttribute("role", "status");
  }

  function hideMessage() {
    const element = $("[data-flashcards-message]");

    if (element) {
      element.hidden = true;
      element.textContent = "";
    }
  }

  /* -----------------------------------------
     STORAGE CONNECTION
  ----------------------------------------- */

  function loadCards() {
    if (
      !window.HECStorage ||
      typeof window.HECStorage.getFlashcards !== "function"
    ) {
      state.cards = [];
      showMessage(
        "Flashcard storage is unavailable. Load storage.js first.",
        "error"
      );
      return;
    }

    const saved = window.HECStorage.getFlashcards();

    state.cards = Array.isArray(saved)
      ? saved.filter(function (card) {
          return card &&
            typeof card === "object" &&
            card.id &&
            typeof card.front === "string" &&
            typeof card.back === "string";
        }).map(function (card) {
          return {
            id: String(card.id),
            front: card.front,
            back: card.back,
            subject: normalizeText(card.subject),
            grade: normalizeText(card.grade),
            known: Boolean(card.known),
            createdAt: card.createdAt || new Date().toISOString(),
            updatedAt: card.updatedAt || ""
          };
        })
      : [];
  }

  function saveCards() {
    if (
      !window.HECStorage ||
      typeof window.HECStorage.saveFlashcards !== "function"
    ) {
      showMessage("Flashcard storage is unavailable.", "error");
      return false;
    }

    const success = window.HECStorage.saveFlashcards(state.cards);

    if (!success) {
      showMessage(
        "Could not save your flashcards on this device.",
        "error"
      );
      return false;
    }

    return true;
  }

  /* -----------------------------------------
     FILTERING
  ----------------------------------------- */

  function applyFilters() {
    const search = state.search.toLowerCase();

    state.filteredCards = state.cards.filter(function (card) {
      const matchesSearch = [
        card.front,
        card.back,
        card.subject,
        card.grade
      ].join(" ").toLowerCase().includes(search);

      const matchesFilter =
        state.filter === "all" ||
        (state.filter === "known" && card.known) ||
        (state.filter === "review" && !card.known);

      return matchesSearch && matchesFilter;
    });

    if (state.currentIndex >= state.filteredCards.length) {
      state.currentIndex = Math.max(
        0,
        state.filteredCards.length - 1
      );
    }

    state.showAnswer = false;
  }

  /* -----------------------------------------
     SUMMARY
  ----------------------------------------- */

  function renderSummary() {
    const total = state.cards.length;

    const known = state.cards.filter(function (card) {
      return card.known;
    }).length;

    const review = total - known;

    const values = {
      "[data-flashcards-total]": total,
      "[data-flashcards-known]": known,
      "[data-flashcards-review-count]": review
    };

    Object.keys(values).forEach(function (selector) {
      const element = $(selector);

      if (element) {
        element.textContent = String(values[selector]);
      }
    });
  }

  /* -----------------------------------------
     RENDER CURRENT CARD
  ----------------------------------------- */

  function renderCurrentCard() {
    const front = $("[data-flashcard-front]");
    const back = $("[data-flashcard-back]");
    const card = $("[data-flashcard-display]");
    const position = $("[data-flashcard-position]");
    const flipButton = $("[data-flashcard-flip]");
    const knownButton = $("[data-flashcard-known]");
    const previousButton = $("[data-flashcard-previous]");
    const nextButton = $("[data-flashcard-next]");

    const current = state.filteredCards[state.currentIndex];
    const hasCards = Boolean(current);

    if (card) {
      card.hidden = !hasCards;
    }

    const empty = $("[data-flashcards-empty]");

    if (empty) {
      empty.hidden = hasCards;
      empty.textContent = state.cards.length === 0
        ? "You have no flashcards yet. Create one to begin studying."
        : "No cards match your current search or filter.";
    }

    if (!hasCards) {
      if (position) position.textContent = "0 / 0";
      if (flipButton) flipButton.disabled = true;
      if (knownButton) knownButton.disabled = true;
      if (previousButton) previousButton.disabled = true;
      if (nextButton) nextButton.disabled = true;
      renderSummary();
      return;
    }

    if (front) {
      front.textContent = current.front;
    }

    if (back) {
      back.textContent = state.showAnswer
        ? current.back
        : "Answer hidden. Select Reveal answer to check.";
    }

    if (position) {
      position.textContent =
        (state.currentIndex + 1) + " / " +
        state.filteredCards.length;
    }

    if (flipButton) {
      flipButton.disabled = false;
      flipButton.textContent = state.showAnswer
        ? "Hide answer"
        : "Reveal answer";
      flipButton.setAttribute(
        "aria-pressed",
        String(state.showAnswer)
      );
    }

    if (knownButton) {
      knownButton.disabled = false;
      knownButton.textContent = current.known
        ? "Move to review"
        : "Mark as known";
    }

    if (previousButton) {
      previousButton.disabled = state.currentIndex === 0;
    }

    if (nextButton) {
      nextButton.disabled =
        state.currentIndex >= state.filteredCards.length - 1;
    }

    const subject = $("[data-flashcard-subject]");

    if (subject) {
      subject.textContent = current.subject
        ? current.subject
        : "General";
    }

    renderSummary();
  }

  function renderList() {
    const container = $("[data-flashcards-list]");

    if (!container) return;

    container.replaceChildren();

    state.cards.forEach(function (card) {
      const item = document.createElement("article");
      item.className = "flashcard-list-item";

      const heading = document.createElement("h3");
      heading.textContent = card.front;

      const subject = document.createElement("p");
      subject.textContent = [
        card.subject || "General",
        card.grade ? "Grade " + card.grade : "",
        card.known ? "Known" : "Needs review"
      ].filter(Boolean).join(" · ");

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";

      editButton.addEventListener("click", function () {
        openEditor(card.id);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", function () {
        deleteCard(card.id);
      });

      item.append(heading, subject, editButton, deleteButton);
      container.appendChild(item);
    });
  }

  function render() {
    applyFilters();
    renderCurrentCard();
    renderList();
  }

  /* -----------------------------------------
     CREATE AND UPDATE CARDS
  ----------------------------------------- */

  function openEditor(cardId) {
    const form = $("[data-flashcard-form]");
    const frontInput = $("[name='front']");
    const backInput = $("[name='back']");
    const subjectInput = $("[name='subject']");
    const gradeInput = $("[name='grade']");
    const title = $("[data-flashcard-form-title]");

    if (!form || !frontInput || !backInput) {
      showMessage(
        "The flashcard form is missing from flashcards.html.",
        "error"
      );
      return;
    }

    const existing = cardId
      ? state.cards.find(function (card) {
          return card.id === cardId;
        })
      : null;

    state.editingId = existing ? existing.id : null;

    frontInput.value = existing ? existing.front : "";
    backInput.value = existing ? existing.back : "";

    if (subjectInput) {
      subjectInput.value = existing ? existing.subject : "";
    }

    if (gradeInput) {
      gradeInput.value = existing ? existing.grade : "";
    }

    if (title) {
      title.textContent = existing
        ? "Edit flashcard"
        : "Create flashcard";
    }

    form.hidden = false;
    frontInput.focus();
  }

  function closeEditor() {
    const form = $("[data-flashcard-form]");

    if (form) {
      form.reset();
      form.hidden = true;
    }

    state.editingId = null;
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    const frontInput = $("[name='front']");
    const backInput = $("[name='back']");
    const subjectInput = $("[name='subject']");
    const gradeInput = $("[name='grade']");

    const front = normalizeText(frontInput && frontInput.value);
    const back = normalizeText(backInput && backInput.value);

    if (!front || !back) {
      showMessage(
        "Enter both the question or term and its answer.",
        "error"
      );
      return;
    }

    if (state.editingId) {
      const card = state.cards.find(function (item) {
        return item.id === state.editingId;
      });

      if (!card) {
        showMessage("The flashcard could not be found.", "error");
        return;
      }

      card.front = front;
      card.back = back;
      card.subject = normalizeText(
        subjectInput && subjectInput.value
      );
      card.grade = normalizeText(
        gradeInput && gradeInput.value
      );
      card.updatedAt = new Date().toISOString();
    } else {
      state.cards.push({
        id: createId(),
        front: front,
        back: back,
        subject: normalizeText(
          subjectInput && subjectInput.value
        ),
        grade: normalizeText(
          gradeInput && gradeInput.value
        ),
        known: false,
        createdAt: new Date().toISOString(),
        updatedAt: ""
      });
    }

    if (!saveCards()) return;

    closeEditor();
    render();
    showMessage("Flashcard saved.", "success");
  }

  /* -----------------------------------------
     DELETE CARDS
  ----------------------------------------- */

  function deleteCard(cardId) {
    const card = state.cards.find(function (item) {
      return item.id === cardId;
    });

    if (!card) return;

    if (!window.confirm("Delete this flashcard permanently?")) {
      return;
    }

    const previous = state.cards.slice();

    state.cards = state.cards.filter(function (item) {
      return item.id !== cardId;
    });

    if (!saveCards()) {
      state.cards = previous;
      return;
    }

    render();
    showMessage("Flashcard deleted.", "success");
  }

  /* -----------------------------------------
     STUDY CONTROLS
  ----------------------------------------- */

  function flipCard() {
    if (!state.filteredCards.length) return;

    state.showAnswer = !state.showAnswer;
    renderCurrentCard();
  }

  function moveCard(direction) {
    const nextIndex = state.currentIndex + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= state.filteredCards.length
    ) {
      return;
    }

    state.currentIndex = nextIndex;
    state.showAnswer = false;
    renderCurrentCard();
  }

  function toggleKnown() {
    const card = state.filteredCards[state.currentIndex];

    if (!card) return;

    const previous = card.known;
    card.known = !card.known;

    if (!saveCards()) {
      card.known = previous;
      return;
    }

    render();
    showMessage(
      card.known
        ? "Card marked as known."
        : "Card moved back to review.",
      "success"
    );
  }

  /* -----------------------------------------
     INITIALIZATION
  ----------------------------------------- */

  function initialize() {
    loadCards();

    const form = $("[data-flashcard-form]");

    if (form) {
      form.addEventListener("submit", handleFormSubmit);
    }

    const addButton = $("[data-flashcard-add]");

    if (addButton) {
      addButton.addEventListener("click", function () {
        openEditor(null);
      });
    }

    const cancelButton = $("[data-flashcard-cancel]");

    if (cancelButton) {
      cancelButton.addEventListener("click", closeEditor);
    }

    const flipButton = $("[data-flashcard-flip]");

    if (flipButton) {
      flipButton.addEventListener("click", flipCard);
    }

    const previousButton = $("[data-flashcard-previous]");

    if (previousButton) {
      previousButton.addEventListener("click", function () {
        moveCard(-1);
      });
    }

    const nextButton = $("[data-flashcard-next]");

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        moveCard(1);
      });
    }

    const knownButton = $("[data-flashcard-known]");

    if (knownButton) {
      knownButton.addEventListener("click", toggleKnown);
    }

    const searchInput = $("[data-flashcards-search]");

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.search = normalizeText(searchInput.value);
        state.currentIndex = 0;
        render();
      });
    }

    const filter = $("[data-flashcards-filter]");

    if (filter) {
      filter.addEventListener("change", function () {
        state.filter = filter.value;
        state.currentIndex = 0;
        render();
      });
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", initialize);

  window.HECFlashcards = Object.freeze({
    reload: function () {
      loadCards();
      render();
    },
    openEditor: openEditor,
    render: render,
    getCards: function () {
      return state.cards.slice();
    }
  });
})();
