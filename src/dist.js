

function buildDists(data) {
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 0, bottom: 60, left: 0},
    width = window.innerWidth/2 - margin.left - margin.right,
    height = window.innerHeight/2 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#dist1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + (margin.left+50) + "," + (margin.top-50) + ")");

    // Read the data and compute summary statistics for each specie
    d3.csv("../data/final.csv", function(data) {

        buildPlot(svg, ["Social smoker", "Social drinker"], "counts", data)
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
   .domain([-80, 300 ])          // Note that here the Y scale is set manually
   .range([height, 0])
   svg.append("g").call( d3.axisLeft(y) )
       // Build and Show the X scale. It is a band scale like for a boxplot: each group has an dedicated RANGE on the axis. This range has a length of x.bandwidth
       domain = []
       // Get domain for in groups and not in groups
       groups.forEach(group => {
           domain.push(group)
           domain.push("Non-".concat(group))    
       });

       var x = d3.scaleBand()
           .range([ 0, width ])
           .domain(domain)
           .padding(0.05)     // This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.
       svg.append("g").call(d3.axisBottom(x))
       groups.forEach(group => {
           console.log(group)
           svg.append("g")
               .attr("transform", "translate(0," + height + ")")
               .call(d3.axisBottom(x))
                       //
                 
           // Compute quartiles, median, inter quantile range min and max --> these info are then used to draw the box.
           var sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
           .key(function(d) { return d[group];})
           .rollup(function(d) {
               q1 = d3.quantile(d.map(function(g) { return g[variable];}).sort(d3.ascending),.25)
               median = d3.quantile(d.map(function(g) { return g[variable];}).sort(d3.ascending),.5)
               q3 = d3.quantile(d.map(function(g) { return g[variable];}).sort(d3.ascending),.75)

               interQuantileRange = q3 - q1
               min = q1 -( 1.5 * interQuantileRange)
               max = q3 +( 1.5 * interQuantileRange)
               
               console.log({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max})
               return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max})
           })
           .entries(data)

           let mapGroup = (val) =>  val == "Yes" ? group: "Non-".concat(group)
           // Show the main vertical line
           svg
           .selectAll("vertLines")
           .data(sumstat)
           .enter()
           .append("line")
               .attr("x1", function(d){return(x(mapGroup(d.key)) + x.bandwidth()/2)})
               .attr("x2", function(d){return(x(mapGroup(d.key)) +  x.bandwidth()/2)})
               .attr("y1", function(d){console.log(d.value.min); return(y(d.value.min))})
               .attr("y2", function(d){return(y(d.value.max))})
               .attr("stroke", "black")
               .style("width", 40)

             // rectangle for the main box
           var boxWidth = 100
           svg
               .selectAll("boxes")
               .data(sumstat)
               .enter()
               .append("rect")
                   .attr("x", function(d){return(x(mapGroup(d.key)) + (x.bandwidth()/4))})
                   .attr("y", function(d){return(y(d.value.q3))})
                   .attr("height", function(d){return(Math.abs(y(d.value.q1)-y(d.value.q3)))})
                   .attr("width", x.bandwidth()/2 )
                   .attr("stroke", "black")
                   .style("fill", "#69b3a2")

           
           // Show the median
           svg
           .selectAll("medianLines")
           .data(sumstat)
           .enter()
           .append("line")
               .attr("x1", function(d){return(x(mapGroup(d.key))  + (x.bandwidth()/4)) })
               .attr("x2", function(d){return(x(mapGroup(d.key)) + 3*(x.bandwidth()/4)) })
               .attr("y1", function(d){return(y(d.value.median))})
               .attr("y2", function(d){return(y(d.value.median))})
               .attr("stroke", "black")
               //.style("width", 80)


                // Add individual points with jitter

                svg
                .selectAll("minLines")
                .data(sumstat)
                .enter()
                .append("line")
                    .attr("x1", function(d){return(x(mapGroup(d.key))  + (x.bandwidth()/4)) })
                    .attr("x2", function(d){return(x(mapGroup(d.key)) + 3*(x.bandwidth()/4)) })
                    .attr("y1", function(d){return(y(d.value.min))})
                    .attr("y2", function(d){return(y(d.value.min))})
                    .attr("stroke", "black")
                    //.style("width", 80)
    
    
                     // Add individual points with jitter

                     svg
                     .selectAll("maxLines")
                     .data(sumstat)
                     .enter()
                     .append("line")
                         .attr("x1", function(d){return(x(mapGroup(d.key))  + (x.bandwidth()/4)) })
                         .attr("x2", function(d){return(x(mapGroup(d.key)) + 3*(x.bandwidth()/4)) })
                         .attr("y1", function(d){return(y(d.value.max))})
                         .attr("y2", function(d){return(y(d.value.max))})
                         .attr("stroke", "black")
                         //.style("width", 80)
         
         
                          // Add individual points with jitter
      var jitterWidth = 1
      var maxJitterWidth = 50;
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
