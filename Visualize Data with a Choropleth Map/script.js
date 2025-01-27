const countyURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
const educationURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

const width = 1000;
const height = 700;
const padding = 100;

Promise.all([
  fetch(countyURL).then((res) => res.json()),
  fetch(educationURL).then((res) => res.json())
])
  .then(([usData, educationData]) => {
    const countyData = topojson.feature(usData, usData.objects.counties).features;

    const svg = d3
      .select("#choropleth")
      .attr("width", width)
      .attr("height", height);

    const tooltip = d3
      .select("#tooltip")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid black")
      .style("padding", "5px")
      .style("opacity", 0);

    const educationLookup = {};
    educationData.forEach((d) => {
      educationLookup[d.fips] = d;
    });

    const minEdu = d3.min(educationData, (d) => d.bachelorsOrHigher);
    const maxEdu = d3.max(educationData, (d) => d.bachelorsOrHigher);

    const colorScale = d3
      .scaleThreshold()
      .domain(d3.range(minEdu, maxEdu, (maxEdu - minEdu) / 4))
      .range(["#f7fbff", "#c6dbef", "#6baed6", "#2171b5"]);

    svg
      .selectAll(".county")
      .data(countyData)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", d3.geoPath())
      .attr("data-fips", (d) => d.id)
      .attr("data-education", (d) => {
        const edu = educationLookup[d.id];
        return edu ? edu.bachelorsOrHigher : 0;
      })
      .attr("fill", (d) => {
        const edu = educationLookup[d.id];
        return edu ? colorScale(edu.bachelorsOrHigher) : "#ccc";
      })
      .on("mouseover", (event, d) => {
        const edu = educationLookup[d.id];
        tooltip
          .style("opacity", 1)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px")
          .attr("data-education", edu ? edu.bachelorsOrHigher : 0)
          .html(
            edu
              ? `${edu.area_name}, ${edu.state}: ${edu.bachelorsOrHigher}%`
              : "No data"
          );
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    const legendWidth = 300;
    const legendHeight = 20;

    const legendScale = d3
      .scaleLinear()
      .domain([minEdu, maxEdu])
      .range([0, legendWidth]);

    const legendAxis = d3
      .axisBottom(legendScale)
      .tickValues(colorScale.domain())
      .tickFormat((d) => `${d}%`);

    const legend = svg
      .append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${(width - legendWidth) / 2}, ${height - padding / 2})`);

    legend
      .selectAll("rect")
      .data(colorScale.range().map((color, i) => {
        const domain = colorScale.invertExtent(color);
        if (!domain[0]) domain[0] = legendScale.domain()[0];
        if (!domain[1]) domain[1] = legendScale.domain()[1];
        return domain;
      }))
      .enter()
      .append("rect")
      .attr("x", (d) => legendScale(d[0]))
      .attr("y", 0)
      .attr("width", (d) => legendScale(d[1]) - legendScale(d[0]))
      .attr("height", legendHeight)
      .attr("fill", (d) => colorScale(d[0]));

    legend
      .append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);
  })
  .catch((error) => console.error("Error loading data:", error));
