d3.select('body')
    .style("background-color", "black !important");

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
        .domain([2.5, -2.5])
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

var data = d3.csv("data/clustered_dataset.csv")
    .get(function(data) {
    console.log(data);

    var cDomain = d3.extent(data, function(datum, index){
        return datum['Label'];
    })
    
    var colorScale = d3.scaleOrdinal();

    colorScale.domain(cDomain);
    colorScale.range(['red', 'green', 'blue'])

    var margin = {top: 150, right: 10, bottom: 10, left: 10},
    width = window.innerWidth - 500 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

    // Setup parallel coordinates
    update(pcp, data);
    /*
    var pcp = d3.select("#pcp")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
*/
    dims = d3.keys(data[0]).filter(function(d) { return (d != "ID" && d != "Label" && d != "") });
    
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
    }
});

function update(elem, data) {
    elem.selectAll("myPath")
        .data(data)
        .join(
            function(enter) {
                return enter.append("path")
                //.attr("class", function(d) { return d['Label']; })
                .attr("d", path)
                .style("fill", "none")
                .style("opacity", 0.5)
                .style("stroke", function(datum, index){
                    return brush(datum['Label'])
                })
                .attr("selected", 0) 
            },
            function (update) {
                update.style("stroke", "blue")
            }
        );
}