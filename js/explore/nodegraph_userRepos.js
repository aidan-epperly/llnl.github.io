/* Creates node graph visualization for webpage */
function draw_nodegraph_userRepos(areaID) {
    // load data file, process data, and draw visualization
    var url = ghDataDir + '/labUsers.json';
    d3.json(url, function(obj) {
        var data = reformatData(obj);
        drawGraph(data, areaID);
    });

    // Draw graph from data
    function drawGraph(data, areaID) {
        var graphHeader = 'LLNL Org. Repos';

        var margin = { top: stdMargin.top, right: stdMargin.right, bottom: stdMargin.bottom + 2, left: stdMargin.left + 4 },
            width = stdWidth,
            height = stdHeight;
        var dotRadius = stdDotRadius;
         
        // A map between discrete input and output sets
        var x = d3
            .scaleOrdinal()
            .domain([0,1])
            .range([
                margin.left,
                width - margin.right
            ]);

        // A map between continuous input and output sets
        var yUser = d3
            .scaleLinear()
            .domain([
                0,
                d3.max(data, function(d) {
                    return d.number
                })
            ])
            .range([
                margin.top,
                height - margin.bottom
            ]);

        var chart = d3
            .select('.' + areaID)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        
        // Add title
        chart
            .append('text')
            .attr('class', 'graphtitle')
            .attr('x', width / 2)
            .attr('y', 0 - margin.top / 3)
            .attr('text-anchor', 'middle')
            .text(graphHeader);

        // Draw user dots
        chart
            .selectAll('.circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'circle')
            .attr('cx', x(0))
            .attr('cy', function(d) {
                return yUser(d.number);
            })
            .attr('r', dotRadius);
    }

    // Turn json obj into desired working data
    // WARNING NO DATA VALIDATION
    function reformatData(obj) {
        var data = [];
        var users = Object.keys(obj['data']);
        var counter = 0; // A counter to assign a unique number to every user
        users.forEach(function(userName) {
            var user = obj['data'][userName];
            // Filters out low contributors
            if (user['contributedLabRepositories'] != null && user['contributedLabRepositories']['nodes'].length >= 20) {
                var userData = { name: null, repos: null, number: counter };
                if (user['name'] == null) {
                    userData['name'] = user['login'];
                } else {
                    userData['name'] = user['name'];
                }
                userData.repos = user['contributedLabRepositories']['nodes'];
                data.push(userData);
                counter++;
            }
        });
        return data;
    }
}