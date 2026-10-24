const currentYear = document.getElementById("current-year");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

const socialCountLabels = document.querySelectorAll("[data-social-count]");
const socialNumberFormat = new Intl.NumberFormat("es-ES");

function showSocialCount(element, value, label) {
  element.textContent = `${socialNumberFormat.format(value)} ${label}`;
  element.hidden = false;
}

async function updateSocialCounts() {
  try {
    const response = await fetch("/api/social-counts");
    if (!response.ok) return;

    const { counts } = await response.json();
    for (const element of socialCountLabels) {
      const count = counts?.[element.dataset.socialCount];
      if (!Number.isFinite(count?.value) || count.value < 0) {
        element.hidden = true;
        element.removeAttribute("title");
        continue;
      }

      showSocialCount(element, count.value, count.type || element.dataset.countLabel);

      if (count.collectedAt) {
        const collectedAt = new Date(count.collectedAt);
        if (!Number.isNaN(collectedAt.getTime())) {
          element.title = `Dato recogido el ${new Intl.DateTimeFormat("es-ES", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(collectedAt)}`;
        }
      }
    }

  } catch {
    // Los recuentos son opcionales; la página sigue funcionando si la API falla.
  }
}

updateSocialCounts();

const emailButton = document.getElementById("copy-email");
const copyToast = document.getElementById("copy-toast");
const copyToastMessage = document.getElementById("copy-toast-message");
const closeCopyToast = document.getElementById("copy-toast-close");
let copyToastTimer;
let swipeStart;

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Try the fallback below if clipboard access is denied.
    }
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  field.remove();
  return copied;
}

function hideCopyToast() {
  clearTimeout(copyToastTimer);
  copyToast.classList.remove("is-visible");
  copyToast.setAttribute("aria-hidden", "true");
}

function showCopyToast(message) {
  copyToastMessage.textContent = message;
  copyToast.setAttribute("aria-hidden", "false");
  copyToast.classList.add("is-visible");
  clearTimeout(copyToastTimer);
  if (message === "Copiado") {
    copyToastTimer = setTimeout(hideCopyToast, 2000);
  }
}

emailButton?.addEventListener("click", async () => {
  const copied = await copyToClipboard(emailButton.textContent.trim());
  showCopyToast(copied ? "Copiado" : "No se pudo copiar");
});

closeCopyToast?.addEventListener("click", hideCopyToast);

copyToast?.addEventListener("pointerdown", (event) => {
  swipeStart = { x: event.clientX, y: event.clientY };
});

copyToast?.addEventListener("pointerup", (event) => {
  if (!swipeStart) return;
  const deltaY = event.clientY - swipeStart.y;
  const deltaX = event.clientX - swipeStart.x;
  swipeStart = null;
  if (deltaY > 40 && deltaY > Math.abs(deltaX)) hideCopyToast();
});

copyToast?.addEventListener("pointercancel", () => {
  swipeStart = null;
});
const brandLogo = document.querySelector(".brand-logo");
const brandImage = brandLogo?.querySelector("img");
const supportsParallax = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (brandLogo && brandImage && supportsParallax && !prefersReducedMotion) {
  brandLogo.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;

    const bounds = brandLogo.getBoundingClientRect();
    const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;

    brandImage.style.setProperty("--parallax-x", `${-offsetX * bounds.width * 0.048}px`);
    brandImage.style.setProperty("--parallax-y", `${-offsetY * bounds.height * 0.048}px`);
  });

  brandLogo.addEventListener("pointerleave", () => {
    brandImage.style.setProperty("--parallax-x", "0px");
    brandImage.style.setProperty("--parallax-y", "0px");
  });
}
