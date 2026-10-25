// Ticker page: local "last updated" time, chart range tabs, and the chart's
// hover tooltip. The server renders every range, this only switches between
// them.
(function () {
  var updatedFormat = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  document.querySelectorAll("time[data-local]").forEach(function (el) {
    var date = new Date(el.getAttribute("datetime"));
    if (!isNaN(date)) el.textContent = updatedFormat.format(date);
  });

  var root = document.querySelector("[data-chart]");
  if (!root) return;

  // every close oldest first as [price, "$1.00", "Jan 2, 2006"]
  var points = JSON.parse(root.dataset.points);
  var hides = [];

  root.querySelectorAll('[role="tab"]').forEach(function (tab) {
    tab.addEventListener("click", function () {
      var key = tab.dataset.range;
      root.querySelectorAll('[role="tab"]').forEach(function (other) {
        other.setAttribute("aria-selected", String(other === tab));
      });
      root.querySelectorAll("[data-panel]").forEach(function (panel) {
        panel.hidden = panel.dataset.panel !== key;
      });
      // a new range starts with the hover state cleared
      hides.forEach(function (hide) { hide(); });
    });
  });

  root.querySelectorAll("[data-plot]").forEach(function (plot) {
    var range = points.slice(Number(plot.dataset.start));
    var lo = Number(plot.dataset.lo);
    var hi = Number(plot.dataset.hi);
    var last = range.length - 1;
    var hover = plot.querySelector("[data-hover]");
    var tip = plot.querySelector("[data-tip]");
    var tipPrice = plot.querySelector("[data-tip-price]");
    var tipDate = plot.querySelector("[data-tip-date]");
    var active = -1; // index being inspected, -1 when hidden

    // written straight to the DOM, scrubbing never re-renders anything
    function show(index) {
      active = index;
      var width = plot.clientWidth;
      var x = (index / last) * width;
      var point = range[index];

      hover.style.setProperty("--x", x + "px");
      hover.style.setProperty("--y", ((hi - point[0]) / (hi - lo)) * 100 + "%");
      tipPrice.textContent = point[1];
      tipDate.textContent = point[2];
      tip.style.left = Math.min(Math.max(x - tip.offsetWidth / 2, 0), width - tip.offsetWidth) + "px";
      hover.style.visibility = "visible";
    }

    function hide() {
      active = -1;
      hover.style.visibility = "hidden";
    }
    hides.push(hide);

    function onPointer(event) {
      var rect = plot.getBoundingClientRect();
      var fraction = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      show(Math.round(fraction * last));
    }

    plot.addEventListener("pointermove", onPointer);
    plot.addEventListener("pointerdown", onPointer);
    plot.addEventListener("pointerleave", hide);
    plot.addEventListener("blur", hide);
    plot.addEventListener("keydown", function (event) {
      var current = active < 0 ? last : active;
      var next;
      switch (event.key) {
        case "ArrowLeft":
          next = Math.max(current - 1, 0);
          break;
        case "ArrowRight":
          next = Math.min(current + 1, last);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = last;
          break;
        case "Escape":
          hide();
          return;
        default:
          return;
      }
      event.preventDefault();
      show(next);
    });
  });
})();
