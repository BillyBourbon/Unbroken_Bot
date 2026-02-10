const { writePlot } = require("./helpers");

async function heatmapDayXHour(data, outputFile, asPng = false) {
  if (!data.length) throw new Error("No data provided");

  const factionName = data[0].faction_name;

  const days = [...new Set(data.map((d) => d.day))].sort();
  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  const z = days.map(() => Array(24).fill(0));
  const text = days.map(() => Array(24).fill(""));

  data.forEach((row) => {
    const dayIdx = days.indexOf(row.day);
    const hourIdx = hours.indexOf(row.hour_of_day);

    z[dayIdx][hourIdx] = row.active_minutes;
    text[dayIdx][hourIdx] = String(row.active_minutes);
  });

  const trace = {
    type: "heatmap",
    x: hours,
    y: days,
    z,
    text,
    texttemplate: "%{text}",
    colorscale: "RdOrYl",
    hovertemplate:
      "<b>Day:</b> %{y}<br>" +
      "<b>Hour:</b> %{x}<br>" +
      "<b>Active Minutes:</b> %{z}<extra></extra>",
  };

  const layout = {
    title: `Hourly Activity Heatmap — ${factionName}`,
    xaxis: { title: "Hour of Day" },
    yaxis: { title: "Day" },
  };

  await writePlot(trace, layout, outputFile, asPng);
}
async function heatmapWeekXDay(data, outputFile, asPng = false) {
  if (!data.length) throw new Error("No data provided");

  const factionName = data[0].faction_name;

  const weeks = [...new Set(data.map((d) => d.week))].sort();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const z = weeks.map(() => Array(7).fill(0));
  const text = weeks.map(() => Array(7).fill(""));

  data.forEach((row) => {
    const weekIdx = weeks.indexOf(row.week);
    const weekday = Number(row.weekday); // 0=Sun
    const monIndex = (weekday + 6) % 7;

    z[weekIdx][monIndex] = row.active_minutes;
    text[weekIdx][monIndex] = String(row.active_minutes);
  });

  const trace = {
    type: "heatmap",
    x: days,
    y: weeks,
    z,
    text,
    texttemplate: "%{text}",
    colorscale: "RdOrYl",
    hovertemplate:
      "<b>Week:</b> %{y}<br>" +
      "<b>Day:</b> %{x}<br>" +
      "<b>Active Minutes:</b> %{z}<extra></extra>",
  };

  const layout = {
    title: `Weekly Activity Heatmap — ${factionName}`,
    xaxis: { title: "Day of Week" },
    yaxis: { title: "Week" },
  };

  await writePlot(trace, layout, outputFile, asPng);
}

module.exports = {
  heatmapDayXHour,
  heatmapWeekXDay,
};
