const THEME = {
  bg: "#f1f5f9",
  grid: "#cbd5e1",
  axis: "#334155",
  boxFill: "#22c55e",
  boxStroke: "#ef4444",
  catColors: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"]
};

function addBackdrop(g, w, h, m) {
  g.append("rect")
    .attr("x", -m.left)
    .attr("y", -m.top)
    .attr("width", w + m.left + m.right)
    .attr("height", h + m.top + m.bottom)
    .attr("fill", THEME.bg);
}
function axisStyle(g) {
  g.selectAll(".domain, .tick line").attr("stroke", THEME.axis);
  g.selectAll("text").style("font-size", "12px");
}
function addYGrid(g, y, w) {
  g.append("g")
    .call(d3.axisLeft(y).tickSize(-w).tickFormat(""))
    .selectAll(".tick line")
    .attr("stroke", THEME.grid)
    .attr("stroke-opacity", 0.9);
}

d3.csv("socialMedia.csv").then(data => {
  data.forEach(d => {
    d.Likes = +d.Likes;
    d.AgeGroup = String(d.AgeGroup);
  });

  const m = { top: 44, right: 30, bottom: 55, left: 70 };
  const w = 620 - m.left - m.right;
  const h = 360 - m.top - m.bottom;

  const svg = d3.select("#boxplot").append("svg")
    .attr("width", w + m.left + m.right)
    .attr("height", h + m.top + m.bottom);
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
  addBackdrop(g, w, h, m);

  const groups = Array.from(new Set(data.map(d => d.AgeGroup)));
  const x = d3.scaleBand().domain(groups).range([0, w]).padding(0.35);
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.Likes) || 1]).nice()
    .range([h, 0]);

  addYGrid(g, y, w);
  g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y).ticks(8));
  axisStyle(g);

  g.append("text").attr("x", w / 2).attr("y", h + 40).attr("text-anchor", "middle")
    .style("font-weight", 600).text("Age Group");
  g.append("text").attr("x", -h / 2).attr("y", -50).attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle").style("font-weight", 600).text("Likes");
  g.append("text").attr("x", 0).attr("y", -12).style("font-size", "16px")
    .style("font-weight", 700).text("Likes by Age Group (Box Plot)");

  const grouped = d3.groups(data, d => d.AgeGroup);
  grouped.forEach(([age, rows]) => {
    const vals = rows.map(d => d.Likes).sort(d3.ascending);
    if (!vals.length) return;
    const q1 = d3.quantile(vals, 0.25);
    const q2 = d3.quantile(vals, 0.50);
    const q3 = d3.quantile(vals, 0.75);
    const min = d3.min(vals);
    const max = d3.max(vals);

    const bw = x.bandwidth();
    const cx = x(age);
    const cap = 14;

    // whiskers
    g.append("line")
      .attr("x1", cx + bw / 2).attr("x2", cx + bw / 2)
      .attr("y1", y(min)).attr("y2", y(max))
      .attr("stroke", THEME.boxStroke).attr("stroke-width", 2);

    // caps
    g.append("line").attr("x1", cx + (bw - cap) / 2).attr("x2", cx + (bw + cap) / 2)
      .attr("y1", y(min)).attr("y2", y(min))
      .attr("stroke", THEME.boxStroke).attr("stroke-width", 2);
    g.append("line").attr("x1", cx + (bw - cap) / 2).attr("x2", cx + (bw + cap) / 2)
      .attr("y1", y(max)).attr("y2", y(max))
      .attr("stroke", THEME.boxStroke).attr("stroke-width", 2);

    // box
    g.append("rect")
      .attr("x", cx).attr("y", y(q3)).attr("width", bw).attr("height", 0).attr("rx", 6)
      .attr("fill", THEME.boxFill).attr("fill-opacity", .95)
      .attr("stroke", THEME.boxStroke).attr("stroke-width", 2)
      .transition().duration(600)
      .attr("height", Math.max(0, y(q1) - y(q3)));

    // median
    g.append("line")
      .attr("x1", cx).attr("x2", cx + bw)
      .attr("y1", y(q2)).attr("y2", y(q2))
      .attr("stroke", THEME.boxStroke).attr("stroke-width", 2);
  });
}).catch(err => {
  d3.select("#boxplot").append("div").style("color", "crimson")
    .text("Box plot: failed to load socialMedia.csv");
  console.error(err);
});

function drawGroupedBar(rows) {
  rows.forEach(d => {
    d.AvgLikes = +d.AvgLikes;
    d.Platform = String(d.Platform);
    d.ContentType = String(d.ContentType);
  });

  const m = { top: 32, right: 24, bottom: 60, left: 70 };
  const w = 620 - m.left - m.right;
  const h = 320 - m.top - m.bottom;

  const svg = d3.select("#barplot").append("svg")
    .attr("width", w + m.left + m.right)
    .attr("height", h + m.top + m.bottom);
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
  addBackdrop(g, w, h, m);

  const plats = Array.from(new Set(rows.map(d => d.Platform)));
  const types = Array.from(new Set(rows.map(d => d.ContentType)));

  const x0 = d3.scaleBand().domain(plats).range([0, w]).paddingInner(0.2);
  const x1 = d3.scaleBand().domain(types).range([0, x0.bandwidth()]).padding(0.15);
  const y = d3.scaleLinear().domain([0, d3.max(rows, d => d.AvgLikes) || 1]).nice().range([h, 0]);
  const color = d3.scaleOrdinal().domain(types).range(THEME.catColors);

  addYGrid(g, y, w);
  g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x0));
  g.append("g").call(d3.axisLeft(y));
  axisStyle(g);

  g.append("text").attr("x", w / 2).attr("y", h + 44).attr("text-anchor", "middle")
    .style("font-weight", 600).text("Platform");
  g.append("text").attr("x", -h / 2).attr("y", -50).attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle").style("font-weight", 600).text("Average Likes");

  const group = g.selectAll(".g").data(plats).enter().append("g")
    .attr("class", "g").attr("transform", d => `translate(${x0(d)},0)`);

  group.selectAll("rect")
    .data(p => rows.filter(r => r.Platform === p))
    .enter().append("rect")
    .attr("x", d => x1(d.ContentType))
    .attr("y", y(0))
    .attr("width", x1.bandwidth())
    .attr("height", 0)
    .attr("fill", d => color(d.ContentType))
    .attr("rx", 5)
    .transition().duration(650)
    .attr("y", d => y(d.AvgLikes))
    .attr("height", d => Math.max(0, y(0) - y(d.AvgLikes)));

  // legend
  const legend = g.append("g").attr("transform", `translate(${w - 120},0)`);
  types.forEach((t, i) => {
    const L = legend.append("g").attr("transform", `translate(0,${i * 18})`);
    L.append("rect").attr("x", 0).attr("y", -10).attr("width", 12).attr("height", 12).attr("rx", 2).attr("fill", color(t));
    L.append("text").attr("x", 18).attr("y", 0).attr("dominant-baseline", "middle").style("font-size", "12px").text(t);
  });
}

function loadBar() {
  d3.csv("socialMediaAvg.csv").then(d => {
    if (d.length && "Platform" in d[0] && "ContentType" in d[0] && "AvgLikes" in d[0]) {
      drawGroupedBar(d);
    } else {
      throw new Error("socialMediaAvg.csv schema mismatch.");
    }
  }).catch(_ => {
    d3.csv("socialMedia.csv").then(raw => {
      const typeCol = ("ContentType" in raw[0]) ? "ContentType"
        : (("PostType" in raw[0]) ? "PostType" : null);
      if (!raw.length || !("Platform" in raw[0]) || !typeCol || !("Likes" in raw[0])) {
        d3.select("#barplot").append("div").style("color", "crimson")
          .text("Bar plot: need Platform, (ContentType/PostType), Likes in socialMedia.csv.");
        return;
      }
      raw.forEach(r => r.Likes = +r.Likes);

      const rolled = d3.rollups(
        raw,
        v => d3.mean(v, d => d.Likes),
        d => d.Platform,
        d => d[typeCol]
      );
      const rows = [];
      rolled.forEach(([plat, arr]) => {
        arr.forEach(([typ, avg]) => {
          rows.push({ Platform: plat, ContentType: String(typ), AvgLikes: +avg });
        });
      });
      drawGroupedBar(rows);
    }).catch(err => {
      d3.select("#barplot").append("div").style("color", "crimson")
        .text("Bar plot: cannot load data.");
      console.error(err);
    });
  });
}
loadBar();

function parseDateFlexible(s) {
  if (!s) return null;
  s = String(s).trim().replace(/\s*\(.*\)\s*$/, "");
  const parsers = [
    d3.timeParse("%Y-%m-%d"),
    d3.timeParse("%Y/%m/%d"),
    d3.timeParse("%m/%d/%Y"),
    d3.timeParse("%m/%d/%Y %H:%M"),
    d3.timeParse("%m/%d/%Y %H:%M:%S")
  ];
  for (const p of parsers) {
    const dt = p(s);
    if (dt) return dt;
  }
  return null;
}

function drawLine(rows) {
  rows.forEach(d => d.AvgLikes = +d.AvgLikes);

  const m = { top: 30, right: 24, bottom: 50, left: 70 };
  const w = 620 - m.left - m.right;
  const h = 320 - m.top - m.bottom;

  const svg = d3.select("#lineplot").append("svg")
    .attr("width", w + m.left + m.right)
    .attr("height", h + m.top + m.bottom);
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
  addBackdrop(g, w, h, m);

  rows.sort((a, b) => a.Date - b.Date);

  const x = d3.scaleTime().domain(d3.extent(rows, d => d.Date)).range([0, w]);
  const y = d3.scaleLinear().domain([0, d3.max(rows, d => d.AvgLikes) || 1]).nice().range([h, 0]);

  addYGrid(g, y, w);
  g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));
  axisStyle(g);

  const line = d3.line()
    .x(d => x(d.Date))
    .y(d => y(d.AvgLikes))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(rows)
    .attr("fill", "none")
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 2)
    .attr("d", line);

  g.selectAll("circle")
    .data(rows)
    .enter().append("circle")
    .attr("cx", d => x(d.Date))
    .attr("cy", d => y(d.AvgLikes))
    .attr("r", 3.2)
    .attr("fill", "#2563eb");
}

function loadLine() {
  d3.csv("socialMediaTime.csv").then(d => {
    if (d.length && "Date" in d[0] && "AvgLikes" in d[0]) {
      d.forEach(r => r.Date = parseDateFlexible(r.Date));
      const rows = d.filter(r => r.Date);
      if (rows.length) { drawLine(rows); return; }
      throw new Error("Date parse failed.");
    } else {
      throw new Error("schema mismatch");
    }
  }).catch(_ => {
    d3.csv("socialMedia.csv").then(raw => {
      const dateCol = ("Date" in raw[0]) ? "Date"
        : (("Timestamp" in raw[0]) ? "Timestamp"
        : (("PostTimestamp" in raw[0]) ? "PostTimestamp" : null));
      if (!dateCol || !("Likes" in raw[0])) {
        d3.select("#lineplot").append("div").style("color", "crimson")
          .text("Line plot: need Date/Timestamp/PostTimestamp + Likes in socialMedia.csv.");
        return;
      }
      raw.forEach(r => {
        r.Likes = +r.Likes;
        r.__d = parseDateFlexible(r[dateCol]);
      });
      const clean = raw.filter(r => r.__d && isFinite(r.Likes));
      if (!clean.length) {
        d3.select("#lineplot").append("div").style("color", "crimson")
          .text("Line plot: cannot parse dates from Date/Timestamp/PostTimestamp.");
        return;
      }
      const rolled = d3.rollups(
        clean,
        v => d3.mean(v, d => d.Likes),
        d => +d3.timeDay.floor(d.__d)
      );
      const rows = rolled.map(([ms, avg]) => ({ Date: new Date(ms), AvgLikes: +avg }));
      drawLine(rows);
    }).catch(err => {
      d3.select("#lineplot").append("div").style("color", "crimson")
        .text("Line plot: cannot load socialMedia.csv.");
      console.error(err);
    });
  });
}
loadLine();
