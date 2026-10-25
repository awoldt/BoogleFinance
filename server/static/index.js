// Home page: ticker search, adding/removing watchlist tickers, and new lists.
//
// The watchlist lives in the "watchlist" cookie (comma separated symbols, url
// encoded) so the server can render it. After every change the page fetches
// itself and swaps in the freshly rendered watchlist.
(function () {
  var COOKIE = "watchlist";

  function readCookie() {
    var match = document.cookie.match(/(?:^|;\s*)watchlist=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function readSaved() {
    var value = readCookie();
    return value ? value.split(",").filter(Boolean) : [];
  }

  function writeSaved(symbols) {
    document.cookie =
      COOKIE + "=" + encodeURIComponent(symbols.join(",")) +
      "; path=/; max-age=31536000; samesite=lax";
  }

  // the react client kept the watchlist in localStorage, move it over once
  if (readCookie() === null) {
    try {
      var old = JSON.parse(localStorage.getItem(COOKIE) || "[]");
      if (Array.isArray(old) && old.length > 0) {
        writeSaved(old.filter(function (s) { return typeof s === "string" && s !== ""; }));
        localStorage.removeItem(COOKIE);
        location.reload();
        return;
      }
    } catch (e) {
      // storage blocked or the value is corrupt
    }
  }

  // ---- watchlist ----

  var refreshId = 0;

  // fetch this page again and swap in the server rendered watchlist
  function refreshWatchlist() {
    var id = ++refreshId;
    document.getElementById("watchlist").classList.add("opacity-60");
    fetch(location.pathname, { headers: { Accept: "text/html" } })
      .then(function (res) {
        if (!res.ok) throw new Error("refresh failed (" + res.status + ")");
        return res.text();
      })
      .then(function (html) {
        if (id !== refreshId) return; // a newer refresh is on its way
        var page = new DOMParser().parseFromString(html, "text/html");
        ["watchlist", "watchlist-count"].forEach(function (elId) {
          var fresh = page.getElementById(elId);
          var current = document.getElementById(elId);
          if (fresh && current) current.replaceWith(fresh);
        });
      })
      .catch(function () {
        if (id === refreshId) location.reload();
      });
  }

  function toggleSaved(symbol) {
    var saved = readSaved();
    var next = saved.indexOf(symbol) === -1
      ? saved.concat(symbol)
      : saved.filter(function (s) { return s !== symbol; });
    writeSaved(next);

    // keep any open search results in sync
    results.querySelectorAll("[data-toggle]").forEach(function (button) {
      if (button.dataset.toggle === symbol) setPressed(button, next.indexOf(symbol) !== -1);
    });
    refreshWatchlist();
  }

  document.addEventListener("click", function (event) {
    var remove = event.target.closest("[data-remove]");
    if (remove) {
      var row = remove.closest("li");
      if (row) row.remove(); // don't wait for the refresh to drop it
      toggleSaved(remove.dataset.remove);
    }
  });

  // ---- search ----

  var box = document.getElementById("search");
  var input = document.getElementById("search-input");
  var dropdown = document.getElementById("search-dropdown");
  var message = document.getElementById("search-message");
  var results = document.getElementById("search-results");
  var rowTemplate = document.getElementById("search-row");

  var isOpen = false;
  var status = "idle"; // idle | loading | success | error
  var found = [];
  var timer = 0;
  var controller = null;

  function setPressed(button, pressed) {
    var symbol = button.dataset.toggle;
    button.setAttribute("aria-pressed", String(pressed));
    button.setAttribute(
      "aria-label",
      (pressed ? "Remove " : "Add ") + symbol + (pressed ? " from watchlist" : " to watchlist"),
    );
  }

  function renderResults() {
    var saved = readSaved();
    results.replaceChildren.apply(results, found.map(function (result) {
      var row = rowTemplate.content.firstElementChild.cloneNode(true);
      row.querySelector("[data-symbol]").textContent = result.symbol;
      row.querySelector("[data-name]").textContent = result.name;
      row.querySelector("[data-exchange]").textContent = result.exchange;
      var button = row.querySelector("[data-toggle]");
      button.dataset.toggle = result.symbol;
      setPressed(button, saved.indexOf(result.symbol) !== -1);
      return row;
    }));
  }

  function render() {
    var query = input.value.trim();
    var show = isOpen && query !== "";
    dropdown.hidden = !show;
    input.setAttribute("aria-expanded", String(show));
    if (!show) return;

    var loading = status === "loading";
    var text = "";
    if (status === "error") {
      text = "Something went wrong. Try again.";
    } else if (found.length === 0) {
      text = loading ? "Searching…" : "No matches for “" + query + "”.";
    }
    message.hidden = text === "";
    message.textContent = text;
    message.classList.toggle("text-down", status === "error");
    message.classList.toggle("text-muted", status !== "error");
    results.hidden = text !== "";
    results.classList.toggle("opacity-60", loading);
  }

  function search(term) {
    if (controller) controller.abort();
    var current = (controller = new AbortController());
    fetch("/api/search?ticker=" + encodeURIComponent(term), {
      method: "POST",
      signal: current.signal,
    })
      .then(function (res) {
        if (!res.ok) throw new Error("search failed (" + res.status + ")");
        return res.json();
      })
      .then(function (data) {
        found = data || [];
        status = "success";
        renderResults();
        render();
      })
      .catch(function () {
        if (current.signal.aborted) return;
        found = [];
        status = "error";
        renderResults();
        render();
      });
  }

  // debounced so one request fires once the user pauses typing, and a slow
  // response for "te" can never overwrite the results for "tesla"
  input.addEventListener("input", function () {
    var term = input.value.trim();
    clearTimeout(timer);
    if (controller) controller.abort();
    isOpen = true;
    if (!term) {
      found = [];
      status = "idle";
      renderResults();
    } else {
      status = "loading";
      timer = setTimeout(function () { search(term); }, 300);
    }
    render();
  });

  input.addEventListener("focus", function () {
    isOpen = true;
    render();
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      isOpen = false;
      render();
    }
  });

  // close the dropdown when clicking anywhere outside the search box
  document.addEventListener("mousedown", function (event) {
    if (!box.contains(event.target)) {
      isOpen = false;
      render();
    }
  });

  results.addEventListener("click", function (event) {
    var button = event.target.closest("[data-toggle]");
    if (button) toggleSaved(button.dataset.toggle);
  });

  // ---- lists (not saved anywhere yet) ----

  var lists = document.getElementById("lists");
  var newList = document.getElementById("new-list");
  var form = document.getElementById("new-list-form");
  var chipTemplate = document.getElementById("list-chip");

  function setNaming(naming) {
    form.hidden = !naming;
    newList.hidden = naming;
    if (naming) form.elements.name.focus();
  }

  newList.addEventListener("click", function () { setNaming(true); });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = form.elements.name.value.trim();
    if (name) {
      var chip = chipTemplate.content.firstElementChild.cloneNode(true);
      chip.textContent = name;
      lists.insertBefore(chip, form);
      form.elements.name.value = "";
    }
    setNaming(false);
  });
})();
