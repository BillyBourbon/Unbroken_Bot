const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

/**
 * Writes a Plotly chart to HTML or PNG
 */
async function writePlot(trace, layout, outputFile, asPng) {
  // Ensure output directory exists
  const dir = path.dirname(outputFile);
  fs.mkdirSync(dir, { recursive: true });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.plot.ly/plotly-2.30.0.min.js"></script>
  <title>Heatmap</title>
</head>
<body style="margin:0">
  <div id="chart" style="width:1200px;height:700px;"></div>
  <script>
    Plotly.newPlot(
      "chart",
      [${JSON.stringify(trace)}],
      ${JSON.stringify(layout)}
    );
  </script>
</body>
</html>
`;

  if (!asPng) {
    fs.writeFileSync(`${outputFile}.html`, html);
    return;
  }

  // PNG via headless Chromium
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 700 });
  await page.setContent(html, { waitUntil: "networkidle0" });

  await page.screenshot({
    path: `${outputFile}.png`,
  });

  await browser.close();
}

module.exports = {
  writePlot,
};
