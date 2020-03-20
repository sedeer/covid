var drawMap = function(dataset,map_target,linear_target,log_target,pct_target,pct2_target,width,height) {
    var map_elem = (typeof map_target === 'string') ? map_target : "body"; // optional target HTML element
    var linear_elem = (typeof linear_target === 'string') ? linear_target : "body"; // optional target HTML element
    var log_elem = (typeof log_target === 'string') ? log_target : "body"; // optional target HTML element
    var pct_elem = (typeof pct_target === 'string') ? pct_target : "body"; // optional target HTML element
    var pct2_elem = (typeof pct2_target === 'string') ? pct2_target : "body"; // optional target HTML element
    var w = 840; // SVG width
    var h = 700;  // SVG height
    if (typeof width === 'number') w = width; // optional SVG width
    if (typeof height === 'number') h = height;  // optional SVG height
    var margin = {top: 10, right: 10, bottom: 40, left: 35}
    w = w - margin.left - margin.right,
    h = h - margin.top - margin.bottom;
    var point_radius = 3;
    var cases100 = d3.select(".checkbox").property("checked");
    var start_date;

    // Parser and formatters
    var parseUSDate = d3.time.format("%m/%d/%y").parse;
    var parseDate = d3.time.format("%d/%m/%y").parse;
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

    // Make graphs
    function make_graph(target, group) {
        return d3.select(target)
            .append("svg")
            .attr("width",w/2 + margin.left + margin.right)
            .attr("height",h/2 + margin.top + margin.bottom)
            .attr("class","graph " + group)
            .append("g")
                .attr("class","graph " + group)
                .attr("transform", 
                      "translate(" + margin.left + "," + margin.top + ")");
    }
    // Line graphs
    var cases_graph = make_graph(linear_elem, "cases");
    var death_graph = make_graph(linear_elem, "deaths");

    // Percent graphs
    var cases_pctgraph = make_graph(pct_elem, "cases");
    var death_pctgraph = make_graph(pct_elem, "deaths");
    
    var cases_pct2graph = make_graph(pct2_elem, "cases");
    var death_pct2graph = make_graph(pct2_elem, "deaths");

    // Log graphs
    var cases_loggraph = make_graph(log_elem, "cases")
    var death_loggraph = make_graph(log_elem, "deaths");

    // graph titles
    d3.selectAll("svg.cases")
        .append("text")
        .attr("class","graph_title")
        .attr("x", (w/4))
        .attr("y", 5 + (margin.top / 2))
        .attr("text-anchor", "middle")
        .text("Cases");
    d3.selectAll("svg.deaths")
        .append("text")
        .attr("class","graph_title")
        .attr("x", (w/4))
        .attr("y", 5 + (margin.top / 2))
        .attr("text-anchor", "middle")
        .text("Deaths");

    // Set the ranges for the line graphs
    var x = cases100 ? d3.scale.linear().range([0, w/2]) : d3.time.scale().range([0, w/2]);
    var y_counts = d3.scale.linear().range([h/2, 0]);
    var y_deaths = d3.scale.linear().range([h/2, 0]);
    var y_counts_pct = d3.scale.linear().range([h/2, 0]);
    var y_deaths_pct = d3.scale.linear().range([h/2, 0]);
    var y_counts_pct2 = d3.scale.linear().range([h/2, 0]);
    var y_deaths_pct2 = d3.scale.linear().range([h/2, 0]);
    var y_counts_log = d3.scale.log().base(2).range([h/2, 0]);
    var y_deaths_log = d3.scale.log().base(2).range([h/2, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
        .orient("bottom").ticks(4);

    var yAxis_counts = d3.svg.axis().scale(y_counts)
        .orient("left").ticks(5);
    var yAxis_deaths = d3.svg.axis().scale(y_deaths)
        .orient("left").ticks(5);

    var yAxis_counts_pct = d3.svg.axis().scale(y_counts_pct)
        .orient("left").ticks(5);
    var yAxis_deaths_pct = d3.svg.axis().scale(y_deaths_pct)
        .orient("left").ticks(5);

    var yAxis_counts_pct2 = d3.svg.axis().scale(y_counts_pct2)
        .orient("left").ticks(5);
    var yAxis_deaths_pct2 = d3.svg.axis().scale(y_deaths_pct2)
        .orient("left").ticks(5);

    var yAxis_counts_log = d3.svg.axis().scale(y_counts_log)
        .orient("left").ticks(10, function(d) { return loglabel(d);});
    var yAxis_deaths_log = d3.svg.axis().scale(y_deaths_log)
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
    var countpctline = d3.svg.line()
        .x(function(d) { return x(cases100 ? d.days100 : d.date); })
        .y(function(d) { return y_counts_pct(d.count_pct); });
    var deathpctline = d3.svg.line()
        .x(function(d) { return x(cases100 ? d.days100 : d.date); })
        .y(function(d) { return y_deaths_pct(d.deaths_pct); });
    var countpct2line = d3.svg.line()
        .x(function(d) { return x(cases100 ? d.days100 : d.date); })
        .y(function(d) { return y_counts_pct2(d.count_pct2); });
    var deathpct2line = d3.svg.line()
        .x(function(d) { return x(cases100 ? d.days100 : d.date); })
        .y(function(d) { return y_deaths_pct2(d.deaths_pct2); });
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
            d.date = parseUSDate(d.date); 
            d.count = +d.count;
            d.deaths = +d.deaths;
            d.days100 = +d.days100;
            d.count_pct = +d.count_pct;
            d.count_pct2 = +d.count_pct2;
            d.deaths_pct = +d.deaths_pct;
            d.deaths_pct2 = +d.deaths_pct2;
        });
        var countries_with_data = d3.map(data, function(d){return(d.country)}).keys()

        // Draw the map
        d3.json("world.json", function(error,world) {
            if (error) return console.error(error);
            d3.select(".checkbox").on("change",updateGraphs); // change the graphs if the checkbox is toggled
            document.getElementById("datebtn").onclick = updateGraphs;

            // Add the X Axis
            d3.selectAll("g.graph")
                .append("g")
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
            cases_pctgraph.append("g")
                .attr("class", "y axis")
                .call(yAxis_counts_pct);
            death_pctgraph.append("g")
                .attr("class", "y axis")
                .call(yAxis_deaths_pct);
            cases_pct2graph.append("g")
                .attr("class", "y axis")
                .call(yAxis_counts_pct2);
            death_pct2graph.append("g")
                .attr("class", "y axis")
                .call(yAxis_deaths_pct2);
            cases_loggraph.append("g")
                .attr("class", "y axis")
                .call(yAxis_counts_log);
            death_loggraph.append("g")
                .attr("class", "y axis")
                .call(yAxis_deaths_log);

            // Scale the range of the data
            y_counts.domain([0, d3.max(data, function(d) { return d.count; })]);
            y_deaths.domain([0, d3.max(data, function(d) { return d.deaths; })]);
            y_counts_pct.domain([0, d3.max(data, function(d) { return d.count_pct; })]);
            y_deaths_pct.domain([0, d3.max(data, function(d) { return d.deaths_pct; })]);
            y_counts_pct2.domain([0, d3.max(data, function(d) { return d.count_pct2; })]);
            y_deaths_pct2.domain([0, d3.max(data, function(d) { return d.deaths_pct2; })]);
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
                if (d3.event.defaultPrevented) return; // prevent drag from triggering click
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
                    // disable start date button
                    start_date = null;
                    document.getElementById("datebtn").disabled = true;
                    document.getElementById("startdate").readOnly = true;
                    // x Axis as days-since-case-100
                    dataFilter = dataFilter.filter(function(d){return d.days100 >= 0 });
                    x = d3.scale.linear().range([0, w/2]);
                    x.domain([0, d3.max(dataFilter, function(d) { return d.days100; })]);
                    xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
                    d3.selectAll(".x").transition(t).call(xAxis);
                } else {
                    // disable start date button
                    document.getElementById("datebtn").disabled = false;
                    document.getElementById("startdate").readOnly = false;
                    // Check if a start date is set
                    start_date = d3.select("#startdate").property("value")+"/20";
                    start_date = parseDate(start_date);
                    if (start_date >= d3.min(data, function(d){return d.date}) && start_date <= d3.max(data, function(d){return d.date})) {
                        dataFilter = dataFilter.filter(function(d){return d.date >= start_date })  
                    }
                    // Set up the x axis
                    x = d3.time.scale().range([0, w/2]);
                    x.domain(d3.extent(dataFilter, function(d) { return d.date; }));
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

                var max_count_pct = d3.max(deathsFilter, function(d) { return d.count_pct; });
                y_counts_pct.domain([0, max_count_pct ? max_count_pct : 100 ]);
                yAxis_counts_pct.scale(y_counts_pct);
                cases_pctgraph.select(".y").transition(t).call(yAxis_counts_pct);
                var max_deaths_pct = d3.max(deathsFilter, function(d) { return d.deaths_pct; });
                y_deaths_pct.domain([0, max_deaths_pct ? max_deaths_pct : 100]);
                yAxis_deaths_pct.scale(y_deaths_pct);
                death_pctgraph.select(".y").transition(t).call(yAxis_deaths_pct);

                var max_count_pct2 = d3.max(deathsFilter, function(d) { return d.count_pct2; });
                y_counts_pct2.domain([0, max_count_pct2 ? max_count_pct2 : 100]);
                yAxis_counts_pct2.scale(y_counts_pct2);
                cases_pct2graph.select(".y").transition(t).call(yAxis_counts_pct2);
                var max_deaths_pct2 = d3.max(deathsFilter, function(d) { return d.deaths_pct2; });
                y_deaths_pct2.domain([0, max_deaths_pct2 ? max_deaths_pct2 : 100]);
                yAxis_deaths_pct2.scale(y_deaths_pct2);
                death_pct2graph.select(".y").transition(t).call(yAxis_deaths_pct2);

                y_counts_log.domain([cases100 ? 100 : 1, d3.max(countsFilter, function(d) { return d.count; })]);
                yAxis_counts_log.scale(y_counts_log);
                cases_loggraph.select(".y").transition(t).call(yAxis_counts_log);
                y_deaths_log.domain([1, d3.max(deathsFilter, function(d) { return d.deaths; })]);
                yAxis_deaths_log.scale(y_deaths_log);
                death_loggraph.select(".y").transition(t).call(yAxis_deaths_log);

                d3.selectAll("path.line").remove(); 
                d3.selectAll("line.guide").remove(); 
                d3.selectAll("circle").remove(); 

               // Add guide lines to pct graphs
               cases_pctgraph.append("line")
                    .attr("class", "line guide")
                    .attr("stroke", "gray")
                    .attr("x1", 0)
                    .attr("y1", y_counts_pct(100))
                    .attr("x2", w/2)
                    .attr("y2", y_counts_pct(100));
               cases_pct2graph.append("line")
                    .attr("class", "line guide")
                    .attr("stroke", "gray")
                    .attr("x1", 0)
                    .attr("y1", y_counts_pct2(100))
                    .attr("x2", w/2)
                    .attr("y2", y_counts_pct2(100));
               death_pctgraph.append("line")
                    .attr("class", "line guide")
                    .attr("stroke", "gray")
                    .attr("x1", 0)
                    .attr("y1", y_deaths_pct(100))
                    .attr("x2", w/2)
                    .attr("y2", y_deaths_pct(100));
               death_pct2graph.append("line")
                    .attr("class", "line guide")
                    .attr("stroke", "gray")
                    .attr("x1", 0)
                    .attr("y1", y_deaths_pct2(100))
                    .attr("x2", w/2)
                    .attr("y2", y_deaths_pct2(100));

                
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
                    // pct 
                    cases_pctgraph.append("path")
                        .attr("class", "pct line")
                        .attr("stroke",countrycolors(selected_countries.indexOf(d.key)%10))
                        .attr("id",d.key.replace(" ", "_")+"-count")
                        .attr("d", countpctline(d.values))
                    // pct2
                    cases_pct2graph.append("path")
                        .attr("class", "pct line")
                        .attr("stroke",countrycolors(selected_countries.indexOf(d.key)%10))
                        .attr("id",d.key.replace(" ", "_")+"-count")
                        .attr("d", countpct2line(d.values))
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
                    // pct
                    death_pctgraph.append("path")
                        .attr("class", "pct line")
                        .attr("stroke",countrycolors(selected_countries.indexOf(d.key)%10))
                        .attr("id",d.key.replace(" ", "_")+"-death")
                        .attr("d", deathpctline(d.values));
                    // pct2
                    death_pct2graph.append("path")
                        .attr("class", "pct line")
                        .attr("stroke",countrycolors(selected_countries.indexOf(d.key)%10))
                        .attr("id",d.key.replace(" ", "_")+"-death")
                        .attr("d", deathpct2line(d.values));
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