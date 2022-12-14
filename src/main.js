var margin = {top: 50, right: 130, bottom: 5, left:  30},
width = window.innerWidth/1.9 - margin.left - margin.right,
height = innerHeight/2.3 - margin.top - margin.bottom
dataStore = {},
displayDims = [],
brush = d3.scaleOrdinal(),
dims = [],
pcpX = d3.scalePoint(),
pcpY = {},
filtered = [],
pcp = null;
nonBundledPortion = 4, // Fraction of distance between axis reserved for non bundled lines
bundlingEnabled = true,
groups = {},
currentBrush = "Cluster",
paths = null,
 currentSelection = "",
inPointSelect = []
inBrushSelect = []

// Load for parallel coordinates
d3.csv("data/final.csv").get( function(data) {
        // Setup groups for brushing
        let getMembers = (key) => [...new Set(data.map(d => d[key]))].sort();
        groups = {
            "Cluster" : getMembers("Cluster"),
            "Social drinker" : getMembers("Social drinker"),
            "Social smoker" : getMembers("Social smoker")
        }

         // Main store of dimentions that doesnt get changed
        dims = Object.keys(data[0]).filter(function(d) {
            return (d == "Age" ||
                d == "Body mass index" ||
                d == "Work load Average/day " ||
                d == "Absenteeism time in hours"
                ) ?  d : null
        });

        // Dimensions that are shown
        displayDims = dims

        buildControls(data);
        buildPCP(data);
        buildDists(data);
        buildScatter(data);

        
        // Hacky responsiveness
        // TODO: dont reload whole page...
        window.addEventListener('resize', () => {
            location.reload();
        } );

    
    });

// Build the scatter plot for components of FA
function buildScatter(data){
    var margin = {top: 0, right: 100, bottom: 30, left: 40},
    width = window.innerWidth/2.8 - margin.left - margin.right,
    height = window.innerHeight/2.3 - margin.top - margin.bottom;

    // Get max and min of X and Y to form axis domains
    var xMax = d3.max(data, function(d) { return +d['Component 0'];});
    var xMin = d3.min(data, function(d) { return +d['Component 0'];});
    var yMin = d3.max(data, function(d) { return +d['Component 1'];});
    var yMax = d3.min(data, function(d) { return +d['Component 1'];});

    scatter = d3.select("#scatter")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    
    labelArea = scatter.append("g")
        .attr("class", "h6 small")
        .attr("transform","translate(" + (margin.left) + "," + (margin.top-3) + ")");

    svg = scatter.append("g")
        .attr("class", "h6 small")
        .attr("transform",
            "translate(" + (margin.left) + "," + (margin.top-3) + ")");

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
        a = svg.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
            .attr("cx", function (d) {return x(d['Component 0']); } )
            .attr("cy", function (d) { return y(d['Component 1']); } )
            .attr("r", 3)
            .style("fill", function(d){return brush(d[currentBrush])})    


        // Add axis labels
        labelArea.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("class", "y-label h6")
            .text("Component 1");

        labelArea.append("text")
            .attr("transform",
                    "translate(" + (width/2) + " ," + (height + 30  ) + ")")
            .attr("class", "x-label h6")
            .attr("text-anchor", "middle")
            .text("Component 0");

        svg.call(d3.brush()
            .on("start end", function(d, event) {updatePointSelection(data, d3.event.selection, x, y, "Component 0", "Component 1")})
                
        )
}

function updatePointSelection(data, extent, xScale, yScale, x, y) {
    // Helpers

    function inSelect(d) {
        if (x == null) {
            // Only check assert y values if no x is given
            return isInSelectPoints(extent, null, yScale(d[y])) ? d : null
        }
        return isInSelectPoints(extent, xScale(d[x]), yScale(d[y])) ? d : null
    }

    function isHighlighted(d) {
        if (
            (inPointSelect.includes(d) && inBrushSelect.includes(d) ||
            inBrushSelect.length === 0 && inPointSelect.includes(d))
        ) {
            return true
        }
       return false
    }

    if (extent == null) {
        // Check if current brush still active
        if (inBrushSelect.length === 0) {
            // Reset to default
            d3.selectAll("circle").style("opacity", 1)
            // Reset all points
            paths.style("opacity", 0.5)
            paths.each(function(d) { 
                var firstChild = this.parentNode.firstChild;
                if (firstChild) {
                    this.parentNode.insertBefore(this, firstChild);
                }
                
            })
        } else {
            // update paths
            paths.style("opacity", (d) => inBrushSelect.includes(d) ? 0.5 : 0.1)
            
            d3.selectAll("circle").style("opacity", (d) => inBrushSelect.includes(d) ? 1 : 0.2)

            console.log(paths)
            
        }
        
        inPointSelect = []
        
    } else {
        inPointSelect = data.filter((d) => inSelect(d))

        function isHighlight(d) {
            if (inBrushSelect.length === 0) {
                return inPointSelect.includes(d)
            } else {
                return inPointSelect.includes(d) && inBrushSelect.includes(d)
            }
        }

        // Only focus ponits that are in the current brush if active
        d3.selectAll("circle").classed("unselected", null)
        d3.selectAll("#firstRow").selectAll("circle").style("opacity", (d) => isHighlight(d) ? 1: 0)
        d3.selectAll("#scatter").selectAll("circle").style("opacity", (d) => isHighlight(d) ? 1 : 0.2)

        // Update PCP paths
        paths.style("opacity", (d) => isHighlight(d) ? 1 : 0) 
  
     }

}
    
  
   // A function that return TRUE or FALSE according if a dot is in the selection or not
   function isInSelectPoints(brush_coords, cx, cy) {
    
    var x0 = brush_coords[0][0],
        x1 = brush_coords[1][0],
        y0 = brush_coords[0][1],
        y1 = brush_coords[1][1];

    // If no x value given i.e. for non continious x, only uses y
    if (cx == null) {
        console.log(y0 <= cy && cy <= y1)
        return y0 <= cy && cy <= y1 
    }
   return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;    // This return TRUE or FALSE depending on if the points is in the selected area
}

function resetPointSelect(data) {
    console.log("NONE")
    temp = currentSelection
    currentSelection = ""
    selection(temp, data)
}


function buildPCP(data) {
    // Setup main plot
    pcp = d3.select("#pcp")
        .append("svg")
            .attr("width", window.innerWidth)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
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
            .domain(d3.extent(data, function(d) { return +d[name] }))
            .range([height, 0])
    }

    // Plot paths
    paths = pcp.selectAll("myPath").data(data)
           .enter()
           .append("path")
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
      d3.select(this).style("opacity", "0.35");
    })
    .on("drag", function(event, d) {
        d3.select(this).attr("transform", "translate(" + d3.event.x + ")");
    })
    .on("end", function(event, d) {
        // Move selected axes to next closest position from drop location
        let axisPos = width/displayDims.length;
        let currentIdx = d;
        let nextIdx = Math.floor(Math.min(width, Math.max(0, d3.event.x))/axisPos);

        displayDims = displayDims.move(currentIdx, nextIdx);

        // Redraw PCP
        removePcp();
        drawPcp(data);
    }))
    .attr("transform", function(d) { return "translate(" + pcpX(d) + ")"; })
    .each(function(d) {
        d3.select(this).call(d3.axisLeft().scale(pcpY[d]));
    })
    .append("text")
    .style("text-anchor", "middle")
    .text(function(d) { return d; })
    .style("fill", "black")
    .attr("class",  "h6 pcp-axis-label")
    .attr("y", "-15").on("mouseover", function (d) {
        d3.select(this)
            .style("cursor", "move")
    })

    // Check if selection has been previosly made
    if (inPointSelect.length !== 0 || inBrushSelect.length !== 0) {
        nextSelection = currentSelection
        currentSelection = ""
       
        selection(nextSelection, data)
    }
}

 // Implementation based on: https://ieeexplore.ieee.org/document/8107953
 function path(d) {
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
        //console.log(d)

        // Mean of cluster after axis moved a portion of the x scale
        if (i != displayDims.length - 1) {
            ctrPts.push([
                pcpX(displayDims[i]) + (pcpX(displayDims[i+1]) - pcpX(displayDims[i]))/nonBundledPortion, 
                pcpY[displayDims[i]](d[displayDims[i]+"_m"])])
            }    
    }
    //console.log(ctrPts)
    // Create bezzier for this row 
    return d3.line().curve(d3.curveBasis)(ctrPts); 
    
}

function buildControls(data) {
    // Build legend dropdown
    d3.select("#brushSelect")
        .selectAll("myOptions")
        .data(Object.keys(groups))
        .enter()
        .append("option")
        .text(function (d) { return d; })
        .attr("value", function (d) { return d; })
        .style("float", "right")
    
    d3.select("#brushSelect")
        .on("change", function(d) {
        // Change to selected group and redraw
            removeLegend()
            currentBrush = d3.select(this).property("value")
            updateBrush()
            buildLegend(data)
        })
    buildLegend(data)
    
    // Line bundling options
    d3.select("#buttons")
        .append("text")
        .attr("class", "h6 control-heading")
        .text("Line bundling")
    
    // Add toggle
    d3.select("#buttons")
        .append("div")
        .attr("class", "custom-control custom-switch bundle-toggle")
    
    d3.select(".bundle-toggle")
        .append("input")
        .attr("class", "custom-control-input")
        .attr("type", "checkbox")
        .attr("role", "switch")
        .attr("id", "bundleToggle")
        .attr("checked", true)
        .on("click", d => {
            bundlingEnabled = bundlingEnabled ? false : true;
            // Update the bundle slider
            d3.select("#bundleSlider").attr("disabled", bundlingEnabled ? null : false)

            // Redraw PCP plot
            removePcp();
            drawPcp(data);

        })

    d3.selectAll(".bundle-toggle")
        .append("label")
        .text("Enabled")
        .attr("for", "bundleToggle")
        .attr("class", "custom-control-label")

    // Add slider
    d3.select("#buttons")
        .append("div")
        .attr("class", "bundle-slider")
    
    d3.selectAll(".bundle-slider")
        .append("label")
        .text("Non-bundled portion")
        .attr("for", "bundleSlider")
        .attr("class", "input-label")

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

    // Dimensions toggles
    d3.selectAll("#buttons")
        .append("text")
        .text("Dimensions")
        .attr("class", "h6 control-heading")

    d3.select("#buttons").selectAll("myAxis")
        .data(dims)
        .enter()
        .append("div")
        .attr("class", "custom-control custom-switch dims-toggle")

    d3.selectAll(".dims-toggle")
        .append("input")
        .attr("class", "custom-control-input")
        .attr("id", function(d) { return d })
        .attr("type", "checkbox")
        .attr("role", "switch")
        .attr("checked", true)
        .on("click", d => filterDimensions(d));

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
    var members = groups[currentBrush]
    brush.domain(members).range(d3.schemeSet1)
    var w = 60 +  members.length*(3+30) + 10

    legend = d3.select("#legendSelect")
        .append("svg")
            .attr("width", w)
            .attr("height", 50)
            .style("float", "right")


    legend.selectAll("mylabels")
        .data(members)
        .enter()
        .append("text")
            .attr("x", function(d,i){ return 60 + i*(3+30)})
            .attr("y", 45)
            .text(function(d){ return d})
            .attr("text-anchor", "right")
            .attr("class", "h6")
            .style("alignment-baseline", "middle")

    let xPos = members.length == 2 ? 60 : 55
    legend.selectAll("mydots")
        .data(members)
        .enter()
        .append("g")
        .append("rect")
            .attr("x", function(d,i){ return xPos + i*(3+30)})
            .attr("y", 10)
            .attr("width", "20")
            .attr("height", "20")
            .style("fill", function(d) { return brush(d)})
        .on("click", (d) => selection(d, data));

        d3.selection.prototype.moveToFront = function(d) {
            this.each(function(d){
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

    
}

// Apply brush on click
function selection(value, data) {
    if (currentSelection === value && d3.event.type == "click") {
        console.log("RESET")
        d3.select(d3.event.target).classed("active", (x) => x in window ? false: null)

        currentSelection = "";
       
        // Send back if not in point select
        paths.each(function(d) { 
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
                    this.parentNode.insertBefore(this, firstChild);
            }
            
        })

        // Ensure selected points are kept
        d3.selectAll("#firstRow").selectAll("circle").style("opacity", (d) => (inPointSelect.includes(d) || inPointSelect.length === 0) ? 1 : 0)
        d3.selectAll("#scatter").selectAll("circle").style("opacity", (d) => (inPointSelect.includes(d) || inPointSelect.length === 0) ? 1 : 0.2)
        paths.style("opacity", (d) => (inPointSelect.includes(d) || inPointSelect.length === 0) ? 0.5 : 0)
        inBrushSelect = []

    } else {
        if (d3.event.type ==  "click") {
            d3.select(d3.event.target).classed("active", (x) => x in window ? true: null)
        }

        currentSelection = value
        inBrushSelect = data.filter((d) => d[currentBrush] == value ? d : null )
        
        // Bring everything in group to front
        paths.each(function(d) { 
            if (inBrushSelect.includes(d)) {
                this.parentNode.appendChild(this);
            }
            
        })

        // Bring axes and ticks back to front
        pcp.selectAll("g").each(function(d) {
                this.parentNode.appendChild(this);
            
        })

        
        // Account for point selection brush
        if (inPointSelect.length === 0) {
            d3.selectAll("circle").style("opacity", (d) => inBrushSelect.includes(d) ? 1 : 0.2)
            paths.style("opacity", (d) => inBrushSelect.includes(d) ? 1 : 0.05)

        } else if (inBrushSelect.length === 0) {
            console.log("in brush")
            // Incase of redraw with no selection brush
            d3.selectAll("#firstRow").selectAll("circle").style("opacity", (d) => inPointSelect.includes(d) ? 1 : 0)
            d3.selectAll("#scatter").selectAll("circle").style("opacity", (d) => inPointSelect.includes(d) ? 1 : 0.2)
            paths.style("opacity", (d) => inPointSelect.includes(d) ? 0.5 : 0)
        }
        else {
            d3.selectAll("#firstRow").selectAll("circle").style("opacity", (d) => inPointSelect.includes(d) && inBrushSelect.includes(d) ? 1 : 0)
            d3.selectAll("#scatter").selectAll("circle").style("opacity", (d) => inPointSelect.includes(d) && inBrushSelect.includes(d)? 1 : 0.2)
            paths.style("opacity", (d) => inPointSelect.includes(d) && inBrushSelect.includes(d) ? 0.5 : 0)
        
        }

    }
}

// Removes the PCP plot
function removePcp() {
    pcpX.domain(displayDims)
    pcp.selectAll("g").remove();
    pcp.selectAll("path").remove();
}

// Helper to swap array indeces
Array.prototype.move = function(from,to){
    this.splice(to,0,this.splice(from,1)[0]);
    return this;
}

function updateBrush() {
    d3.selectAll("circle").style("fill", function(d){ return(brush(d[currentBrush]))})
    paths.style("stroke", function(d){ return(brush(d[currentBrush]))})
}