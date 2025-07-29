const width = 600;
const height = 400;

let svg = d3
  .select("body")
  .insert("svg", "#sidebar")
  .attr("width", width)
  .attr("height", height);

let margin = { top: 20, right: 10, bottom: 20, left: 50 };

// Bottom axis container
let bottomContainer = svg
  .append("g")
  .attr("id", "bottom")
  .attr("transform", `translate(0, ${height - margin.bottom})`);

// Left axis container
let leftContainer = svg
  .append("g")
  .attr("id", "left")
  .attr("transform", `translate(${margin.left}, 0)`);

let chartHeight = (height - margin.bottom) - margin.top;
let midPoint = margin.top + chartHeight / 2;

svg
  .append("text")
  // .text("Stars")
  .text("Sol Count")
  .style("font-size", "14px")
  .attr("text-anchor", "middle")
  .attr("transform", `translate(12, ${midPoint}) rotate(270)`);

// function getLicense(d) {
//   let license = d.license?.name;

//   if (!license) {
//     return "No License";
//   } else {
//     return license;
//   }
// }

// let hiddenLicenses = new Set();
function getCameraCategory(camera) {
  if (camera.startsWith("EDL")) return "Entry, Descent, Landing";

  if (
    camera.includes("NAVCAM") || 
    camera.includes("HAZCAM")
  ) {
    return "Engineering";
  }

  if (
    camera.startsWith("MCZ") ||
    camera === "SKYCAM" ||
    camera === "SHERLOC_WATSON" ||
    camera === "SUPERCAM_RMI"
  ) {
    return "Science";
  }

  return "Other";
}

let hiddenCategories = new Set();

function update(items) {
  // Items with the hidden licenses removed
  // let filtered = items.filter(d => !hiddenLicenses.has(getLicense(d)));

  // let licenses = new Set(items.map(d => getLicense(d)));
  let filtered = items.filter(d => !hiddenCategories.has(d.category));
  let categories = new Set(items.map(d => d.category));

  let colorScale = d3.scaleOrdinal()
    // .domain(licenses)
    .domain(categories)
    .range(d3.schemeCategory10);

  let xScale = d3.scaleBand()
    // .domain(filtered.map(d => d.full_name))
    .domain(filtered.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.3);

  let yScale = d3.scaleLinear()
    // .domain([0, d3.max(filtered, d => d.stargazers_count)])
    .domain([0, d3.max(filtered, d => d.sol_count)])
    .range([height - margin.bottom, margin.top])
    .nice();

  let bottomAxis = d3
    .axisBottom(xScale)
    .tickValues([]);

  let leftAxis = d3
    .axisLeft(yScale)
    .tickFormat(d3.format("~s"));

  bottomContainer.call(bottomAxis);

  leftContainer
    .transition()
    .call(leftAxis);

  svg
    .selectAll("rect")
    // .data(filtered, d => d.full_name)
    .data(filtered, d => d.name)
    .join(
      enter => enter
        .append("rect")
        // .attr("x", d => xScale(d.full_name))
        // .attr("y", d => yScale(d.stargazers_count))
        // .attr("fill", d => colorScale(getLicense(d)))
        .attr("x", d => xScale(d.name))
        .attr("y", d => yScale(d.sol_count))
        .attr("fill", d => colorScale(d.category))
        .attr("width", xScale.bandwidth())
        // .attr("height", d => yScale(0) - yScale(d.stargazers_count))
        .attr("height", d => yScale(0) - yScale(d.sol_count))
        .style("opacity", 0)
        .transition()
        .style("opacity", 1),
      update => update
        .transition()
        // .attr("x", d => xScale(d.full_name))
        // .attr("y", d => yScale(d.stargazers_count))
        .attr("x", d => xScale(d.name))
        .attr("y", d => yScale(d.sol_count))
        .attr("width", xScale.bandwidth())
        // .attr("height", d => yScale(0) - yScale(d.stargazers_count)),
        .attr("height", d => yScale(0) - yScale(d.sol_count)),
      exit => exit
        .transition()
        .style("opacity", 0)
        .remove(),
    )
    .on("mouseover", (e, d) => {
      let info = d3.select("#info");
      // info.select(".repo .value a").text(d.full_name).attr("href", d.html_url);
      // info.select(".license .value").text(getLicense(d));
      // info.select(".stars .value").text(d.stargazers_count);
      info.select(".camera .value").text(d.name);
      info.select(".category .value").text(d.category);
      info.select(".sols .value").text(d.sol_count);
    });

  d3.select("#key")
    .selectAll("p")
    // .data(licenses)
    .data(categories)
    .join(
      enter => {
        let p = enter.append("p");

        p.append("input")
          .attr("type", "checkbox")
          .attr("checked", true)
          .attr("title", "Include in chart");

        p.append("div")
          .attr("class", "color")
          .style("background-color", d => colorScale(d));

        p.append("span")
          .text(d => d)

        return p;
      }
    );

  d3.selectAll("#key input").on("change", (e, d) => {
    if (e.target.checked) {
      // hiddenLicenses.delete(d);
      hiddenCategories.delete(d);
    } else {
      // hiddenLicenses.add(d);
      hiddenCategories.add(d);
    }

    // console.log(hiddenLicenses);
    console.log(hiddenCategories);
    update(items);
  });
}

// function getUrl() {
//   let baseUrl = "https://api.github.com/search/repositories";

//   let params = {
//     q: "language:javascript stars:>10000",
//     per_page: 20,
//     sort: "stars"
//   };

//   let queryString = Object.entries(params).map(pair => {
//     return `${pair[0]}=${encodeURIComponent(pair[1])}`;
//   }).join("&");

//   return `${baseUrl}?${queryString}`;
// }

// let url = getUrl();
// let backupUrl = "https://skilldrick-jscc.s3.us-west-2.amazonaws.com/gh-js-repos.json";

// Replace url with backupUrl in following line if needed
// d3.json(url).then(data => {
//   update(data.items);
// });
const url = "https://api.nasa.gov/mars-photos/api/v1/manifests/Perseverance/?api_key=DEMO_KEY";

d3.json(url).then(data => {
  let photos = data.photo_manifest.photos;

  // Count how many sols each camera was used
  let cameraSolsMap = new Map();

  photos.forEach(photoDay => {
    let sol = photoDay.sol;
    photoDay.cameras.forEach(camera => {
      if (!cameraSolsMap.has(camera)) {
        cameraSolsMap.set(camera, new Set());
      }
      cameraSolsMap.get(camera).add(sol);
    });
  });

  // Convert to an array of objects for visualization
  let items = Array.from(cameraSolsMap.entries()).map(([camera, solsSet]) => ({
    name: camera,
    sol_count: solsSet.size,
    category: getCameraCategory(camera)
  }));

  update(items);
});
