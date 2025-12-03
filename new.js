// new.js - integrated, robust for home (dataset), predict (api) and analytics (history)
(() => {
  const API = "http://127.0.0.1:5000";
  const STORAGE_KEY = "placemate_history_v1";

  // Utility: destroy chart safely
  function destroyChart(obj) {
    try { if (obj && obj.destroy) obj.destroy(); } catch(e){/*ignore*/ }
  }

  // Page switcher
  function showPage(page) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const el = document.getElementById(page);
    if (el) el.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (page === "analytics") loadPredictionAnalytics();
    if (page === "home") loadHomeAnalytics();
  }

  // attach nav events
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".nav [data-page]").forEach(li => {
      li.addEventListener("click", () => showPage(li.dataset.page));
    });

    // set up buttons after DOM ready
    const predictBtn = document.getElementById("predictBtn");
    predictBtn && predictBtn.addEventListener("click", predictPlacement);

    const clearBtn = document.getElementById("clearHistoryBtn");
    clearBtn && clearBtn.addEventListener("click", () => {
      if (!confirm("Clear all prediction history?")) return;
      localStorage.removeItem(STORAGE_KEY);
      loadPredictionAnalytics();
      updateHomeKPIsFromHistory(); // keep home KPIs in sync
      alert("History cleared.");
    });

    const downloadBtn = document.getElementById("downloadBtn");
    downloadBtn && downloadBtn.addEventListener("click", downloadReport);

    // init charts and load home analytics
    initHomeChart();
    loadHomeAnalytics();
    updateHomeKPIsFromHistory(); // also populate home KPIs if history exists

    // if URL contains #analytics open analytics
    if (location.hash && location.hash.includes("analytics")) showPage("analytics");
  });

  // ---------------------
  // HOME (dataset-driven) functions
  // ---------------------
  let homeChartObj = null;
  function initHomeChart() {
    const ctx = document.getElementById("homeChart");
    if (!ctx) return;
    homeChartObj = new Chart(ctx, {
      type: "line",
      data: { labels: [], datasets: [{ label: "Placement % (dataset)", data: [], borderColor: "#1abc9c", tension: 0.3, fill: true }] },
      options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });
  }

  async function loadHomeAnalytics() {
    // fetch dataset analytics from backend
    try {
      const res = await fetch(API + "/analytics");
      if (!res.ok) throw new Error("Network error: " + res.status);
      const data = await res.json();

      // update KPIs (dataset)
      document.getElementById("kpi-total").innerText = data.total ?? 0;
      document.getElementById("kpi-cgpa").innerText = data.avg_cgpa ?? "0.00";
      document.getElementById("kpi-iq").innerText = data.avg_iq ?? 0;
      // document.getElementById("kpi-placement").innerText = (data.placement_pct ?? 0) + "%";
      // document.getElementById("kpi-intern").innerText = (data.intern_pct ?? 0) + "%";

      // update home chart with cgpa bins (dataset trend)
      if (homeChartObj && data.cgpa_bins) {
        homeChartObj.data.labels = data.cgpa_bins.labels;
        homeChartObj.data.datasets[0].data = data.cgpa_bins.values;
        homeChartObj.update();
      }
    } catch (err) {
      console.error("Failed to load home analytics:", err);
      // Keep previous state — optionally show a small message
    }
  }

  // ---------------------
  // PREDICT
  // ---------------------
  async function predictPlacement() {
    const cgpa = parseFloat(document.getElementById("cgpa").value);
    const iq = parseFloat(document.getElementById("iq").value);
    const intern = parseInt(document.getElementById("intern").value);
    const projects = parseInt(document.getElementById("projects").value);

    if (isNaN(cgpa) || isNaN(iq) || isNaN(projects)) {
      alert("Please enter CGPA, IQ and Projects correctly.");
      return;
    }

    const statusEl = document.getElementById("status");
    const resultCard = document.getElementById("result-card");
    const resultText = document.getElementById("result-text");

    statusEl.innerText = "Predicting...";
    resultCard.style.display = "none";

    const payload = { cgpa, iq, intern, projects };

    try {
      const res = await fetch(API + "/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Predict API error: " + res.status);
      const json = await res.json();

      const probabilityPct = Math.round((json.probability ?? 0) * 100);
      const cls = parseInt(json.prediction);

      resultText.innerHTML = `<strong>Prediction:</strong> ${cls === 1 ? "Placed" : "Not Placed"}<br><strong>Probability:</strong> ${probabilityPct}%`;
      resultCard.style.display = "block";
      statusEl.innerText = "Prediction complete (backend).";

      // save history and update analytics (history-based) + update home KPIs from history
      pushToHistory({ cgpa, iq, intern, projects, probability: probabilityPct, cls });
      loadPredictionAnalytics();
      updateHomeKPIsFromHistory();

    } catch (err) {
      console.warn("Predict failed — using demo model", err);
      // fallback demo logistic
      const z = -2 + 0.9 * cgpa + 0.02 * iq + 1.3 * intern + 0.18 * projects;
      const prob = 1 / (1 + Math.exp(-z));
      const probabilityPct = Math.round(prob * 100);
      const cls = prob >= 0.5 ? 1 : 0;

      resultText.innerHTML = `<strong>Prediction (Demo):</strong> ${cls === 1 ? "Placed" : "Not Placed"}<br><strong>Probability:</strong> ${probabilityPct}%`;
      resultCard.style.display = "block";
      statusEl.innerText = "Prediction complete (demo).";

      pushToHistory({ cgpa, iq, intern, projects, probability: probabilityPct, cls });
      loadPredictionAnalytics();
      updateHomeKPIsFromHistory();
    }
  }

  // ---------------------
  // HISTORY (localStorage)
  // ---------------------
  function pushToHistory(item) {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    arr.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function getHistory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  // Update home KPIs from history (optional: shows how user's predictions affect personal KPIs)
  function updateHomeKPIsFromHistory() {
    const history = getHistory();
    if (history.length === 0) return; // prefer dataset KPIs for home, but if you want to reflect user's own predictions, enable below

    // OPTIONAL: comment these lines if you want to keep home strictly dataset-driven
    // For now we'll only update the trend chart (homeChart) with predictions appended
    try {
      const homeChart = window.homeChartObj || null;
      // append predictions probabilities to homeChart if available
      if (homeChart) {
        const labels = history.map((_, i) => i + 1);
        const data = history.map(h => h.probability);
        homeChart.data.labels = labels;
        homeChart.data.datasets[0].data = data;
        homeChart.update();
      }
    } catch (e) { /* ignore */ }
  }

  // ---------------------
  // ANALYTICS (user prediction history)
  // ---------------------
  let cgpaChartObj, pieChartObj, internChartObj, projChartObj;

  function destroyAllHistoryCharts() {
    destroyChart(cgpaChartObj);
    destroyChart(pieChartObj);
    destroyChart(internChartObj);
    destroyChart(projChartObj);
  }

  function loadPredictionAnalytics() {
    const history = getHistory();
    destroyAllHistoryCharts();

    if (!history || history.length === 0) {
      // clear KPI fields
      document.getElementById("avgCgpa").innerText = "0.0";
      document.getElementById("internPercent").innerText = "0%";
      document.getElementById("avgProjects").innerText = "0.0";
      document.getElementById("placementRate").innerText = "0%";
      return;
    }

    const total = history.length;
    const avgCgpa = (history.reduce((s, x) => s + x.cgpa, 0) / total).toFixed(2);
    const avgIq = Math.round(history.reduce((s, x) => s + x.iq, 0) / total);
    const internPct = Math.round(history.filter(x => x.intern === 1).length / total * 100);
    const placementPct = Math.round(history.filter(x => x.cls === 1).length / total * 100);
    const avgProjects = (history.reduce((s, x) => s + x.projects, 0) / total).toFixed(1);

    document.getElementById("avgCgpa").innerText = avgCgpa;
    document.getElementById("internPercent").innerText = internPct + "%";
    document.getElementById("avgProjects").innerText = avgProjects;
    document.getElementById("placementRate").innerText = placementPct + "%";

    // prepare series
    const cgpaLabels = history.map((h, i) => "S" + (i + 1));
    const cgpaData = history.map(h => h.cgpa);
    const probData = history.map(h => h.probability);
    const internData = history.map(h => h.intern);
    const projectLabels = history.map((h, i) => "S" + (i + 1));
    const projectData = history.map(h => h.projects);

    // CGPA vs probability (bar)
    cgpaChartObj = new Chart(document.getElementById("chart1"), {
      type: "bar",
      data: {
        labels: cgpaLabels,
        datasets: [
          { label: "CGPA", data: cgpaData, backgroundColor: "#1abc9c" },
          { label: "Probability %", data: probData, backgroundColor: "#16a085" }
        ]
      },
      options: { responsive: true }
    });

    // Pie chart: placed vs not placed
    const placedCount = history.filter(h => h.cls === 1).length;
    const notPlacedCount = total - placedCount;
    pieChartObj = new Chart(document.getElementById("chart2"), {
      type: "pie",
      data: { labels: ["Placed", "Not Placed"], datasets: [{ data: [placedCount, notPlacedCount], backgroundColor: ["#1abc9c", "#e74c3c"] }] }
    });

    // Internship line chart (intern value vs probability)
    internChartObj = new Chart(document.getElementById("chart3"), {
      type: "line",
      data: {
        labels: cgpaLabels,
        datasets: [
          { label: "Intern (0/1)", data: internData, borderColor: "#3498db", yAxisID: "y1" },
          { label: "Probability %", data: probData, borderColor: "#f39c12", yAxisID: "y2" }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y1: { type: "linear", position: "left", beginAtZero: true },
          y2: { type: "linear", position: "right", beginAtZero: true }
        }
      }
    });

    // Projects histogram
    projChartObj = new Chart(document.getElementById("chart4"), {
      type: "bar",
      data: { labels: projectLabels, datasets: [{ label: "Projects", data: projectData, backgroundColor: "#9b59b6" }] },
      options: { responsive: true }
    });
  }

  // ---------------------
  // Download report
  // ---------------------
  function downloadReport() {
    const cgpa = document.getElementById("cgpa").value || "N/A";
    const iq = document.getElementById("iq").value || "N/A";
    const resultText = document.getElementById("result-text").innerText || "No result";
    const html = `<html><head><title>Placement Report</title><style>body{font-family:Arial;padding:20px}</style></head><body>
      <h2>Placement Report</h2><p><strong>CGPA:</strong> ${cgpa}</p><p><strong>IQ:</strong> ${iq}</p>
      <p><strong>Result:</strong><br>${resultText.replace(/\n/g,"<br>")}</p>
      <p style="font-size:12px;color:#666">Generated: ${new Date().toLocaleString()}</p>
    </body></html>`;
    const w = window.open("","_blank"); w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>w.print(), 500);
  }

  // expose showPage for HTML inline calls if needed
  window.showPage = showPage;
  window.loadPredictionAnalytics = loadPredictionAnalytics;

})();
