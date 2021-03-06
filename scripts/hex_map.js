var render_map = function()
{
	var radius = 50;
	var height = game.height * radius * 1.5;
	var width  = game.width  * radius * 1.5;

	var topology = hexTopology(radius, width, height);

	var projection = hexProjection(radius);

	var path = d3.geo.path()
		.projection(projection);


	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height);

	var info_box = d3.select("body").append("div").attr("id", "population_info");

	svg.append("g")
		.attr("class", "hexagon")
	  .selectAll("path")
		.data(topology.objects.hexagons.geometries)
	  .enter().append("path")
		.attr("d", function(d) { return path(topojson.feature(topology, d)); })
		.attr("class", land_and_population)
		.attr("style", population_heartbeat)
		.on("mousedown", mousedown)
		//.on("mousemove", mousemove)
		//.on("mouseup", mouseup);

	svg.append("path")
		.datum(topojson.mesh(topology, topology.objects.hexagons))
		.attr("class", "mesh")
		.attr("d", path);

	var border = svg.append("path")
		.attr("class", "border")
		.call(redraw);

	var mousing = 0;

	function land_and_population(d) {
		var classes = "";

		classes += d.land;

		classes += " "

		classes += d.population ? "population" : "";

		return classes;
	}

	function population_heartbeat(d) {
		//d.population.lifespan
		if(d.population)
		{
			//var speed = d.population.count/d.population.species.lifespan;
			var speed = d.population.species.lifespan * 1;
			return "-webkit-animation-duration: "+speed+"s !important;"
		}
	}

	function mousedown(d) {
		if(d.population)
		{
			$('#population_info').text("On "+d.land + ", Population Ever: " + d.population.count_ever + " Lifespan: "+d.population.species.lifespan);
		}
		else
		{

			$('#population_info').text("");
		}
	}

	function mousemove(d) {
	  if (mousing) {
		d3.select(this).classed("fill", d.fill = mousing > 0);
		border.call(redraw);
	  }
	}

	function mouseup() {
	  mousemove.apply(this, arguments);
	  mousing = 0;
	}

	function redraw(border) {
	  border.attr("d", path(topojson.mesh(topology, topology.objects.hexagons, function(a, b) { return a.land ^ b.land; })));
	}

	function hexTopology(radius, width, height) {
	  var dx = radius * 2 * Math.sin(Math.PI / 3),
		  dy = radius * 1.5,
		  m = Math.ceil((height + radius) / dy) + 1,
		  n = Math.ceil(width / dx) + 1,
		  geometries = [],
		  arcs = [];

	  for (var j = -1; j <= m; ++j) {
		for (var i = -1; i <= n; ++i) {
		  var y = j * 2, x = (i + (j & 1) / 2) * 2;
		  arcs.push([[x, y - 1], [1, 1]], [[x + 1, y], [0, 1]], [[x + 1, y + 1], [-1, 1]]);
		}
	  }

	  // i = x, j = y
	  for (var j = 0, q = 3; j < m; ++j, q += 6) {
		for (var i = 0; i < n; ++i, q += 3) {
		  geometries.push({
			type: "Polygon",
			arcs: [[q, q + 1, q + 2, ~(q + (n + 2 - (j & 1)) * 3), ~(q - 2), ~(q - (n + 2 + (j & 1)) * 3 + 2)]],
			land: Math.random() > i / n * 2 ? "Land" : "Water",
			population: game.population_at(i, j)
		  });
		}
	  }

	  return {
		transform: {translate: [0, 0], scale: [1, 1]},
		objects: {hexagons: {type: "GeometryCollection", geometries: geometries}},
		arcs: arcs
	  };
	}

	function hexProjection(radius) {
	  var dx = radius * 2 * Math.sin(Math.PI / 3),
		  dy = radius * 1.5;
	  return {
		stream: function(stream) {
		  return {
			point:        function(x, y) { stream.point(x * dx / 2, (y - (2 - (y & 1)) / 3) * dy / 2); },
			lineStart:    function() { stream.lineStart(); },
			lineEnd:      function() { stream.lineEnd(); },
			polygonStart: function() { stream.polygonStart(); },
			polygonEnd:   function() { stream.polygonEnd(); }
		  };
		}
	  };
	}
};
