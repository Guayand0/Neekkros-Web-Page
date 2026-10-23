(() => {
  const root = document.documentElement;
  const themes = ["system", "light", "dark"];
  const labels = {
    system: "Sistema",
    light: "Claro",
    dark: "Oscuro",
  };

  let selectedTheme = "system";

  try {
    const savedTheme = localStorage.getItem("neekkros-theme");
    if (themes.includes(savedTheme)) {
      selectedTheme = savedTheme;
    }
  } catch {
    // The site still works with the default system theme if storage is unavailable.
  }

  function updateThemeColor() {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const background = getComputedStyle(root).getPropertyValue("--background").trim();

    if (metaThemeColor && background) {
      metaThemeColor.setAttribute("content", background);
    }
  }

  function updateThemeButton() {
    const button = document.getElementById("theme-toggle");
    if (!button) return;

    button.dataset.theme = selectedTheme;

    button.setAttribute(
      "aria-label",
      `Cambiar tema. Tema actual: ${labels[selectedTheme]}`,
    );
    button.title = `Tema ${labels[selectedTheme]}`;
  }

  function setTheme(theme, save = false) {
    selectedTheme = themes.includes(theme) ? theme : "system";
    root.dataset.theme = selectedTheme;
    updateThemeButton();
    updateThemeColor();

    if (save) {
      try {
        localStorage.setItem("neekkros-theme", selectedTheme);
      } catch {
        // Keep the selected theme for this page view if storage is unavailable.
      }
    }
  }

  // This script follows the three theme stylesheets in the document head.
  // Loading is blocked until all of them are ready, then the selected theme is applied.
  setTheme(selectedTheme);

  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("theme-toggle");
    if (!button) return;

    updateThemeButton();
    button.addEventListener("click", () => {
      const currentIndex = themes.indexOf(selectedTheme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      setTheme(nextTheme, true);
    });
  });

  const systemPreference = window.matchMedia("(prefers-color-scheme: dark)");
  systemPreference.addEventListener?.("change", () => {
    if (selectedTheme === "system") {
      updateThemeColor();
    }
  });
})();
