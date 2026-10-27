(function () {
  "use strict";

  // Shared header and footer
  var page = document.body.getAttribute("data-page");
  var links = [
    ["index.html", "Research", "home"],
    ["subscribe.html", "Subscribe", "subscribe"],
    ["contact.html", "Contact", "contact"]
  ];
  var logo =
    '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">' +
    '<rect x="0.5" y="0.5" width="27" height="27" rx="6" fill="#0f141c" stroke="#263142"/>' +
    '<polyline points="5,19 10,14 14,16 19,9 23,11" fill="none" stroke="#3ee6a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="23" cy="11" r="2" fill="#3ee6a8"/></svg>';

  var tickers = [
    ["ASX 200", "8,412.6", "+0.42%"], ["S&P 500", "6,318.2", "+0.18%"], ["AUD/USD", "0.6684", "-0.11%"],
    ["US 10Y", "4.12%", "-3bp"], ["AU 10Y", "4.31%", "+1bp"], ["GOLD", "2,743.1", "+0.65%"],
    ["WTI", "71.84", "-0.92%"], ["VIX", "15.27", "-2.10%"], ["BTC", "98,214", "+1.34%"],
    ["NIKKEI", "39,881", "+0.27%"], ["EUR/USD", "1.0812", "+0.06%"], ["IRON ORE", "104.50", "-0.48%"]
  ];
  var tick = tickers.map(function (t) {
    var cls = t[2].charAt(0) === "-" ? "down" : "up";
    return "<span><b>" + t[0] + "</b>" + t[1] + ' <em class="' + cls + '" style="font-style:normal">' + t[2] + "</em></span>";
  }).join("");

  var header =
    '<div class="ticker" aria-hidden="true"><div class="ticker-track">' + tick + tick + "</div></div>" +
    '<header class="site"><div class="wrap">' +
    '<a class="brand" href="index.html">' + logo + '<span>Quant Financial Research<small>SYSTEMATIC · EVIDENCE-LED</small></span></a>' +
    '<button class="menu-toggle" aria-label="Menu">menu</button>' +
    '<nav class="main">' +
    links.map(function (l) {
      return '<a href="' + l[0] + '"' + (page === l[2] ? ' class="active"' : "") + ">" + l[1] + "</a>";
    }).join("") +
    '<a class="btn-nav" href="login.html">Subscriber login</a></nav></div></header>';

  var footer =
    '<footer class="site"><div class="wrap"><div>' +
    "<p>© " + new Date().getFullYear() + " Quant Financial Research Pty Ltd. Sydney, Australia.</p>" +
    "<p>All figures, charts and performance data on this site are illustrative only and do not represent actual results. " +
    "Nothing on this site is financial advice or an offer to buy or sell any financial product.</p></div>" +
    '<nav><a href="index.html">Research</a><a href="subscribe.html">Subscribe</a><a href="contact.html">Contact</a><a href="login.html">Login</a></nav>' +
    "</div></footer>";

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);

  var toggle = document.querySelector(".menu-toggle");
  toggle.addEventListener("click", function () {
    document.querySelector("nav.main").classList.toggle("open");
  });

  // Deterministic pseudo-random series so the charts look the same on every load
  function rng(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  }
  function gauss(r) {
    var u = r() || 1e-9, v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function walk(n, mu, sigma, seed) {
    var r = rng(seed), v = 100, out = [v];
    for (var i = 1; i < n; i++) { v *= 1 + mu + sigma * gauss(r); out.push(v); }
    return out;
  }

  function svg(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function lineChart(el, series, opts) {
    var W = 640, H = opts.height || 260, P = { l: 8, r: 44, t: 10, b: 20 };
    var all = [].concat.apply([], series.map(function (s) { return s.data; }));
    var min = opts.min != null ? opts.min : Math.min.apply(null, all);
    var max = opts.max != null ? opts.max : Math.max.apply(null, all);
    var pad = (max - min) * 0.06; min -= pad; max += pad;
    var n = series[0].data.length;
    var x = function (i) { return P.l + (i / (n - 1)) * (W - P.l - P.r); };
    var y = function (v) { return P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b); };
    var root = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "chart", role: "img", "aria-label": opts.label || "chart" });

    for (var g = 0; g <= 4; g++) {
      var gv = min + ((max - min) * g) / 4, gy = y(gv);
      root.appendChild(svg("line", { x1: P.l, x2: W - P.r, y1: gy, y2: gy, stroke: "#1c2430" }));
      var t = svg("text", { x: W - P.r + 6, y: gy + 3 });
      t.textContent = opts.fmt ? opts.fmt(gv) : gv.toFixed(0);
      root.appendChild(t);
    }
    (opts.xLabels || []).forEach(function (lab, i, arr) {
      var t = svg("text", { x: x(Math.round((i / (arr.length - 1)) * (n - 1))), y: H - 4, "text-anchor": i === 0 ? "start" : i === arr.length - 1 ? "end" : "middle" });
      t.textContent = lab;
      root.appendChild(t);
    });

    series.forEach(function (s, si) {
      var d = s.data.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join("");
      if (s.fill) {
        var id = "grad" + Math.random().toString(36).slice(2);
        var defs = svg("defs", {}), lg = svg("linearGradient", { id: id, x1: 0, x2: 0, y1: 0, y2: 1 });
        lg.appendChild(svg("stop", { offset: "0%", "stop-color": s.color, "stop-opacity": 0.28 }));
        lg.appendChild(svg("stop", { offset: "100%", "stop-color": s.color, "stop-opacity": 0 }));
        defs.appendChild(lg); root.appendChild(defs);
        var base = s.fillTo != null ? y(s.fillTo) : H - P.b;
        root.appendChild(svg("path", { d: d + "L" + x(n - 1) + " " + base + "L" + x(0) + " " + base + "Z", fill: "url(#" + id + ")" }));
      }
      var path = svg("path", { d: d, fill: "none", stroke: s.color, "stroke-width": s.width || 1.8, "stroke-dasharray": s.dash || "", "stroke-linejoin": "round" });
      root.appendChild(path);
      if (opts.animate && !s.dash) {
        var len = 4000;
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.style.transition = "stroke-dashoffset 2.2s ease " + si * 0.2 + "s";
        requestAnimationFrame(function () { requestAnimationFrame(function () { path.style.strokeDashoffset = 0; }); });
      }
      if (s.endDot) {
        root.appendChild(svg("circle", { cx: x(n - 1), cy: y(s.data[n - 1]), r: 3.5, fill: s.color }));
      }
    });
    el.innerHTML = "";
    el.appendChild(root);
    return root;
  }

  // Home page charts
  var eq = document.getElementById("equity");
  if (eq) {
    var N = 260;
    var strat = walk(N, 0.0011, 0.0062, 42);
    var bench = walk(N, 0.0005, 0.0095, 7);
    var years = ["2021", "2022", "2023", "2024", "2025", "2026"];
    lineChart(eq, [
      { data: bench, color: "#566173", width: 1.4, dash: "4 3" },
      { data: strat, color: "#3ee6a8", fill: true, endDot: true, width: 2 }
    ], { height: 280, xLabels: years, animate: true, label: "Illustrative cumulative return of the composite signal versus benchmark" });

    // Drawdown series derived from the strategy curve
    var peak = -Infinity, dd = strat.map(function (v) { peak = Math.max(peak, v); return (v / peak - 1) * 100; });
    lineChart(document.getElementById("drawdown"), [{ data: dd, color: "#ff5c6c", fill: true, fillTo: 0, width: 1.4 }],
      { height: 130, max: 0, xLabels: years, fmt: function (v) { return v.toFixed(0) + "%"; }, label: "Illustrative drawdown" });

    // Rolling Sharpe
    var r = rng(99), rs = [], s = 1.6;
    for (var i = 0; i < N; i++) { s += (1.8 - s) * 0.04 + 0.12 * gauss(r); rs.push(s); }
    lineChart(document.getElementById("sharpe"), [{ data: rs, color: "#4fa3ff", width: 1.6 }],
      { height: 130, xLabels: years, fmt: function (v) { return v.toFixed(1); }, label: "Illustrative rolling 12-month Sharpe ratio" });
  }

  // Monthly returns heatmap
  var hm = document.getElementById("heatmap");
  if (hm) {
    var months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    var html = '<div class="h"></div>' + months.map(function (m) { return '<div class="h">' + m + "</div>"; }).join("");
    var rr = rng(2024);
    [2022, 2023, 2024, 2025, 2026].forEach(function (yr) {
      html += '<div class="h">' + yr + "</div>";
      for (var m = 0; m < 12; m++) {
        if (yr === 2026 && m > 9) { html += "<div></div>"; continue; }
        var v = 0.9 + 1.6 * gauss(rr);
        var a = Math.min(Math.abs(v) / 4, 1) * 0.8 + 0.12;
        var bg = v >= 0 ? "rgba(62,230,168," + a + ")" : "rgba(255,92,108," + a + ")";
        html += '<div style="background:' + bg + '">' + v.toFixed(1) + "</div>";
      }
    });
    hm.innerHTML = html;
  }

  // Animated counters
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var pre = el.getAttribute("data-pre") || "", suf = el.getAttribute("data-suf") || "";
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / 1600, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (target * e).toLocaleString("en-AU", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });

  // Live-looking signal table
  var sig = document.getElementById("signals");
  if (sig) {
    var rows = [
      ["BHP.AX", "Momentum 12-1", 1.84], ["CBA.AX", "Quality", -0.62], ["CSL.AX", "Low vol", 1.12],
      ["XJO", "Carry / term", 0.47], ["AUDUSD", "FX value", -1.31], ["GC1", "Trend 200d", 2.06],
      ["ES1", "Vol risk premium", 0.88]
    ];
    var rs2 = rng(5);
    function render() {
      sig.innerHTML = rows.map(function (row) {
        row[2] += 0.08 * gauss(rs2);
        var z = row[2], cls = z >= 0 ? "up" : "down";
        var side = z > 0.5 ? "LONG" : z < -0.5 ? "SHORT" : "FLAT";
        return "<tr><td>" + row[0] + '</td><td class="muted">' + row[1] + '</td><td class="num ' + cls + '">' +
          (z >= 0 ? "+" : "") + z.toFixed(2) + '</td><td class="num ' + (side === "FLAT" ? "muted" : cls) + '">' + side + "</td></tr>";
      }).join("");
    }
    render();
    setInterval(render, 1800);
  }

  // Terminal log
  var term = document.getElementById("terminal");
  if (term) {
    var lines = [
      ['info', 'ingest   ', 'loaded 4,812 instruments · 31.2M bars'],
      ['ok', 'clean    ', 'survivorship + corporate actions applied'],
      ['info', 'factor   ', 'computing 146 features across 9 asset classes'],
      ['ok', 'cv       ', 'purged k-fold (k=8, embargo=5d) complete'],
      ['warn', 'risk     ', 'gross exposure capped at 180% · vol target 10%'],
      ['info', 'optimise ', 'mean-variance w/ shrinkage (Ledoit-Wolf)'],
      ['ok', 'backtest ', 'net of costs: 12bp/side, borrow 45bp p.a.'],
      ['info', 'report   ', 'publishing weekly research note #214'],
      ['ok', 'done     ', 'pipeline finished in 00:03:41']
    ];
    var li = 0;
    function addLine() {
      var l = lines[li % lines.length];
      var ts = new Date().toISOString().slice(11, 19);
      term.insertAdjacentHTML("beforeend", "<div><span class='muted'>" + ts + "</span> <span class='" + l[0] + "'>" + l[1] + "</span>" + l[2] + "</div>");
      while (term.children.length > 9) term.removeChild(term.firstChild);
      li++;
    }
    for (var k = 0; k < 5; k++) addLine();
    setInterval(addLine, 1400);
  }

  // Mock forms: nothing is sent anywhere
  document.querySelectorAll("form[data-mock]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = f.querySelector(".notice");
      if (n) { n.textContent = f.getAttribute("data-mock"); n.classList.add("show"); }
      f.querySelectorAll("button[type=submit]").forEach(function (b) { b.disabled = true; b.style.opacity = .6; });
    });
  });
})();
