// navigation.js: Add JavaScript logic or question data here later.
/* =========================================
   HABESHA EXAM CENTER
   File: navigation.js
   Purpose: Shared navigation behavior
========================================= */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initializeMobileNavigation();
    highlightCurrentPage();
    initializeLogoutButtons();
    initializeDropdowns();
  });

  /* Mobile hamburger menu */

  function initializeMobileNavigation() {
    const menuButton = document.querySelector(
      "[data-menu-toggle], .menu-toggle, .hamburger"
    );

    const menu = document.querySelector(
      "[data-mobile-menu], .mobile-menu, .nav-links"
    );

    if (!menuButton || !menu) {
      return;
    }

    function setMenuOpen(isOpen) {
      menu.classList.toggle("is-open", isOpen);
      menu.classList.toggle("active", isOpen);
      menuButton.setAttribute("aria-expanded", String(isOpen));

      if (!menuButton.hasAttribute("aria-label")) {
        menuButton.setAttribute(
          "aria-label",
          isOpen ? "Close navigation menu" : "Open navigation menu"
        );
      }
    }

    menuButton.setAttribute("aria-controls", menu.id || "mobile-navigation");

    if (!menu.id) {
      menu.id = "mobile-navigation";
    }

    menuButton.setAttribute("aria-expanded", "false");

    menuButton.addEventListener("click", function () {
      const isOpen = menu.classList.contains("is-open")
        || menu.classList.contains("active");

      setMenuOpen(!isOpen);
    });

    menu.addEventListener("click", function (event) {
      const link = event.target.closest("a");

      if (link && link.getAttribute("href")) {
        setMenuOpen(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    });

    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    });
  }

  /* Highlight the link for the current page */

  function highlightCurrentPage() {
    const currentFile = window.location.pathname
      .split("/")
      .pop()
      .toLowerCase() || "index.html";

    const links = document.querySelectorAll(
      "nav a[href], .nav-links a[href], [data-navigation] a[href]"
    );

    links.forEach(function (link) {
      const rawHref = link.getAttribute("href");

      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("http://") ||
        rawHref.startsWith("https://") ||
        rawHref.startsWith("mailto:")
      ) {
        return;
      }

      let linkedFile;

      try {
        linkedFile = new URL(rawHref, window.location.href)
          .pathname.split("/").pop().toLowerCase();
      } catch (error) {
        return;
      }

      if (linkedFile && linkedFile === currentFile) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("is-active");

        if (link.getAttribute("aria-current") === "page") {
          link.removeAttribute("aria-current");
        }
      }
    });
  }

  /* Logout buttons */

  function initializeLogoutButtons() {
    const logoutButtons = document.querySelectorAll(
      "[data-logout], .logout-button"
    );

    logoutButtons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();

        if (window.HEC && typeof window.HEC.logout === "function") {
          window.HEC.logout();
          return;
        }

        try {
          localStorage.removeItem("hec_current_user");
        } catch (error) {
          console.error("Could not clear current session:", error);
        }

        window.location.href = "login.html";
      });
    });
  }

  /* Accessible dropdowns */

  function initializeDropdowns() {
    const dropdownButtons = document.querySelectorAll(
      "[data-dropdown-toggle]"
    );

    dropdownButtons.forEach(function (button) {
      const targetId = button.getAttribute("data-dropdown-toggle");
      const dropdown = document.getElementById(targetId);

      if (!dropdown) {
        return;
      }

      button.setAttribute("aria-expanded", "false");

      button.addEventListener("click", function () {
        const isOpen = button.getAttribute("aria-expanded") === "true";

        button.setAttribute("aria-expanded", String(!isOpen));
        dropdown.hidden = isOpen;
      });

      document.addEventListener("click", function (event) {
        if (!button.contains(event.target) && !dropdown.contains(event.target)) {
          button.setAttribute("aria-expanded", "false");
          dropdown.hidden = true;
        }
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          button.setAttribute("aria-expanded", "false");
          dropdown.hidden = true;
        }
      });
    });
  }
})();