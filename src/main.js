// Try to create bezzier from scratch acording to control points in paper
var margin = {top: 30, right: 0, bottom: 30, left: 0},
    width = 1000 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

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
var bundlingEnabled = true;

d3.csv("data/test2.csv").then( function(data) {
        setupBrush();
        buildPCP(data);
        buildControls(data);

          
        });

function setupBrush(data) {
    // Setup colours
    brush.domain([0, 1, 2]);
    brush.range(['red','green', 'blue'])
    
}

function buildPCP(data) {
     // Main store of dimentions that doesnt get changed
     dims = Object.keys(data[0]).filter(function(d) {
        return (d == "Label" || d.endsWith("_m") || d.endsWith("_m2") || d == "Social smoker" || d=="Social drinker" ) ?  null : d
    });

    displayDims = Object.keys(data[0]).filter(function(d) {
        return (d == "Label" || d.endsWith("_m") || d.endsWith("_m2") || d == "Social smoker" || d=="Social drinker" ) ?  null : d
    });

    // Setup main plot
    pcp = d3.select("#test")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
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
   pcp.selectAll("myPath")
           .data(data)
           .enter()
           .append("path")
           //.attr("class", function(d) { return d['Label']; })
           .attr("d", path)
           .style("fill", "none")
           .style("opacity", 0.5)
           .style("stroke", function(datum, index){
               return brush(datum['Label'])
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
        d3.select(this).attr("transform", "translate(" + event.sourceEvent.pageX+ ")");
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

    // Portion of the xscale reserved for non bundled lines
    let nonBundledPortion = 4

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
    d3.select("#buttons")
        .append("div")
        .attr("class", "btn-containers custom-control custom-switch bundle-toggle")
    
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
        .text("Line bundling")
        .attr("for", "bundleToggle")
        .attr("class", "custom-control-label")

    // Build selection toggles for dimensions
        d3.selectAll("#buttons")
        .append("text")
        .text("Dimensions")
        .style("font-weight", "bold")
    
    d3.select("#buttons").selectAll("myAxis")
        .data(displayDims)
        .enter()
        .append("div")
        .attr("class", "btn-containers custom-control custom-switch dims-toggle")

    d3.selectAll(".dims-toggle")
        .append("input")
        .attr("class", "custom-control-input")
        .attr("id", function(dim) { return dim })
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

function removePcp(data) {
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

function toggleBundling() {
    
}