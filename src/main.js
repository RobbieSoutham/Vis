// Try to create bezzier from scratch acording to control points in paper
var margin = {top: 30, right: 0, bottom: 30, left: 30},
    width = window.innerWidth/2.15 - 100 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var dataStore = {}
var displayDims = []
var brush = d3.scaleOrdinal()
var dims
var pcpX = d3.scalePoint()
var pcpY = {}
var filtered = []
var pcp = null;
var dragging = {}
var axisGroup = []
var brushes = ["Label", "Social drinker", "Social smoker"]
// Fraction of distance between axis reserved for non bundled lines
var nonBundledPortion = 4
var bundlingEnabled = true;
var groups = {}
var currentBrush = "Label"
var paths = null;
currentSelection = "";

// Load for parallel coordinates
d3.csv("data/test2.csv").then( function(data) {
        // Setup groups for brushing
        let getMembers = (key) => [...new Set(data.map(d => d[key]))].sort();
        groups = {
            "Label" : getMembers("Label"),
            "Social drinker" : getMembers("Social drinker"),
            "Social smoker" : getMembers("Social smoker")
        }

         // Main store of dimentions that doesnt get changed
        dims = Object.keys(data[0]).filter(function(d) {
            return (d == "Label" || d.endsWith("_m") || d.endsWith("_m2") || d == "Social smoker" || d=="Social drinker" ) ?  null : d
        });

        // Dimensions that are shown
        displayDims = Object.keys(data[0]).filter(function(d) {
            return (d == "Label" || d.endsWith("_m") || d.endsWith("_m2") || d == "Social smoker" || d=="Social drinker" ) ?  null : d
        });

        buildControls(data);
        buildPCP(data);
        
    });

// Load for DR scatter
d3.csv("data/reduced_clustured.csv")
    .then(function(data) {
        console.log(data)
        var margin = {top: 10, right: 30, bottom: 40, left: 50},
        width = window.innerWidth/2.7 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

        var xMax = d3.max(data, function(d) { return +d['F_1'];});
        var xMin = d3.min(data, function(d) { return +d['F_1'];});
        var yMin = d3.max(data, function(d) { return +d['F_2'];});
        var yMax = d3.min(data, function(d) { return +d['F_2'];});

        svg = d3.select("#scatter")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                "translate(" + (margin.left) + "," + (margin.top) + ")");

            // Add X axis
            var x = d3.scaleLinear()
                .domain([xMin, xMax])
                .range([ 0,  width]);
            svg.append("g")
                .attr("class", "xAxis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            // Add Y axis
            var y = d3.scaleLinear()
                .domain([yMin, yMax])
                .range([0, height]);
            svg.append("g")
                .attr("class", "yAxis")
                .call(d3.axisLeft(y));

            // Add points
            svg.append('g')
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
                .attr("cx", function (d) { console.log(d['F_1']); return x(d['F_1']); } )
                .attr("cy", function (d) { return y(d['F_2']); } )
                .attr("r", 3)
                .style("fill", function(d){
                    ;return brush(d[currentBrush])
                })    


            // Add axis labels
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .attr("class", "y label")
                .text("F2");

            svg.append("text")
                .attr("transform",
                        "translate(" + (width/2) + " ," + 
                        (height + margin.bottom) + ")")
                .attr("class", "x label")
                .attr("text-anchor", "middle")
                .text("F1");


    });
function buildPCP(data) {
    // Setupmain plot
    pcp = d3.select("#pcp")
        .append("svg")
            .attr("width", window.innerWidth)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .style("viewBox", "0 0 100 100")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

     // Build x scales
    pcpX
     .range([0, width])
     .padding(0.3)
     .domain(displayDims)
     
    drawPcp(data);
     
}

function drawPcp(data) {
     // Build y scales for each dimension
     for (dim in displayDims) {
        let name = displayDims[dim]
        pcpY[name] = d3.scaleLinear()
            .domain(d3.extent(data, function(d) {;return +d[name];}))
            .range([height, 0])
    }

    // Plot paths
   paths = pcp.selectAll("myPath").data(data)
           .enter()
           .append("path")
           //.attr("class", function(d) { return d['Label']; })
           .attr("d", path)
           .style("fill", "none")
           .style("opacity", 0.5)
           .style("stroke", function(d){
               return brush(d[currentBrush])
           });

           
    // Setup axis
   axisGroup = pcp.selectAll("myAxis").data(displayDims).enter()
    .append("g")
    .call(d3.drag()
    .on("start", function(event, d) {
      dragging[d] = this.__origin__ = pcpX(d);
      event.subject.active = true;
      d3.select(this).style("opacity", "0.35");
    })
    .on("drag", function(event, d) {
        console.log(event)
        d3.select(this).attr("transform", "translate(" + event.x + ")");
    })
    .on("end", function(event, d) {
        let axisPos = width/displayDims.length;
        let currentIdx = displayDims.indexOf(d);
        let nextIdx = Math.floor(Math.min(width, Math.max(0, event.x))/axisPos);

        displayDims = displayDims.move(currentIdx, nextIdx);
        
        console.log(Math.max(0, this.__origin__ += event.x))
        console.log(currentIdx, nextIdx, Math.min(width, Math.max(0, event.x))/axisPos)

        removePcp();
        drawPcp(data);

        d3.select(this).style("opacity", 1);
    })  
    )
    .attr("transform", function(d) { return "translate(" + pcpX(d) + ")"; })
    .each(function(d) {
        d3.select(this).call(d3.axisLeft().scale(pcpY[d]));
    })
    .append("text")
    .style("text-anchor", "middle")
    .text(function(d) { return d; })
    .style("fill", "black")
    .attr("y", "-15").on("mouseover", function(event, d) {
        console.log("hover");
        d3.select(event.currentTarget)
            .style("cursor", "move")
    })
}

 // Implementation based on: https://ieeexplore.ieee.org/document/8107953
 function path(d, row) {
    if (!bundlingEnabled) {
    return d3.line()(displayDims.map(function(p) { return [pcpX(p), pcpY[p](d[p])]; }));
    }
    let ctrPts = [];


    // Build series of control points for the bezier around each axis
    for (let i = 0; i < displayDims.length; i++) {
        if (i != 0) {
            // First control point - actual value
            ctrPts.push([
                pcpX(displayDims[i]) - (pcpX(displayDims[i]) - pcpX(displayDims[i-1]))/nonBundledPortion, 
                pcpY[displayDims[i]](d[displayDims[i]+"_m"])])

            
            // Second is mean of the cluster
            ctrPts.push([pcpX(displayDims[i]), pcpY[displayDims[i]](d[displayDims[i]+"_m"])])
        }

        // Actual value and mean of cluster
        ctrPts.push([pcpX(displayDims[i]), pcpY[displayDims[i]](d[displayDims[i]])])
        ctrPts.push([pcpX(displayDims[i]), pcpY[displayDims[i]](d[displayDims[i]+"_m"])])

        // Mean of cluster after axis moved a portion of the x scale
        if (i != displayDims.length - 1) {
            ctrPts.push([
                pcpX(displayDims[i]) + (pcpX(displayDims[i+1]) - pcpX(displayDims[i]))/nonBundledPortion, 
                pcpY[displayDims[i]](d[displayDims[i]+"_m"])])
            }    
    }

    // Create bezzier for this row 
    return d3.line().curve(d3.curveBasis)(ctrPts); 
    
}

function buildControls(data) {
    // Build legend dropdown
    d3.selectAll("#brushSelect")
        .selectAll("myOptions")
        .data(Object.keys(groups))
        .enter()
        .append("option")
        .text(function (d) { return d; })
        .attr("value", function (d) { return d; })
    d3.selectAll("#brushSelect") .on("input", function(d) {
        // Change to selected group and redraw
        removeLegend();
        currentBrush = d3.select(this).property("value")
        buildLegend(data);
        removePcp();
        drawPcp(data);
    })
    buildLegend(data);
    
    // Line bundling options
    d3.selectAll("#buttons")
        .append("text")
        .text("Line bundling")
        .style("font-weight", "bold")
    
    d3.select("#buttons")
        .append("div")
        .attr("class", "custom-control custom-switch bundle-toggle")
    
    d3.select("#buttons")
        .append("div")
        .attr("class", "bundle-slider")
    
    d3.select(".bundle-toggle")
        .append("input")
        .attr("class", "custom-control-input")
        .attr("type", "checkbox")
        .attr("role", "switch")
        .attr("id", "bundleToggle")
        .attr("checked", true)
        .on("click", d => {
            bundlingEnabled = bundlingEnabled ? false : true;
            removePcp();
            drawPcp(data);

        });

    d3.selectAll(".bundle-toggle")
        .append("label")
        .text("Enabled")
        .attr("for", "bundleToggle")
        .attr("class", "custom-control-label")
    
    d3.selectAll(".bundle-slider")
        .append("label")
        .text("Non-bundled portion")
        .attr("for", "bundleSlider")
        .attr("class", "form-label")

    d3.select(".bundle-slider")
        .append("input")
        .attr("type", "range")
        .attr("min", 1)
        .attr("id", "bundleSlider")
        .attr("max", 5)
        .attr("value", nonBundledPortion)
        .attr("class", "form-range")
        .on("change", function(d)  {
            nonBundledPortion = this.value;
            removePcp();
            drawPcp(data);
        })

    

    // Build selection toggles for dimensions
    d3.selectAll("#buttons")
        .append("text")
        .text("Dimensions")
        .style("font-weight", "bold")
    d3.select("#buttons").selectAll("myAxis")
        .data(displayDims)
        .enter()
        .append("div")
        .attr("class", "custom-control custom-switch dims-toggle")

    d3.selectAll(".dims-toggle")
        .append("input")
        .attr("class", "custom-control-input")
        .attr("type", "checkbox")
        .attr("role", "switch")
        .attr("checked", true)
        .on("click",d => filterDimensions(d.path[0].id));

    d3.selectAll(".dims-toggle")
        .append("label")
        .text(function(dim) { return dim })
        .attr("for", function(dim) { return dim })
        .attr("class", "custom-control-label")




    // Replots with updated dimensions
    function filterDimensions(dim) {  
        displayDims = dims;

        // Update displayed dims
        if (filtered.includes(dim)) {
            filtered = filtered.filter(function(dim2) {
                return dim2 !== dim;
            })
        } else {
            filtered.push(dim);
        }
        filtered.forEach(dim1 => {
            displayDims = displayDims.filter(function(dim2) {
                return dim2 !== dim1;
            })
        })

        // Remove previous plot
        removePcp(data);
        drawPcp(data);
    }
}

function removeLegend() {
    d3.selectAll("#legend").selectAll("svg").remove();
}

function buildLegend(data) {
    var members = groups[currentBrush];
    brush.domain(members);
    brush.range(["red", "green", "blue"]);

    legend = d3.select("#legend").append("svg").attr("width", 150).style("float", "right")


    legend.selectAll("mylabels")
        .data(members)
        .enter()
        .append("text")
            .attr("x", 75)
            .attr("y", function(d,i){ return 15 + i*(3+20)})
            .text(function(d){ return d})
            .attr("text-anchor", "right")
            .style("alignment-baseline", "middle")
        .on("click", selection);

    legend.selectAll("mydots")
        .data(members)
        .enter()
        .append("g")
        .append("rect")
            .attr("x", 50)
            .attr("y", function(d,i){ return 5 + i*(3+20)})
            .attr("width", "20")
            .attr("height", "20")
            .style("fill", function(d) { return brush(d)})
        .on("click", selection);

        d3.selection.prototype.moveToFront = function(d) {
            console.log("moving")
            console.log(d)
            this.each(function(d){
                console.log(d, "asdf");
              this.parentNode.appendChild(this);
            });
          };

          d3.selection.prototype.moveToBack = function() {
            return this.each(function() {
                var firstChild = this.parentNode.firstChild;
                if (firstChild) {
                    this.parentNode.insertBefore(this, firstChild);
                }
            });
        };

    // Apply brush on click
    function selection(elem, value) {
        console.log(currentSelection)
        // Toggle focus
        if (currentSelection == value) {
            currentSelection = "";
            // Send back
            paths.each(function(d) { 
                var firstChild = this.parentNode.firstChild;
                if (firstChild) {
                    this.parentNode.insertBefore(this, firstChild);
                }
                
            })

            paths.style("stroke-width", 1)
            paths.style("opacity", 0.5)
            d3.select("#scatter").selectAll("circle").style("opacity", 1)
            
        } else {
            currentSelection = value

            // Bring to front
            paths.each(function(d) { 
                if (d[currentBrush] == value) {
                    this.parentNode.appendChild(this);
                }
                
            })
    
            paths.style("opacity", function(d) {
                return d[currentBrush] == value ? 1 : 0.1
            })

            d3.select("#scatter").selectAll("circle").style("opacity", function(d) {
                return d[currentBrush] == value ? 1 : 0.2
            })

        }
        

       

       
}
}

function removePcp() {
    pcpX.domain(displayDims)
    pcp.selectAll("g").remove();
    pcp.selectAll("path").remove();
}

function position(d) {
    var v = dragging[d];
    return v == null ? pcpX(d) : v;
  }

  Array.prototype.move = function(from,to){
    this.splice(to,0,this.splice(from,1)[0]);
    return this;
  }
