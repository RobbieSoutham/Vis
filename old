
// Code based on various D3 gallery tutorials
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
       .attr("width", width + margin.left)
       .attr("height", height + margin.top + margin.bottom)
       .append("g")
       .attr("transform",
           "translate(" + (margin.left+60) + "," + margin.top + ")");

    buildPlot(totalAbsences, ["Social smoker", "Social drinker"], "counts", data)
    buildPlot(totalTime, ["Social smoker", "Social drinker"], "total absence time", data)
}   

// Creates a violin and jitter for each group values on the given object
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
           .thresholds(y.ticks(15))
           .value(d => d)
           
       groups.forEach(group => {
            
       var x = d3.scaleBand()
       .range([ 0, width ])
       .domain(domain)
       .padding(0.05)
       svg.append("g")
       .attr("transform", "translate(0," + height + ")")
       .attr("class", "h6 small")
       .call(d3.axisBottom(x))

       

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
       var jitterWidth = 1
       var maxJitterWidth = 40;
       var positions = []
       var found = []
       svg
       .selectAll("indPoints")
       .data(data)
       .enter()
       .append("circle")
       .attr("cx", function(d){
           var maxIt = 40/3
           var currentWidth = jitterWidth

           // Loop until max overlap or max iterations reached
           for (let i = 0; i < maxIt; i++){
                // Increment width by one for every entry with the same y value unless max width reached
                for (let j = 0; j < found.length; j++) {
                    if (currentWidth == maxJitterWidth) {break}
                   
                    if (found[j][variable] == d[variable] && found[j][group] == d[group]) {
                        currentWidth++
                        
                    }
                }
                
                // Randomly decide to place on left or right
                if (Math.random() > 0.5) {
                    pos = x(mapGroup(d[group])) + x.bandwidth()/2 - Math.random()*currentWidth
                } else {
                    pos = x(mapGroup(d[group])) + x.bandwidth()/2 + Math.random()*currentWidth
                }
                

                // Check if overlap
                let overlap = true
                positions.forEach((x) => {
                    if (Math.abs(x-pos) > 3) {
                        overlap = false
                    }
                
                })

                if (overlap) { break }
            
            }
           positions.push(pos)
           found.push(d)
         return pos
            
        })
        .attr("cy", function(d){return(y(d[variable]))})
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
        .attr("class", "y-label, h6")
        .text(variable == "counts" ? "Total absences" : "Total absence time (h)");

        delete found;
     
    })
}
       

function kernelDensityEstimator(kernel, X) {
   return function(V) {
     return X.map(function(x) {
       return [x, d3.mean(V, function(v) {
           return kernel(x - v); })];
     });
   };
 }
 
 function kernelEpanechnikov(k) {
   return function(v) {
     return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
   };
 }
