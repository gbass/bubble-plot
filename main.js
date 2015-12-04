d3.json("nations.json", function(nations) {
	
	// Initialize the filtered nations container
	var filtered_nations = nations.map(function(d) { return d; });

	// Set the year
	var year_idx = parseInt(document.getElementById("year_slider").value) - 1950;
	d3.select("#year_slider").on("input", function() {
		year_idx = parseInt(this.value) - 1950;
		update();
	});
	console.log(year_idx);


	// put everything in here (avoids asynchronous behavior)
	var chart_area = d3.select("#chart_area");  // # is a reference by id
	var svg = chart_area.append("svg");  // append child (of type "svg") to parent
	var canvas = svg.append("g");  // append child (of type "g") to parent

	var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5};
	var svg_width = 960;
	var svg_height = 350;
	var canvas_width = svg_width - margin.left - margin.right;
	var canvas_height = svg_height - margin.top - margin.bottom;

	svg.attr("width", svg_width);
	svg.attr("height", svg_height);

	canvas.attr("transform","translate(" + margin.left + "," + margin.top + ")");

	/*var circle = canvas.append("circle");
	circle.attr({"cx": 50, "cy": 50, "r": 40});  // position, shape
	circle.attr({"fill": "green", "stroke": "black", "stroke-width": 3});  // colors
	*/
	/*circle.attr("cx", 50);
	circle.attr("cy", 50);
	circle.attr("r", 40);
	circle.attr("fill", "green");
	circle.attr("stroke", "black"); */
	//circle.attr({"fill": "blue", "stroke": "orange"});  // to define many attributes in one line


	// Create an axis scale -- this one is logartihmic on the x-axis
	var xScale = d3.scale.log(); // income
	xScale.domain([250, 1e5]); // min and max value
	xScale.range([0, canvas_width]);  // mapping min and max on the canvas
	// could have done var xScale = d3.scale.log().domain([...]).range([...]); too

	// Create the x-axis
	var xAxis = d3.svg.axis().orient("bottom").scale(xScale);

	// Add to our data canvas
	canvas.append("g")
		  .attr("class","x axis")  // this gives it two classes: x and axis; so the main.css file makes it prettier
		  .attr("transform", "translate(0, " + canvas_height + ")")
		  .call(xAxis);


	// Create the y-axis and scale
	var yScale = d3.scale.linear().domain([10, 85]).range([canvas_height, 0]);
	var yAxis = d3.svg.axis().orient("left").scale(yScale);

	canvas.append("g")
		  .attr("class", "y axis")
		  //.attr("transform", "translate(0, " - canvas_width  + ")")  // don't need this since the default position is fine
		  .call(yAxis);

	// Create the radius scale
	var rScale = d3.scale.sqrt().domain([0, 5e8]).range([0,40]);

	// Create the color scale
	var colorScale = d3.scale.category20();

	// Write some axis labels
	svg.append("text")
	    .attr("class", "x label")
	    .attr("text-anchor", "end")
	    .attr("x", canvas_width)
	    .attr("y", canvas_height - 2)
	    .text("income per capita, inflation-adjusted (dollars)");

	svg.append("text")
	    .attr("class", "y label")
	    .attr("text-anchor", "end")
	    .attr("y", 2)
	    .attr("dy", "3.75em")
	    .attr("transform", "rotate(-90)")
	    .text("life expectancy (years)");



	// Add a data canvas
	var data_canvas = canvas.append("g")
							.attr("class", "data_canvas");

	console.log(nations[0]);
	
/*
	var filtered_nations = nations.filter(function(d) {
		return d.region === "Sub-Saharan Africa";
	});
*/

	// Create a tooltip
	var tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("visibility", "hidden");

	// First instance of the graph
	update();

	// Listen for when the checkbox status changes
	// The reserved word "this" holds the callback to the function that caused the change
	d3.selectAll(".region_cb").on("change", function(){
		var type = this.value;  // region name
		if (this.checked == true) {
			var new_nations = nations.filter(function(d) { 
				return d.region == type;
			});
			filtered_nations = filtered_nations.concat(new_nations);
		}
		else {
			filtered_nations = nations.filter(function(d) {
				return d.region != type;
			});
		};
		update();

	});

/*
	var dot = data_canvas.selectAll(".dot")  // select(#ID) vs. selectAll(".classname")
						 .data(filtered_nations, function(d) {return d.name});  // give each unique country name a dot

	// The three key D3 functions are enter(), transition(), and exit()
	dot.enter().append("circle").attr("class", "dot")
			   .attr("cx", function(d) {return xScale(d.income[d.income.length-1]) })
			   .attr("cy", function(d) {return yScale(d.lifeExpectancy[d.lifeExpectancy.length-1]) })
			   .attr("r", function(d) {return rScale(d.population[d.population.length-1]) })
			   .attr("fill", "red")
			   .attr("stroke-width", 3);
			   //.attr("r", 10);


	dot.exit().remove();
*/
	
	// Get the list of unique region names for dynamic label names and region-specific statistics
	//var region_names_list = nations.map(function(d) {return d.region});
	//var region_names = region_names_list.filter(function(v,i) {return region_names.indexOf(v) == i});
	var region_names = ["Sub-Saharan Africa", "South Asia", "Middle East & North Africa", "America", "East Asia & Pacific", "Europe & Central Asia"];

	var region_data = [];
	for (var i in region_names) {
		var filtered_nations_by_regions = nations.filter(function(nation) {
			return (nation.region == region_names[i]);
		});
		region_data[i] = calc_mean(filtered_nations_by_regions);
	}

	var filtered_reg_nations = region_data.map(function(region) {return region;});
	console.log(filtered_reg_nations);

	function calc_mean(region_data) {
	    var mean_income = [];
	    var mean_lifeExpectancy = [];

	    for (var year_idx2 in region_data[0].years) {
	        var sum_income = 0;
	        var sum_lifeExpectancy = 0;
	        var sum_population = 0;

	        for (var k in region_data) {
	            var kpop = region_data[k].population[year_idx2];
	            var kincome = region_data[k].income[year_idx2];
	            var klife = region_data[k].lifeExpectancy[year_idx2];
	            sum_income += kpop*kincome; 
	            sum_lifeExpectancy += kpop*klife;
	            sum_population += kpop;             
	        }

	        mean_income[year_idx2] = sum_income/sum_population;
	        mean_lifeExpectancy[year_idx2] = sum_lifeExpectancy/sum_population;
	    }
	    averageData = {
	        region: region_data[0].region,
	        years: region_data[0].years,
	        mean_income: mean_income,
	        mean_lifeExpectancy: mean_lifeExpectancy
	    };

	    return averageData;
	}

	//console.log(filtered_nations);

	//console.log(nations[1].region);


	// "Update" function definition
	function update() {

		var dot = data_canvas.selectAll(".dot")  // select(#ID) vs. selectAll(".classname")
							 .data(filtered_nations, function(d) {return d.name});  // give each unique country name a dot

		// The three key D3 functions are enter(), transition(), and exit()
		dot.enter().append("circle").attr("class", "dot")
		//		   .attr("cx", function(d) {return xScale(d.income[d.income.length-1]) })
		//		   .attr("cy", function(d) {return yScale(d.lifeExpectancy[d.lifeExpectancy.length-1]) })
		//		   .attr("r", function(d) {return rScale(d.population[d.population.length-1]) })
		//		   .attr("fill", function(d) {return colorScale(d.region); })
				   .style("fill", function(d) {return colorScale(d.region); })
				   .on("mouseover", function(d) {return tooltip.style("visibility", "visible").text(d.name);})
				   .on("mousemove", function() {return tooltip.style("top", (d3.event.pageY-10)+"px").style("left", (d3.event.pageX+10)+"px");})
				   .on("mouseout", function() {return tooltip.style("visibility", "hidden");})
				   .attr("stroke-width", 1);
		
		dot.exit().remove();

		dot.transition().ease("linear").duration(100)
						.attr("cx", function(d) {return xScale(d.income[year_idx]) })
				   		.attr("cy", function(d) {return yScale(d.lifeExpectancy[year_idx]) })
				   		.attr("r", function(d) {return rScale(d.population[year_idx]) });
/*
		var region_dot = data_canvas.selectAll(".dot").data(filtered_reg_nations, function(d) {return d.name});
		region_dot.enter().append("rect").attr("class", "dot")
				   .attr("width", 40)
				   .attr("height", 40)
				   .style("fill", function(d) {return colorScale(d.region); })
				   .on("mouseover", function(d) {return tooltip.style("visibility", "visible").text(d.name);})
				   .on("mousemove", function() {return tooltip.style("top", (d3.event.pageY-10)+"px").style("left", (d3.event.pageX+10)+"px");})
				   .on("mouseout", function() {return tooltip.style("visibility", "hidden");})
				   .attr("stroke-width", 1);

		region_dot.exit().remove();

		region_dot.transition().ease("linear").duration(100)
						.attr("x", function(d) {return xScale(d.income[year_idx]) })
				   		.attr("y", function(d) {return yScale(d.lifeExpectancy[year_idx]) });
*/

/*
	// Add the year label
	svg.removeChild(year_label);
	var year_label = svg.append("text")
	    .attr("text-anchor", "end")
	    .attr("y", canvas_height - 24)
	    .attr("x", canvas_width)
	    .text(year_idx+1950)
	    .attr("font", "Helvetica Neue")
	    .attr("font-size", "196px")
	    .attr("fill", "white");


	var year_label = svg.append("text")
	    .attr("text-anchor", "end")
	    .attr("y", canvas_height - 24)
	    .attr("x", canvas_width)
	    .text(year_idx+1950)
	    .attr("font", "Helvetica Neue")
	    .attr("font-size", "196px")
	    .attr("fill", "#ddd");
*/

	}



	});

