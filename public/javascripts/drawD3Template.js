//Constants for the SVG
var width = window.innerWidth,
    height = 350;

// Resolves collisions between d and all other circles.
var linkDistance = 120;
var padding = 5; // separation between circles
var radius=30;


// d3.json("/graph.json", function(error, graph) {
//     if (error) throw error;

var graphD3Template = function(graph) {
    //Set up the colour scale
    var color = d3.scale.category20();

    //Set up the force layout
    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(linkDistance)
        .size([width, height]);

    var el = document.querySelector( 'svg' );
    if (el) {
        el.parentNode.removeChild( el );
    }
    //Append a SVG to the body of the html page. Assign this SVG as an object to svg
    var svg = d3.select("body").insert("svg",":first-child")
        .attr("width", width)
        .attr("height", height);

    //Creates the graph data structure out of the json data
    force.nodes(graph.nodes)
        .links(graph.links)
        .start();

    //Create all the line svgs but without locations yet
    var link = svg.selectAll('.link')
        .data(graph.links)
        .enter().append("line")
        .attr('class', 'link')
        .style("stroke","black")
        .style("stroke-width", 2);

    //Do the same with the circles for the nodes - no 
    var node = svg.selectAll(".node")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", radius)
        .style("fill", function (d) {
            return color(d.group);
        });
        // .call(force.drag);


    //Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
    force.on("tick", function () {
        link.attr("x1", function (d) {
            return d.source.x;
        })
            .attr("y1", function (d) {
            return d.source.y;
        })
            .attr("x2", function (d) {
            return d.target.x;
        })
            .attr("y2", function (d) {
            return d.target.y;
        });

        node.attr("cx", function (d) {
            return d.x;
        })
            .attr("cy", function (d) {
            return d.y;
        });
        
        node.each(collide(0.5)); //Added
    });

    //---Insert------
    

    function collide(alpha) {
      var quadtree = d3.geom.quadtree(graph.nodes);
      return function(d) {
        var rb = 2*radius + padding,
            nx1 = d.x - rb,
            nx2 = d.x + rb,
            ny1 = d.y - rb,
            ny2 = d.y + rb;
        
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y);
              if (l < rb) {
              l = (l - rb) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    }
}

