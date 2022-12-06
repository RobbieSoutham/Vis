var data = d3.csv("data/reduced_clustured.csv")
    .get(function(data) {
    console.log(data);
    
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = 450 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var svg = d3.select("#scatter")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)

        .append("g")
            .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

    var max_x = d3.max(data, function(d) { return +d['F_1'];});
    var min_x = d3.min(data, function(d) { return +d['F_1'];});
    var max_y = d3.max(data, function(d) { return +d['F_2'];});
    var min_y = d3.min(data, function(d) { return +d['F_2'];});
    var cDomain = d3.extent(data, function(datum, index){
        return datum['Label'];
    })
    console.log(max_x);

    // Add X axis
    var x = d3.scaleLinear()
        .domain([-2.5, 2.5])
        .range([ 0, width ]);
    svg.append("g")
        .attr("class", "xAxis")
        .style("text-color", "white")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([5, -2.5])
        .range([0, height]);
    svg.append("g")
        .attr("class", "yAxis")
        .call(d3.axisLeft(y));

    // Setup brush
    var colorScale = d3.scaleOrdinal();
    colorScale.domain(cDomain);
    colorScale.range(['red', 'green', 'blue'])

    // Add points
    svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
        .attr("cx", function (d) { return x(d['F_1']); } )
        .attr("cy", function (d) { return y(d['F_2']); } )
        .attr("r", 3)
        .style("fill", function(datum, index){
            return colorScale(datum['Label'])
        })    


    // Add axis labels
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("class", "y label")
        .text("F2");

    svg.append("text")
        .attr("transform",
                "translate(" + (width/2) + " ," + 
                   (height + margin.top + 20) + ")")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .text("F1");


});
var margin = {top: 150, right: 10, bottom: 10, left: 10},
    width = window.innerWidth - 100 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;
    
var data = d3.csv("data/test2.csv")
    .get(function(data) {
        console.log(data);
        
        var cDomain = d3.extent(data, function(datum, index){
            return datum['Label'];
        })
        
        var colorScale = d3.scaleOrdinal();
        console.log(data['Label'])
    
        colorScale.domain(cDomain);
        colorScale.range(['red', 'green', 'blue'])
        var pcp = d3.select("#testing")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        dims = d3.keys(data[0]).filter(function(d) {
            return (d == "Label") ?  null : d
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
            var splitSize = width/dims2.length;
            bundled = splitSize/2;
            nonBundled = splitSize/4;
            var range = [];
            var current = [];
            var pos = 0;
            for (let i = 0; i < dims.length; i++) {
                if (i != 0 && !dims[i].endsWith("_m") || !dims[i].endsWith("_m2")) {
                    var subRange = [];
                    current.forEach(c => {
                        if (!dims[i].endsWith("_m") || !dims[i].endsWith("_m2")) {
                            range.push(pos+bundled)
                        } else {}
                    })
                    //clear
                    //apend
                    start += splitSize
                } 
            }
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
            return d3.line().curve(d3.curveMonotoneX)(
                //mapDims(d)
                dims.map(function(p) {
                return [x(p), y_scales[p](d[p])];
                })
                );
        }

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


var data = d3.csv("data/clustered_dataset.csv")
    .get(function(data) {
    console.log(data);

    var cDomain = d3.extent(data, function(datum, index){
        return datum['Label'];
    })
    
    var colorScale = d3.scaleOrdinal();

    colorScale.domain([0, 1, 2]);
    colorScale.range(['red', 'green', 'blue'])

    var margin = {top: 150, right: 10, bottom: 10, left: 10},
    width = window.innerWidth - 500 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

    console.log(cDomain)
    dims = d3.keys(data[0]).filter(function(d) {
        return d == "Label" ?  null : d
    });

    dims = d3.keys(data[0]).filter(function(d) {
        return d 
    });

    var a = function(d){ return colorScale(d.cluster)}
    var paracoords = Parasol(data)(".parcoords");
    paracoords
        .shadows()
        .alpha(0.4)
        .reorderable()
        //.composite('darker')
        //.dimensions(dims)
        .hideAxes(['Social Smoker', 'Social drinker', 'Label', 'ID', 'Height', 'Weight'])
        .cluster({k: 6, vars: dims, hidden: false, palette: a})
        .bundleDimension("cluster")
        //.colorScale('Label')
        .bundlingStrength(1)
        .smoothness(0.1)
        .render();

    /*
    // Setup parallel coordinates
    var pcp = d3.select("#pcp")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

    
    
    // Get scale for each dimension
    var y_scales = {};
    for (dim in dims) {
        let name = dims[dim]
        y_scales[name] = d3.scaleLinear()
            .domain(d3.extent(data, function(d) {return +d[name];}))
            .range([height, 0])
    }
    console.log(y_scales);

    // Get poly lines
    function path(d) {
        return d3.line()(dims.map(function(p) { return [x(p), y_scales[p](d[p])]; }));
    }

    // Get x scale
    var x = d3.scalePoint()
        .range([0, width])
        .padding(10)
        .domain(dims);

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
    pcp.selectAll("myAxis").data(dims).enter()
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
*/
    // Setup legend
    keys = ["0", "1", "2"];
    var legend = d3.select("#legend")
        .append("svg")
        .attr("width", "150")
        .attr("height", "100")
        .attr('transform', 'translate(0,' + (100 / 4) + ')')
    
    legend.append("text")
    .text("Cluster")
    .attr("x", 90)
    .attr("y", 20)
    .attr("text-anchor", "left")

    legend.selectAll("mydots")
        .data(keys)
        .enter()
        .append("g")
        .append("rect")
            .attr("x", 100)
            .attr("y", function(d,i){ return 30 + i*(3+20)}) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("width", "20")
            .attr("height", "20")
            .style("fill", function(d){ return colorScale(d)})
        .on("click", selection);
        

    legend.selectAll("mylabels")
        .data(keys)
        .enter()
        .append("text")
            .attr("x", 125)
            .attr("y", function(d,i){ return 40 + i*(3+20)}) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", function(d){ return colorScale(d)})
            .text(function(d){ return d})
            .attr("text-anchor", "right")
            .style("alignment-baseline", "middle")
        .on("click", selection);

    // Apply brush on click
    function selection(elem) {
        // Check if already selected
        var selected_pcp = d3.select("#pcp").select('svg').select('g').selectAll('path').select(
            function(d) {
                if (d == null) {
                    return null
                } else {
                    return d['Label']==elem?this:null;
                };}
        ).style("opacity", 0.5);

        var selected_sc = d3.select("#scatter").selectAll("circle").select(
            function(d) {
                if (d == null) {
                    return null
                } else {
                    return d['Label']==elem?this:null;
                };}
        ).style("opacity", 1);

        var isSelected = selected_pcp.attr("selected") == 0 ? false : true        
        selected_pcp.attr("selected", isSelected ? 0 : 1)
        selected_sc.attr("selected", isSelected ? 0 : 1)

        d3.select("#pcp").select('svg').select('g').selectAll('path').select(
            function(d) {
                if (d == null) {
                    return null
                } else {
                    return d['Label']!=elem?this:null;
                };}
        ).transition().duration(250).style("opacity",
            isSelected ? 0.5 : 0.05
        ).attr("selected", 0);

        d3.select("#scatter").selectAll("circle").select(
            function(d) {
                if (d == null) {
                    return null
                } else {
                    return d['Label']!=elem?this:null;
                };}
        ).transition().duration(250).style("opacity",
            isSelected ? 1 : 0.25
        ).attr("selected", 0);
    };
});







