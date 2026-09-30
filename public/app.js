// JP Digital AI Platform
// Main frontend JavaScript

document.addEventListener("DOMContentLoaded", () => {
  setupScanner();
  setupSmoothScrolling();
  setupButtons();
});


/* =========================
   WEBSITE SCANNER
========================= */

function setupScanner() {
  const form = document.getElementById("scannerForm");
  const input = document.getElementById("scannerUrl");
  const result = document.getElementById("scannerResult");

  if (!form || !input || !result) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const rawUrl = input.value.trim();

    if (!rawUrl) {
      showScannerMessage(
        result,
        "Please enter a website URL.",
        "error"
      );
      return;
    }

    let url;

    try {
      url = new URL(
        rawUrl.startsWith("http")
          ? rawUrl
          : `https://${rawUrl}`
      );
    } catch {
      showScannerMessage(
        result,
        "Please enter a valid website address.",
        "error"
      );
      return;
    }

    input.value = url.href;

    showScannerMessage(
      result,
      "Connecting to the JP Business Scanner...",
      "loading"
    );

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: url.href
        })
      });

      if (!response.ok) {
        throw new Error("Scanner API unavailable");
      }

      const data = await response.json();

      displayScannerResult(result, data);

    } catch (error) {
      console.error("Scanner error:", error);

      showScannerMessage(
        result,
        "The scanner backend is not connected yet. The website interface is ready; the Cloudflare scanner will be connected next.",
        "info"
      );
    }
  });
}


/* =========================
   SCANNER MESSAGE
========================= */

function showScannerMessage(element, message, type) {
  element.className = `scanner-result ${type}`;

  element.innerHTML = `
    <div class="scanner-message">
      ${escapeHTML(message)}
    </div>
  `;
}


/* =========================
   DISPLAY SCANNER RESULT
========================= */

function displayScannerResult(element, data) {
  const score =
    data.score ??
    data.overallScore ??
    data.totalScore ??
    null;

  const website =
    data.url ??
    data.website ??
    "";

  const recommendations =
    Array.isArray(data.recommendations)
      ? data.recommendations
      : [];

  let html = `
    <div class="scanner-result-content">
      <h3>Website Scan Complete</h3>
  `;

  if (website) {
    html += `
      <p>
        <strong>Website:</strong>
        ${escapeHTML(website)}
      </p>
    `;
  }

  if (score !== null) {
    html += `
      <div class="scanner-score">
        <span>${escapeHTML(String(score))}</span>
        <small>/100</small>
      </div>
    `;
  }

  if (recommendations.length > 0) {
    html += `
      <div class="scanner-recommendations">
        <h4>Recommended Improvements</h4>
        <ul>
    `;

    recommendations.slice(0, 10).forEach((item) => {
      const text =
        typeof item === "string"
          ? item
          : item.title ||
            item.message ||
            item.description ||
            "Website improvement recommended.";

      html += `
        <li>${escapeHTML(text)}</li>
      `;
    });

    html += `
        </ul>
      </div>
    `;
  }

  html += `
      <a href="/scanner.html" class="btn btn-primary">
        View Full Scanner
      </a>
    </div>
  `;

  element.className = "scanner-result success";
  element.innerHTML = html;
}


/* =========================
   SMOOTH SCROLLING
========================= */

function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}


/* =========================
   BUTTON INTERACTIONS
========================= */

function setupButtons() {
  document.querySelectorAll("[data-coming-soon]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();

      alert(
        "This feature is being connected to the JP Digital AI platform."
      );
    });
  });
}


/* =========================
   HTML SAFETY
========================= */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  }
