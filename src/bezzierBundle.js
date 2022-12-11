// Try to create bezzier from scratch acording to control points in paper
var data = d3.csv("data/test2.csv")
    .get(function(data) {
        var margin = {top: 30, right: 0, bottom: 30, left: 0},
    width = 1000 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;
        
        var cDomain = d3.extent(data, function(datum, index){
            return datum['Label'];
        })
        
        // Setup colours
        var colorScale = d3.scaleOrdinal();
        console.log(data['Label'])
    
        colorScale.domain([0, 1, 2]);
        colorScale.range(['red','green', 'blue'])
        
        var pcp = d3.select("#test")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // Main store of dimentions that doesnt get changed
        dims = d3.keys(data[0]).filter(function(d) {
            return (d == "Label" || d.endsWith("_m") || d.endsWith("_m2") || d == "Social smoker" || d=="Social drinker" ) ?  null : d
        });

        displayDims = d3.keys(data[0]).filter(function(d) {
            return (d == "Label" || d.endsWith("_m") || d.endsWith("_m2") || d == "Social smoker" || d=="Social drinker" ) ?  null : d
        });
        
        
        // Get scale for each dimension
        var y_scales = {};
        for (dim in displayDims) {
            let name = displayDims[dim]
            y_scales[name] = d3.scaleLinear()
                .domain(d3.extent(data, function(d) {return +d[name];}))
                .range([height, 0])
        }
        console.log(y_scales);

        // Get x scale
        function getScales() {
            // Get length from each main axis
            var splitSize = width/displayDims.length-1;
            var bundleWeight = 0.9;
            var nonBundledWeight = 0.1;

            var bundleSize = bundleWeight * splitSize;
            var nonBundleSize = nonBundledWeight * splitSize;

            var range = [];
            var current = [];
            var pos = 0;
            for (let i = 0; i < displayDims.length-1; i++) {
                if (i == 0) {
                    range.push(width*nonBundleSize);
                    range.push(width*bundleSize);
                    range.push(width*bundleSize);
                } else {
                    console.log(range[-1]);
                    range.push(range[range.length-1] + nonBundleSize);
                    range.push(range[range.length-1] + bundleSize);
                    range.push(range[range.length-1] + bundleSize);
                }
            }
            console.log(range)
        }
        var x = d3.scalePoint()
            .range([0,width])
            .padding(10)
            .domain(displayDims)

        // Implementation based on: https://ieeexplore.ieee.org/document/8107953
        function path(d, row) {//
            let ctrPts = [];

            // Portion of the xscale reserved for non bundled lines
            let nonBundledPortion = 4

            // Build series of control points for the bezier around each axis
            for (let i = 0; i < displayDims.length; i++) {
                if (i != 0) {
                    // First control point - actual value
                    ctrPts.push([
                        x(displayDims[i]) - (x(displayDims[i]) - x(displayDims[i-1]))/nonBundledPortion, 
                        y_scales[displayDims[i]](d[displayDims[i]+"_m"])])

                    
                    // Second is mean of the cluster
                    ctrPts.push([x(displayDims[i]), y_scales[displayDims[i]](d[displayDims[i]+"_m"])])
                }

                // Actual value and mean of cluster
                ctrPts.push([x(displayDims[i]), y_scales[displayDims[i]](d[displayDims[i]])])
                ctrPts.push([x(displayDims[i]), y_scales[displayDims[i]](d[displayDims[i]+"_m"])])

                // Mean of cluster after axis moved a portion of the x scale
                if (i != displayDims.length - 1) {
                    ctrPts.push([
                        x(displayDims[i]) + (x(displayDims[i+1]) - x(displayDims[i]))/nonBundledPortion, 
                        y_scales[displayDims[i]](d[displayDims[i]+"_m"])])
                    }    
            }
            
            // Create bezzier for this row 
            return d3.line().curve(d3.curveBasis)(ctrPts); 
            
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
                return colorScale(datum['Label'])
            })
            .attr("selected", 0);

        // Setup axis
        pcp.selectAll("myAxis").data(displayDims).enter()
            .append("g")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            .each(function(d) {
                d3.select(this).call(d3.axisLeft().scale(y_scales[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .text(function(d) { return d; })
            .style("fill", "black")
            .attr("y", "-15");
            //.attr("transform", "rotate(-50)");

        function filter(elem) {
            displayDims = displayDims.filter(function(d) {
                return d !== elem;
            })
        }

        

        // Build selection toggles for dimensions
        d3.selectAll("#buttons")
            .append("text")
            .text("Dimensions")
        
        d3.select("#buttons").selectAll("myAxis")
            .data(displayDims)
            .enter()
            .append("div")
            .attr("class", "btn-containers custom-control custom-switch")

        d3.selectAll(".btn-containers")
            .append("input")
            .attr("class", "custom-control-input")
            .attr("id", function(dim) { return dim })
            .attr("type", "checkbox")
            .attr("role", "switch")
            .attr("checked", true)
            .on("click", update)

        d3.selectAll(".btn-containers")
            .append("label")
            .text(function(dim) { return dim })
            .attr("for", function(dim) { return dim })
            .attr("class", "custom-control-label")

        var filtered = [];
        /* Update the graph dimensions
            TODO: fix button interactions
            Works when buttons added with D3 
        */
        function update (dim){    
            displayDims = dims;

            // Update displayed dims
            console.log("before", filtered)
            if (filtered.includes(dim)) {
                filtered = filtered.filter(function(dim2) {
                    return dim2 !== dim;
                })
            } else {
                filtered.push(dim);
            }
            console.log("add", filtered)
            filtered.forEach(dim1 => {
                displayDims = displayDims.filter(function(dim2) {
                    return dim2 !== dim1;
                })
            })

            // Remove previous plot
            pcp.selectAll("g").transition().remove();
            pcp.selectAll("path").transition().remove();
            
            

            // Replot axis
            pcp.selectAll("myAxis").data(displayDims).enter()
            .append("g")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            .each(function(d) {
                d3.select(this).call(d3.axisLeft().scale(y_scales[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .text(function(d) { return d; })
            .style("fill", "black")
            .attr("y", "-15");


            // Replot paths
            pcp.selectAll("myPath")
            .data(data)
            .enter()
            .append("path")
            //.attr("class", function(d) { return d['Label']; })
            .attr("d", path)
            .style("fill", "none")
            .style("opacity", 0.5)
            .style("stroke", function(datum, index){
                return colorScale(datum['Label'])
            })
            .attr("selected", 0);
        }

     
    });
console.log(data)

function getInputHTML(dim) {
    return '<div class="custom-control custom-switch"> \
                <input class="custom-control-input" type="checkbox" role="switch" id="' + dim + '" checked> \
            <label class="custom-control-label" for=' + dim + '>' + dim + '</label> \
        </div>'
}
