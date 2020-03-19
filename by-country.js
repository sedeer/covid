var drawMap = function(dataset,map_target,linear_target,log_target,width,height) {
    var map_elem = (typeof map_target === 'string') ? map_target : "body"; // optional target HTML element
    var linear_elem = (typeof linear_target === 'string') ? linear_target : "body"; // optional target HTML element
    var log_elem = (typeof log_target === 'string') ? log_target : "body"; // optional target HTML element
    var w = 900; // SVG width
    var h = 700;  // SVG height
    if (typeof width === 'number') w = width; // optional SVG width
    if (typeof height === 'number') h = height;  // optional SVG height
    var margin = {top: 10, right: 50, bottom: 40, left: 35}
    w = w - margin.left - margin.right,
    h = h - margin.top - margin.bottom;
    var point_radius = 3;
    var cases100 = d3.select(".checkbox").property("checked");

    // Parser and formatters
    var parseDate = d3.time.format("%-m/%-d/%Y").parse;
    var formatDate = d3.time.format("%d/%m");
    var loglabel = d3.format(",g");

    // Map
    var map_svg = d3.select(map_elem)
        .append("svg")
        .attr("width",w)
        .attr("height",h)
        .attr("class","map")
        .attr("style", "outline: thin solid lightgrey;");

    var g = map_svg.append("g");

    // Zoom
    var zoom = d3.behavior.zoom()
        .translate([0,0])
        .scale(1)
        .scaleExtent([0.8,8])
        .on("zoom",zoomed);
    function zoomed() {
        g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }
    map_svg.call(zoom).call(zoom.event);

    // Map projection 
    var projection = d3.geo.mercator()
        .scale(150)
        .translate([w/2,h/2]);
    var path = d3.geo.path().projection(projection);

    // Line graphs
    var cases_graph = d3.select(linear_elem)
        .append("svg")
        .attr("width",w/2 + margin.left + margin.right)
        .attr("height",h/2 + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");
    cases_graph.append("text")
        .attr("class","graph_title")
        .attr("x", (w/4))
        .attr("y", 0 + (margin.top / 2))
        .attr("text-anchor", "middle")
        .text("Cases");

    var death_graph = d3.select(linear_elem)
        .append("svg")
        .attr("width",w/2 + margin.left + margin.right)
        .attr("height",h/2 + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");
    death_graph.append("text")
        .attr("class","graph_title")
        .attr("x", (w/4))
        .attr("y", 0 + (margin.top / 2))
        .attr("text-anchor", "middle")
        .text("Deaths");

    // Log graphs
    var cases_loggraph = d3.select(log_elem)
        .append("svg")
        .attr("width",w/2 + margin.left + margin.right)
        .attr("height",h/2 + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");
    cases_loggraph.append("text")
        .attr("class","graph_title")
        .attr("x", (w/4))
        .attr("y", 0 + (margin.top / 2))
        .attr("text-anchor", "middle")
        .text("Cases");

    var death_loggraph = d3.select(log_elem)
        .append("svg")
        .attr("width",w/2 + margin.left + margin.right)
        .attr("height",h/2 + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");
    death_loggraph.append("text")
        .attr("class","graph_title")
        .attr("x", (w/4))
        .attr("y", 0 + (margin.top / 2))
        .attr("text-anchor", "middle")
        .text("Deaths");

    // Set the ranges for the line graphs
    var x = cases100 ? d3.scale.linear().range([0, w/2]) : d3.time.scale().range([0, w/2]);
    var y_counts = d3.scale.linear().range([h/2, 0]);
    var y_deaths = d3.scale.linear().range([h/2, 0]);
    var y_counts_log = d3.scale.log().base(2).range([h/2, 0]);
    var y_deaths_log = d3.scale.log().base(2).range([h/2, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
        .orient("bottom").ticks(4);

    var yAxis_counts = d3.svg.axis().scale(y_counts)
        .orient("left").ticks(5);
    var yAxis_deaths = d3.svg.axis().scale(y_deaths)
        .orient("left").ticks(5);

    var yAxis_logcounts = d3.svg.axis().scale(y_counts_log)
        .orient("left").ticks(10, function(d) { return loglabel(d);});
    var yAxis_logdeaths = d3.svg.axis().scale(y_deaths_log)
        .orient("left").ticks(10, function(d) { return loglabel(d);});

    // Line creators
    var countline = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return x(cases100 ? d.days100 : d.date); })
        .y(function(d) { return y_counts(d.count); });
    var deathline = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return x(cases100 ? d.days100 : d.date); })
        .y(function(d) { return y_deaths(d.deaths); });
    var countlogline = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return x(cases100 ? d.days100 : d.date); })
        .y(function(d) { return y_counts_log(d.count); });
    var deathlogline = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return x(cases100 ? d.days100 : d.date); })
        .y(function(d) { return y_deaths_log(d.deaths); });

    // Define the div for the tooltip
    var div = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);

    var countrycolors = d3.scale.category10().domain([0,9]);

    var selected_countries = [];

    // Get data & draw map
    d3.csv(dataset, function(error,data) {
        if (error) return console.error(error);
        data.forEach(function(d) {
            d.date = parseDate(d.date);
            d.count = +d.count;
            d.deaths = +d.deaths;
            d.days100 = +d.days100;
        });
        var countries_with_data = d3.map(data, function(d){return(d.country)}).keys()

        // Draw the map
        d3.json("world.json", function(error,world) {
            if (error) return console.error(error);
            d3.select(".checkbox").on("change",updateGraphs); // change the graphs if the checkbox is toggled

            // Add the X Axis
            cases_graph.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + h/2 + ")")
                .call(xAxis)
            death_graph.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + h/2 + ")")
                .call(xAxis)
            cases_loggraph.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + h/2 + ")")
                .call(xAxis)
            death_loggraph.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + h/2 + ")")
                .call(xAxis)
        
            // Add the Y Axis
            cases_graph.append("g")
                .attr("class", "y axis")
                .call(yAxis_counts);
            death_graph.append("g")
                .attr("class", "y axis")
                .call(yAxis_deaths);
            cases_loggraph.append("g")
                .attr("class", "y axis")
                .call(yAxis_logcounts);
            death_loggraph.append("g")
                .attr("class", "y axis")
                .call(yAxis_logdeaths);

            // Scale the range of the data
            y_counts.domain([0, d3.max(data, function(d) { return d.count; })]);
            y_deaths.domain([0, d3.max(data, function(d) { return d.deaths; })]);
            y_counts_log.domain([1, d3.max(data, function(d) { return d.count; })]);
            y_deaths_log.domain([1, d3.max(data, function(d) { return d.deaths; })]);


            // Draw the countries on the map
            var countries = g.selectAll(".countries")
                .data(topojson.feature(world, world.objects.countries).features);

            countries.enter().append("path");

            countries.attr("d",path)
                .attr("class", "country")
                .attr("id", function (d) { return d.properties.name.replace(" ", "_")})
                .append("title");

            countries.on("click",function(d) {
                var countryname = d.properties.name;
                var index = selected_countries.indexOf(countryname);
                var error_message = cases100 ? "Fewer than 100 cases in " : "No cases reported in ";
                if (index >= 0) {
                    d3.select(this).style("fill","white");
                    selected_countries.splice(index,1);
                    d3.selectAll("#"+countryname.replace(" ", "_")+"-count").remove();
                    d3.selectAll("#"+countryname.replace(" ", "_")+"-death").remove();
                    updateGraphs()
                    recolorCountries();
                } else {
                    if (countries_with_data.indexOf(countryname) >= 0) {
                        selected_countries.push(countryname);
                        d3.select(this).style("fill",countrycolors(selected_countries.indexOf(countryname)%10));
                        updateGraphs();
                    } else {
                        div.transition()
                            .duration(200)
                            .style("opacity", 0.9);
                        div	.html(error_message + countryname)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");
                        window.setTimeout(clearTooltip,400);
                    }
                }
                });


            function clearTooltip() {
                div.transition()
                    .duration(600)
                    .style("opacity", 0);
            }

            function recolorCountries() {
                selected_countries.forEach(function (countryname) {
                    d3.select("#"+countryname.replace(" ", "_")).style("fill",countrycolors(selected_countries.indexOf(countryname)%10));
                });
            }

            // Update the line graphs when a country is picked.
            function updateGraphs() {
                var t = d3.transition().duration(750)
                cases100 = d3.selectAll(".checkbox").property("checked");

                var dataFilter = data.filter(function(d){return selected_countries.indexOf(d.country) >= 0 })

                if (cases100 == true) {
                    dataFilter = dataFilter.filter(function(d){return d.days100 >= 0 });
                    x = d3.scale.linear().range([0, w/2]);
                    x.domain([0, d3.max(dataFilter, function(d) { return d.days100; })]);
                    xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
                    d3.selectAll(".x").transition(t).call(xAxis);
                } else {
                    x = d3.time.scale().range([0, w/2]);
                    x.domain(d3.extent(data, function(d) { return d.date; }));
                    xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4).tickFormat(formatDate);
                    d3.selectAll(".x").transition(t).call(xAxis)
                        .selectAll("text")
                            .style("text-anchor", "end")
                            .attr("dx", "-.8em")
                            .attr("dy", "-.35em")
                            .attr("transform", "rotate(-65)");
                }

                var deathsFilter = dataFilter.filter(function(d){return d.deaths > 0 })  // log graphs can't handle 0
                var countsFilter = dataFilter.filter(function(d){return d.count > 0 })  // log graphs can't handle 0

                y_counts.domain([cases100 ? 100 : 0, d3.max(countsFilter, function(d) { return d.count; })]);
                yAxis_counts.scale(y_counts);
                cases_graph.select(".y").transition(t).call(yAxis_counts);
                y_deaths.domain([0, d3.max(deathsFilter, function(d) { return d.deaths; })]);
                yAxis_deaths.scale(y_deaths);
                death_graph.select(".y").transition(t).call(yAxis_deaths);

                y_counts_log.domain([cases100 ? 100 : 1, d3.max(countsFilter, function(d) { return d.count; })]);
                yAxis_logcounts.scale(y_counts_log);
                cases_loggraph.select(".y").transition(t).call(yAxis_logcounts);
                y_deaths_log.domain([1, d3.max(deathsFilter, function(d) { return d.deaths; })]);
                yAxis_logdeaths.scale(y_deaths_log);
                death_loggraph.select(".y").transition(t).call(yAxis_logdeaths);

                d3.selectAll("path.line").remove(); 
                d3.selectAll("circle").remove(); 
                
                /* *** Create the count graphs *** */
                // Nest the entries by country 
                var countsNest = d3.nest()
                    .key(function(d) {return d.country;})
                    .entries(countsFilter);
           
                countsNest.forEach(function(d) {
                    // line graphs
                    // linear
                    cases_graph.append("path")
                        .attr("class", "line")
                        .attr("stroke",countrycolors(selected_countries.indexOf(d.key)%10))
                        .attr("id",d.key.replace(" ", "_")+"-count")
                        .attr("d", countline(d.values))
                    // log
                    cases_loggraph.append("path")
                        .attr("class", "line")
                        .attr("stroke",countrycolors(selected_countries.indexOf(d.key)%10))
                        .attr("id",d.key.replace(" ", "_")+"-count")
                        .attr("d", countlogline(d.values));

                    // add points
                    d.values.forEach(function (d) {
                        cases_graph.append("circle")
                            .attr("r", point_radius)
                            .attr("class", "point")
                            .attr("fill",countrycolors(selected_countries.indexOf(d.country)%10))
                            .attr("id",d.country.replace(" ", "_")+"-count")
                            .attr("cx", x(cases100 ? d.days100 : d.date))
                            .attr("cy", y_counts(d.count))
                            .on("mouseover", function(e) {
                                div.transition()
                                    .duration(200)
                                    .style("opacity", 0.9);
                                div	.html(d.country + "<br>" + d.count + " cases"+ "<br>" + formatDate(d.date))
                                    .style("left", (d3.event.pageX) + "px")
                                    .style("top", (d3.event.pageY - 28) + "px");
                                })
                            .on("mouseout", function(d) {
                                window.setTimeout(clearTooltip,50);
                            });
                        cases_loggraph.append("circle")
                            .attr("r", point_radius)
                            .attr("class", "point")
                            .attr("fill",countrycolors(selected_countries.indexOf(d.country)%10))
                            .attr("id",d.country.replace(" ", "_")+"-count")
                            .attr("cx", x(cases100 ? d.days100 : d.date))
                            .attr("cy", y_counts_log(d.count))
                            .on("mouseover", function(e) {
                                div.transition()
                                    .duration(200)
                                    .style("opacity", 0.9);
                                div	.html(d.country + "<br>" + d.count + " cases"+ "<br>" + formatDate(d.date))
                                    .style("left", (d3.event.pageX) + "px")
                                    .style("top", (d3.event.pageY - 28) + "px");
                                })
                            .on("mouseout", function(d) {
                                window.setTimeout(clearTooltip,50);
                            });
                    });
                });

                /* *** Create the death graphs *** */
                // Nest the entries by country 
                var deathsNest = d3.nest()
                    .key(function(d) {return d.country;})
                    .entries(deathsFilter);
           
                deathsNest.forEach(function(d) {
                    // line graphs
                    // linear
                    death_graph.append("path")
                        .attr("class", "line")
                        .attr("stroke",countrycolors(selected_countries.indexOf(d.key)%10))
                        .attr("id",d.key.replace(" ", "_")+"-death")
                        .attr("d", deathline(d.values));
                    // log
                    death_loggraph.append("path")
                        .attr("class", "line")
                        .attr("stroke",countrycolors(selected_countries.indexOf(d.key)%10))
                        .attr("id",d.key.replace(" ", "_")+"-death")
                        .attr("d", deathlogline(d.values));

                    // add points
                    d.values.forEach(function (d) {
                        death_graph.append("circle")
                            .attr("r", point_radius)
                            .attr("class", "point")
                            .attr("fill",countrycolors(selected_countries.indexOf(d.country)%10))
                            .attr("id",d.country.replace(" ", "_")+"-death")
                            .attr("cx", x(cases100 ? d.days100 : d.date))
                            .attr("cy", y_deaths(d.deaths))
                            .on("mouseover", function(e) {
                                div.transition()
                                    .duration(200)
                                    .style("opacity", 0.9);
                                div	.html(d.country + "<br>" + d.deaths + " deaths"+ "<br>" + formatDate(d.date))
                                    .style("left", (d3.event.pageX) + "px")
                                    .style("top", (d3.event.pageY - 28) + "px");
                                })
                            .on("mouseout", function(d) {
                                window.setTimeout(clearTooltip,50);
                            });
                        death_loggraph.append("circle")
                            .attr("r", point_radius)
                            .attr("class", "point")
                            .attr("fill",countrycolors(selected_countries.indexOf(d.country)%10))
                            .attr("id",d.country.replace(" ", "_")+"-death")
                            .attr("cx", x(cases100 ? d.days100 : d.date))
                            .attr("cy", y_deaths_log(d.deaths))
                            .on("mouseover", function(e) {
                                div.transition()
                                    .duration(200)
                                    .style("opacity", 0.9);
                                div	.html(d.country + "<br>" + d.deaths + " deaths"+ "<br>" + formatDate(d.date))
                                    .style("left", (d3.event.pageX) + "px")
                                    .style("top", (d3.event.pageY - 28) + "px");
                                })
                            .on("mouseout", function(d) {
                                window.setTimeout(clearTooltip,50);
                            });
                    });
                });
            }

        });
    });
}
