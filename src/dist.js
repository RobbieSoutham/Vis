
// Code based on various D3 gallery tutorials
function buildDists(data) {
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 50, bottom: 60, left: 75},
    width = window.innerWidth/2 - margin.left - margin.right,
    height = window.innerHeight/2.3 - margin.top - margin.bottom;

   var totalAbsences = d3.select("#dist1")
       .append("svg")
       .attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom)
    
    var labelAreaCount = totalAbsences.append("g")
       .attr("transform",
       "translate(" + (margin.left) + "," + margin.top + ")");
    
    totalAbsences = totalAbsences.append("g")
      .attr("transform",
        "translate(" + (margin.left) + "," + margin.top + ")");

    var totalTime = d3.select("#dist2")
       .append("svg")
       .attr("width", width + margin.left)
       .attr("height", height + margin.top + margin.bottom)
    
    var labelAreaTime = totalTime.append("g")
        .attr("transform",
        "translate(" + (margin.left) + "," + margin.top + ")");
    totalTime = totalTime.append("g")
       .attr("transform",
           "translate(" + (margin.left) + "," + margin.top + ")");


           
    // Add axis labels
    labelAreaTime.append("g").append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - 50)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .attr("class", "y-label, h6")
    .text( "Total absence time (h)");

    // Add axis labels
    labelAreaCount.append("g").append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - 50)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .attr("class", "y-label, h6")
    .text( "Total Number of Absences");

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
       var violin = svg
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
       var posX = []
       var posY = []
       pointSize = 3
       

       var countMax = 0
       data.forEach(function(d) {
        let count = data.filter(function(d2) {
            return d[variable] == d2[variable] && d[group] == d2[group]
            }).length

        if (count > countMax) {
            countMax = count
        }
       })

       let maxIt = 40
       a = svg
       .selectAll("indPoints")
       .data(data)
       .enter()
       .append("circle")
       .attr("cx", function(d){
           let counts = (data.filter(function(d2) {
            return d[variable] == d2[variable] && d[group] == d2[group]
            }).length)
           let currentWidth = (counts/countMax) * x.bandwidth()/2
        
           // Loop until max overlap or max iterations reached
           if (counts >= maxIt) {
               // Randomly decide to place on left or right
               if (Math.random() > 0.5) {
                pos = x(mapGroup(d[group])) + x.bandwidth()/2 - Math.random()*currentWidth
                } else {
                    pos = x(mapGroup(d[group])) + x.bandwidth()/2 + Math.random()*currentWidth
                }
           }else {
               for (let i = 0; i < maxIt; i++){
                //Increment width by one for every entry with the same y value unless max width reached

                    // Randomly decide to place on left or right
                    if (Math.random() > 0.5) {
                        pos = x(mapGroup(d[group])) + x.bandwidth()/2 - Math.random()*currentWidth
                    } else {
                        pos = x(mapGroup(d[group])) + x.bandwidth()/2 + Math.random()*currentWidth
                    }
                    

                    // Check if overlap
                    let overlap = true
                    posX.forEach((x) => {
                        if (Math.abs(x-pos) > 3) {
                            overlap = false
                        }
                    
                    })

                    if (!overlap) { break }
                
                }
            }
           posX.push(pos)
         return pos
            
        })
        .attr("cy", function(d){
            // Randomly move the point up or down by the size of the point
            for (let i = 0; i < maxIt; i++){
                if (Math.random() > 0.5) {
                    pos = y(d[variable]) + Math.random() * pointSize
                } else {
                    pos = y(d[variable]) - Math.random() * pointSize
                }

                // Check if overlap
                let overlap = true
                posY.forEach((y) => {
                    if (Math.abs(y-pos) > 3) {
                        overlap = false
                    }
                
                })
                

                if (!overlap) { break }
            }
            posY.push
            return pos
           })
        .attr("r", pointSize)
        .style("fill", function(d){ return(brush(d[currentBrush]))})
        .attr("stroke", "white")

       

        delete found;

        // Add point selection brush
        svg.call(d3.brush()
            .on("start end", function(d, event) {updatePointSelection(data, d3.event.selection, x, y, null, variable)})
                
        ).on("onClick", console.log("clicked"))
     
    })
}
