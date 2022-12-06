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
    
        colorScale.domain(cDomain);
        colorScale.range(['red', 'green', 'blue'])
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
            return (d == "Label" || d.endsWith("_m") || d.endsWith("_m2") ) ?  null : d
        });
        
        
        // Get scale for each dimension
        var y_scales = {};
        for (dim in dims) {
            let name = dims[dim]
            y_scales[name] = d3.scaleLinear()
                .domain(d3.extent(data, function(d) {return +d[name];}))
                .range([height, 0])
        }
        console.log(y_scales);

        function getMeans(d, p) {
            return parseInt(d[p+"_m"]);
        }

        // Get x scale
        var a = width/dims2.length;
        var means = a/4;
        var dim = a/2

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
            .domain(dims)
            //.domain([dims[0], dims[0], dims[1], dims[1], dims[1], dims[2], dims[2], dims[2], dims[3], dims[3]]);
        var x2 = d3.scalePoint()
            .range([0, width])
            .padding(10)
            .domain(dims2);

        function mapDims(d) {
            ps = [];
            dim = 0;
            dims.forEach(p => {;
                if ([0, 3, 6, 8].includes(dim)) {
                    ps.push([x(p), y_scales[p](d[p])]);
                } else {
                    ps.push([x(p), y_scales[p](d[p+"_m"])]);
                }
                
                dim += 1;
                
            });
            return ps;

        }
        // Get poly lines
        function path(d, row) {//
            let path = [];
            let currentX = 0;
            

            for (let i = 0; i < dims.length; i++) {
                // Set path to the cluster means 4/6 of space between axis
                // Set sample values at 1/6

                // Mean of cluster before axis
                if (i != 0) {
                    path.push([
                        x(dims[i]) - (x(dims[i]) - x(dims[i-1]))/6, 
                        y_scales[dims[i]](d[dims[i]+"_m"])])
                }

                // Actual values
                path.push([x(dims[i]), y_scales[dims[i]](d[dims[i]])])
                
                // Mean of cluster after axis
                if (i != dims.length) {
                    path.push([
                        x(dims[i]) + (x(dims[i+1]) - x(dims[i]))/6, 
                        y_scales[dims[i]](d[dims[i]+"_m"])])
                    }
                
            }
            console.log(path)
            
            return d3.line().curve(d3.curveMonotoneX)(
                //mapDims(d)
                path
                );
            
            
        }

        // Get poly lines
        //function path(d, row) {//
       //     var p = d3.path();
       //     p.moveTo(10, 10);
       //     p.bezierCurveTo(95, 10, 50, 90, 10, 10);
       //     return p;
        //}
        // [dims[0], "", "", dims[1], "", "", dims[2], "", dims[3]]
        

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
            .style("text-anchor", "start")
            .text(function(d) { return d; })
            .style("fill", "black")
            .attr("y", "-10")
            .attr("transform", "rotate(-50)");
    });

// Get poly lines
function path(d, row) {//
    var p = d3.path();
    p.moveTo(10, 10);
    p.bezierCurveTo(95, 10, 50, 90, 10, 10);
    return p;
}

        






