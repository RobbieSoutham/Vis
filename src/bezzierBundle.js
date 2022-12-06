// Try to create bezzier from scratch acording to control points in paper
var data = d3.csv("data/test2.csv")
    .get(function(data) {
        var margin = {top: 150, right: 10, bottom: 10, left: 10},
    width = window.innerWidth - 100 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;
        
        var cDomain = d3.extent(data, function(datum, index){
            return datum['Label'];
        })
        
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

        dims = d3.keys(data[0]).filter(function(d) {
            return (d == "Label"|| d.endsWith("_m") || d.endsWith("_m2")) ?  null : d
        });

        dims2 = d3.keys(data[0]).filter(function(d) {
            return (d == "Label" || d.endsWith("_m") || d.endsWith("_m2") || d == "Social smoker" || d=="Social drinker" ) ?  null : d
        });
        
        
        // Get scale for each dimension
        var y_scales = {};
        for (dim in dims2) {
            let name = dims2[dim]
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
            .domain(dims2)

        // Implementation based on: https://ieeexplore.ieee.org/document/8107953
        function path(d, row) {//
            let ctrPts = [];

            // Portion of the xscale reserved for non bundled lines
            let nonBundledPortion = 4

            // Build series of control points for the bezier around each axis
            for (let i = 0; i < dims2.length; i++) {
                if (i != 0) {
                    // First control point - actual value
                    ctrPts.push([
                        x(dims2[i]) - (x(dims2[i]) - x(dims2[i-1]))/nonBundledPortion, 
                        y_scales[dims2[i]](d[dims2[i]+"_m"])])

                    
                    // Second is mean of the cluster
                    ctrPts.push([x(dims2[i]), y_scales[dims2[i]](d[dims2[i]+"_m"])])
                }

                // Actual value and mean of cluster
                ctrPts.push([x(dims2[i]), y_scales[dims2[i]](d[dims2[i]])])
                ctrPts.push([x(dims2[i]), y_scales[dims2[i]](d[dims2[i]+"_m"])])

                // Mean of cluster after axis moved a portion of the x scale
                if (i != dims2.length - 1) {
                    ctrPts.push([
                        x(dims2[i]) + (x(dims2[i+1]) - x(dims2[i]))/nonBundledPortion, 
                        y_scales[dims2[i]](d[dims2[i]+"_m"])])
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
        pcp.selectAll("myAxis").data(dims2).enter()
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

        function select(elem) {
            // Check if already selected
            var selected_pcp = d3.select("#pcp").select('svg').select('g').selectAll('path').select(
                function(d) {
                    if (d == null) {
                        return null
                    } else {
                        return d['Label']==elem?this:null;
                    };}
            ).style("opacity", 0.5);
        }

        var selects = d3.selectAll("myAxis").append("svg")
            .data(dims2)
            .enter()
            .append("g").attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            .each(function(d) {
                d3.select(this).call(d3.axisLeft().scale(y_scales[d]));
            })
            .append("input")
            .attr("type", "checkbox")
            .attr("checked", true)
            .attr("id", function(d) {return "button_" + d;})
            .on("click", filter);
            
            
        console.log(dims2)

    });