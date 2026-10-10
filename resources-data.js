// resources-data.js: Add JavaScript logic or question data here later.

/* =========================================
   HABESHA EXAM CENTER
   File: resources-data.js
   Purpose: Shared learning-resource catalogue
========================================= */

(function () {
  "use strict";

  /*
    Add verified learning-resource URLs here when they are available.
    Keep resource links empty until the actual destination is known.
    Do not invent video URLs or claim that a file has been uploaded.
  */

  const RESOURCES = [
    {
      id: "english-notes",
      grade: "all",
      subject: "english",
      type: "short-note",
      title: "English Short Notes",
      description: "Concise revision notes for English language topics.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "mathematics-notes",
      grade: "all",
      subject: "mathematics",
      type: "short-note",
      title: "Mathematics Short Notes",
      description: "Important formulas, methods, and revision concepts.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "science-notes",
      grade: "all",
      subject: "general-science",
      type: "short-note",
      title: "General Science Short Notes",
      description: "Key scientific ideas and revision points.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "physics-notes",
      grade: "12",
      subject: "physics",
      type: "short-note",
      title: "Physics Revision Notes",
      description: "Topic-based revision material for Physics.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "chemistry-notes",
      grade: "12",
      subject: "chemistry",
      type: "short-note",
      title: "Chemistry Revision Notes",
      description: "Important concepts, definitions, and formulas.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "biology-notes",
      grade: "12",
      subject: "biology",
      type: "short-note",
      title: "Biology Revision Notes",
      description: "Biology concepts and key revision points.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "social-studies-notes",
      grade: "all",
      subject: "social-studies",
      type: "short-note",
      title: "Social Studies Short Notes",
      description: "Concise social studies revision material.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "geography-notes",
      grade: "12",
      subject: "geography",
      type: "short-note",
      title: "Geography Revision Notes",
      description: "Geographical concepts and revision material.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "history-notes",
      grade: "12",
      subject: "history",
      type: "short-note",
      title: "History Revision Notes",
      description: "Historical topics, timelines, and revision points.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "economics-notes",
      grade: "12",
      subject: "economics",
      type: "short-note",
      title: "Economics Revision Notes",
      description: "Economic concepts and important definitions.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "aptitude-practice",
      grade: "12",
      subject: "aptitude",
      type: "practice-guide",
      title: "General Aptitude Preparation",
      description: "Preparation material for general aptitude.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "english-videos",
      grade: "all",
      subject: "english",
      type: "video",
      title: "English Learning Videos",
      description: "Curated educational videos for English revision.",
      url: "",
      status: "coming-soon"
    },
    {
      id: "math-videos",
      grade: "all",
      subject: "mathematics",
      type: "video",
      title: "Mathematics Learning Videos",
      description: "Video lessons for important mathematics topics.",
      url: "",
      status: "coming-soon"
    }
  ];

  function normalize(value) {
    return String(value == null ? "" : value).toLowerCase().trim();
  }

  function getAll() {
    return RESOURCES.map(function (resource) {
      return Object.assign({}, resource);
    });
  }

  function getById(id) {
    const resource = RESOURCES.find(function (item) {
      return item.id === id;
    });

    return resource ? Object.assign({}, resource) : null;
  }

  function getBySubject(subject, grade) {
    const selectedSubject = normalize(subject);
    const selectedGrade = normalize(grade);

    return RESOURCES.filter(function (item) {
      const subjectMatches =
        normalize(item.subject) === selectedSubject;

      const gradeMatches =
        item.grade === "all" ||
        !selectedGrade ||
        normalize(item.grade) === selectedGrade;

      return subjectMatches && gradeMatches;
    }).map(function (item) {
      return Object.assign({}, item);
    });
  }

  function getByType(type, grade) {
    const selectedType = normalize(type);
    const selectedGrade = normalize(grade);

    return RESOURCES.filter(function (item) {
      const typeMatches = normalize(item.type) === selectedType;

      const gradeMatches =
        item.grade === "all" ||
        !selectedGrade ||
        normalize(item.grade) === selectedGrade;

      return typeMatches && gradeMatches;
    }).map(function (item) {
      return Object.assign({}, item);
    });
  }

  function getStatus(resource) {
    if (
      resource &&
      resource.status === "available" &&
      typeof resource.url === "string" &&
      resource.url.trim()
    ) {
      return "available";
    }

    return "coming-soon";
  }

  function render(container, options) {
    if (typeof container === "string") {
      container = document.querySelector(container);
    }

    if (!container) return;

    options = options || {};

    let resources = getAll();

    if (options.subject) {
      resources = resources.filter(function (item) {
        return normalize(item.subject) === normalize(options.subject);
      });
    }

    if (options.grade) {
      resources = resources.filter(function (item) {
        return item.grade === "all" ||
          normalize(item.grade) === normalize(options.grade);
      });
    }

    if (options.type) {
      resources = resources.filter(function (item) {
        return normalize(item.type) === normalize(options.type);
      });
    }

    container.replaceChildren();

    if (!resources.length) {
      const empty = document.createElement("p");
      empty.textContent = "No resources match these filters.";
      container.appendChild(empty);
      return;
    }

    resources.forEach(function (resource) {
      const card = document.createElement("article");
      card.className = "resource-card";

      const title = document.createElement("h3");
      title.textContent = resource.title;

      const description = document.createElement("p");
      description.textContent = resource.description;

      const status = getStatus(resource);
      const statusText = document.createElement("p");
      statusText.className = "resource-status";
      statusText.textContent = status === "available"
        ? "Available"
        : "Coming soon";

      card.append(title, description, statusText);

      if (status === "available") {
        const link = document.createElement("a");
        link.href = resource.url;
        link.textContent = "Open resource";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        card.appendChild(link);
      } else {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Coming soon";
        button.disabled = true;
        card.appendChild(button);
      }

      container.appendChild(card);
    });
  }

  window.HECResources = Object.freeze({
    getAll: getAll,
    getById: getById,
    getBySubject: getBySubject,
    getByType: getByType,
    getStatus: getStatus,
    render: render
  });
})();
