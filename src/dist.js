

function buildDists(data) {
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 0, bottom: 60, left: 0},
    width = window.innerWidth/2 - margin.left - margin.right,
    height = window.innerHeight/2.3 - margin.top - margin.bottom;

   var totalAbsences = d3.select("#dist1")
       .append("svg")
       .attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom)
       .append("g")
       .attr("transform",
           "translate(" + (margin.left+50) + "," + margin.top + ")");

   var totalTime = d3.select("#dist2")
       .append("svg")
       .attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom)
       .append("g")
       .attr("transform",
           "translate(" + (margin.left+50) + "," + margin.top + ")");

    d3.csv("../data/final.csv", function(data) {
        buildPlot(totalAbsences, ["Social smoker", "Social drinker"], "counts", data)
        buildPlot(totalTime, ["Social smoker", "Social drinker"], "total absence time", data)
   })
}   

/**
* Creates a violin and jitter for each group values on the given object
* @param {*} svg 
* @param {*} groups 
* @param {*} variable 
*/
function buildPlot(svg, groups, variable, data) {
   var max = d3.max(data, function(d) { return +d[variable];});
   // Build and Show the Y scale
   var y = d3.scaleLinear()
   .domain([ 0, max ])          // Note that here the Y scale is set manually
   .range([height, 0])
   svg.append("g").call( d3.axisLeft(y) )
       // Build and Show the X scale. It is a band scale like for a boxplot: each group has an dedicated RANGE on the axis. This range has a length of x.bandwidth
       domain = []
       // Get domain for in groups and not in groups
       groups.forEach(group => {
           domain.push(group)
           domain.push("Non-".concat(group))    
       });

       var histogram = d3.histogram()
       .domain(y.domain())
       .thresholds(y.ticks(20))
       .value(d => d)
       var x = d3.scaleBand()
           .range([ 0, width ])
           .domain(domain)
           .padding(0.05)  
       console.log(domain)
       groups.forEach(group => {
            
       var x = d3.scaleBand()
       .range([ 0, width ])
       .domain(domain)
       .padding(0.05)
       svg.append("g")
       .attr("transform", "translate(0," + height + ")")
       .call(d3.axisBottom(x))

       // Features of the histogram
       var histogram = d3.histogram()
           .domain(y.domain())
           .thresholds(y.ticks(12))
           .value(d => d)

       console.log(data)
       // Compute the binning for each group of the dataset
       var sumstat = d3.nest()
        .key(function(d) { return d[group];})
        .rollup(function(d) {   // For each key..
            let input = d.map(function(g) { return g[variable];})  
            let bins = histogram(input) 
            return(bins)
        })
        .entries(data)

       var maxNum = 0
       for ( i in sumstat ){
           if (i != "move") {
               console.log(i)
                allBins = sumstat[i].value
                lengths = allBins.map(function(a){return a.length;})
                longuest = d3.max(lengths)
            if (longuest > maxNum) { maxNum = longuest }}
       }

       var xNum = d3.scaleLinear()
       .range([0, x.bandwidth()])
       .domain([-maxNum,maxNum])


       // Add the shape to this svg!
       let mapGroup = (val) =>  val == "Yes" ? group: "Non-".concat(group)
       svg
       .selectAll("myViolin")
       .data(sumstat)
       .enter()        // So now we are working group per group
       .append("g")
           .attr("transform", function(d){ return("translate(" + (
               x(mapGroup(d.key))
               ) +" ,0)") } )
       .append("path")
           .datum(function(d){ return(d.value)})
           .style("stroke", "none")
           .style("fill","grey")
           .attr("d", d3.area()
               .x0( function(d){ return(xNum(-d.length)) })
               .x1(function(d){ return(xNum(d.length)) } )
               .y(function(d){ return(y(d.x0)) } )
               .curve(d3.curveCatmullRom)  
           )

       // Add individual points with jitter
       var jitterWidth = 70
       svg
       .selectAll("indPoints")
       .data(data)
       .enter()
       .append("circle")
       .attr("cx", function(d){
           if (Math.random() > 0.5) {
               return x(mapGroup(d[group])) + x.bandwidth()/2 - Math.random()*jitterWidth
            } else {
                return x(mapGroup(d[group])) + x.bandwidth()/2 + Math.random()*jitterWidth
            }
        })
        .attr("cy", function(d){if(d[variable] > 100) {console.log("FOUND", group)}; return(y(d[variable]))})
        .attr("r", 3)
        .style("fill", function(d){ return(brush(d[currentBrush]))})
        .attr("stroke", "white")

        // Add axis labels
        svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - 50)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("class", "y label")
        .text(variable == "counts" ? "Total absences" : "Total absence time (h)");
     
    })
}
       


function kernelDensityEstimator(kernel, X) {
   return function(V) {
     return X.map(function(x) {
         if (x['Social smoker'] == "No") {
             console.log("Non smoker at ",  [x, d3.mean(V, function(v) { return kernel(x - v); })])
         }
       return [x, d3.mean(V, function(v) {

           if (v['Social smoker'] == "No") {
               console.log("Non smoker at ",  [x, d3.mean(V, function(v) { return kernel(x - v); })])
           }
           return kernel(x - v); })];
     });
   };
 }
 
 function kernelEpanechnikov(k) {
   return function(v) {
     return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
   };
 }
