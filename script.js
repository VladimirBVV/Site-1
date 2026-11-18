"use strict";

(function () {
  var STORAGE_KEY = "zyma-bez-svitla:checklist";

  /* ---------- Безпечна робота з localStorage ---------- */
  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* Сховище недоступне (приватний режим тощо) — працюємо без збереження. */
    }
  }

  /* ---------- Чек-лист ---------- */
  function initChecklist() {
    var boxes = Array.prototype.slice.call(
      document.querySelectorAll('#checklist input[type="checkbox"][data-key]')
    );
    var progressText = document.getElementById("progress-text");
    var progressFill = document.getElementById("progress-fill");
    var resetButton = document.getElementById("reset-checklist");
    if (!boxes.length) return;

    var state = loadState();

    function updateProgress() {
      var done = boxes.filter(function (b) { return b.checked; }).length;
      var total = boxes.length;
      if (progressText) {
        progressText.textContent = "Готово: " + done + " з " + total;
      }
      if (progressFill) {
        progressFill.style.width = Math.round((done / total) * 100) + "%";
      }
    }

    boxes.forEach(function (box) {
      box.checked = state[box.dataset.key] === true;
      box.addEventListener("change", function () {
        if (box.checked) {
          state[box.dataset.key] = true;
        } else {
          delete state[box.dataset.key];
        }
        saveState(state);
        updateProgress();
      });
    });

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        if (!window.confirm("Зняти всі позначки в чек-листі?")) return;
        boxes.forEach(function (b) { b.checked = false; });
        state = {};
        saveState(state);
        updateProgress();
      });
    }

    updateProgress();
  }

  /* ---------- Калькулятор автономності ---------- */
  var EFFICIENCY = 0.85;

  function parseNumber(value) {
    return parseFloat(String(value).replace(",", ".").trim());
  }

  function formatDuration(hours) {
    var totalMinutes = Math.round(hours * 60);
    var h = Math.floor(totalMinutes / 60);
    var m = totalMinutes % 60;
    if (h === 0) return m + " хв";
    if (m === 0) return h + " год";
    return h + " год " + m + " хв";
  }

  function initCalculator() {
    var form = document.getElementById("calc-form");
    var powerInput = document.getElementById("power");
    var capacityInput = document.getElementById("capacity");
    var lossesInput = document.getElementById("losses");
    var result = document.getElementById("calc-result");
    if (!form || !powerInput || !capacityInput || !result) return;

    function showError(message, input) {
      result.innerHTML = "";
      var p = document.createElement("p");
      p.className = "result-error";
      p.textContent = message;
      result.appendChild(p);
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.focus();
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      powerInput.removeAttribute("aria-invalid");
      capacityInput.removeAttribute("aria-invalid");

      var power = parseNumber(powerInput.value);
      var capacity = parseNumber(capacityInput.value);

      if (!isFinite(power) || power <= 0) {
        showError("Вкажіть потужність пристрою — число більше за нуль.", powerInput);
        return;
      }
      if (!isFinite(capacity) || capacity <= 0) {
        showError("Вкажіть ємність акумулятора — число більше за нуль.", capacityInput);
        return;
      }

      var useLosses = lossesInput ? lossesInput.checked : true;
      var usable = capacity * (useLosses ? EFFICIENCY : 1);
      var hours = usable / power;

      result.innerHTML = "";
      var main = document.createElement("p");
      main.className = "result-main";
      main.textContent = "≈ " + formatDuration(hours);
      var note = document.createElement("p");
      note.className = "hint";
      note.textContent =
        "Розрахунок: " + capacity + " Вт·год" +
        (useLosses ? " × 0,85" : "") +
        " ÷ " + power + " Вт. Це наближена оцінка.";
      result.appendChild(main);
      result.appendChild(note);
    });
  }

  initChecklist();
  initCalculator();
})();
