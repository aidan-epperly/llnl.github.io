/* Creates line graph visualization for webpage */
function draw_line_repoActivity(areaID, repoNameWOwner) {
    // load data file, process data, and draw visualization
    var url = ghDataDir + '/labRepos_Activity.json';
    var files = [url];
    Promise.all(files.map(url => d3.json(url))).then(values => {
        var data = reformatData(values[0]);
        drawGraph(data, areaID);
    });

    var parseTime = d3.timeParse('%Y-%m-%d');
    var formatTime = d3.timeFormat('%Y-%m-%d');

    // Draw graph from data
    function drawGraph(data, areaID) {

        var graphHeader;
        if (repoNameWOwner == null) {
            graphHeader = 'Activity Across All Repos [Default Branches, 1 Year]';
        } else {
            graphHeader = "Activity for '" + repoNameWOwner + "' [Default Branch, 1 Year]";
        }

        // Removes most recent week from graph to avoid apparent dip in activity
        data.pop();

        data.forEach(function(d) {
            d.date = parseTime(d.date);
            d.value = +d.value;
        });

        var margin = { top: stdMargin.top, right: stdMargin.right, bottom: stdMargin.bottom, left: stdMargin.left * 1.15 },
            width = stdTotalWidth * 2 - margin.left - margin.right,
            height = stdHeight;
        var dotRadius = stdDotRadius;

        var x = d3
            .scaleTime()
            .clamp(true)
            .domain(
                d3.extent(data, function(d) {
                    return d.date;
                })
            )
            .range([0, width]);

        var smallX = d3
            .scaleTime()
            .clamp(true)
            .domain(
                d3.extent(data, function(d) {
                    return d.date;
                })
            )
            .range([0, 12 * width / 19]);

        var y = d3
            .scaleLinear()
            .domain([
                0,
                d3.max(data, function(d) {
                    return d.value == 0 ? 10 : d.value;
                })
            ]) // Force non 0 scale for line visibility
            .range([height, 0])
            .nice();

        var chart = d3
            .select('.' + areaID)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var tip = d3
            .tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                var repos = ' Commits';
                if (d.value == 1) {
                    repos = ' Commit';
                }
                return '<sub>[Week of ' + formatTime(d.date) + ']</sub>' + '<br>' + d.value + repos;
            });

        var dToday = x.domain()[1];
        // Supercomputing
        var dSupercomp = '11-18';
        // Thanksgiving
        var dThnxgiv = '11-25';
        // Christmas
        var dXmas = '12-25';

        function update(x, y) {    
            chart.selectAll('g').remove();

            var xAxis = d3.axisBottom().scale(x);

            var yAxis = d3.axisLeft().scale(y);

            var area = d3
                .area()
                .x(function(d) {
                    return x(d.date);
                })
                .y0(height)
                .y1(function(d) {
                    return y(d.value);
                });

            var valueline = d3
                .line()
                .x(function(d) {
                    return x(d.date);
                })
                .y(function(d) {
                    return y(d.value);
                });

            function addDateLine(dateString, label) {
                var dateObj = getYearDate(dateString, dToday);
                drawDateLine(dateObj, label, false, chart.append('g'), x, y, height, valueline);
            }

            chart.call(tip);

            // Add the x axis
            chart
                .append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + height + ')')
                .call(xAxis);

            // Add the y axis
            chart
                .append('g')
                .attr('class', 'y axis')
                .call(yAxis);

            // Add title
            chart
                .append('g')
                .append('text')
                .attr('class', 'graphtitle')
                .attr('x', width / 2)
                .attr('y', 0 - margin.top / 3)
                .attr('text-anchor', 'middle')
                .text(graphHeader);

            // Add y axis label
            chart
                .append('g')
                .append('text')
                .attr('class', 'axistitle')
                .attr('transform', 'rotate(-90)')
                .attr('y', 0 - margin.left + margin.left / 4)
                .attr('x', 0 - height / 2)
                .attr('text-anchor', 'middle')
                .text('Commits');

            // Draw fill
            chart
                .append('g')
                .append('path')
                .datum(data)
                .attr('class', 'area')
                .attr('d', area);

            // Draw line
            chart
                .append('g')
                .append('path')
                .datum(data)
                .attr('class', 'line')
                .attr('d', valueline);

            // Draw date-of-interest reference lines
            addDateLine(dSupercomp, 'Supercomputing');
            addDateLine(dThnxgiv, 'Thanksgiving');
            addDateLine(dXmas, 'Christmas');

            // Draw dots
            chart
                .append('g')
                .selectAll('.circle')
                .data(data)
                .enter()
                .append('circle')
                .attr('class', 'circle')
                .attr('cx', function(d) {
                    return x(d.date);
                })
                .attr('cy', function(d) {
                    return y(d.value);
                })
                .attr('r', dotRadius)
                .style('cursor', 'pointer')
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .on('click', d => {
                    tip.hide(d);
                    update(smallX,y);
                    d3.select('#Thanksgiving').attr('y', d => {
                        const y = d3.select('#Thanksgiving').attr('y');
                        return +y + 20;
                    });
                    drawPie({ name: String(d.date), children: d.breakdown });
                });

            // Angle the axis text
            chart
                .select('.x.axis')
                .selectAll('text')
                .attr('transform', 'rotate(12)')
                .attr('text-anchor', 'start');
        }

        update(x,y);

        function drawPie(weekData) {
            const radius = 85;

            const partition = data => {
                const root = d3
                    .hierarchy(data)
                    .sum(d => d.value)
                    .sort((a, b) => b.value - a.value);

                return d3.partition()
                    .size([2 * Math.PI, root.height + 1])
                    (root);
            }

            const root = partition(weekData);

            const arc = d3
                .arc()
                    .startAngle(d => d.x0)
                    .endAngle(d => d.x1)
                    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
                    .padRadius(radius * 1.5)
                    .innerRadius(d => d.y0 * radius)
                    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius));

            const colors = d3.scaleOrdinal()
                .domain([0, weekData.length - 1])
                .range(["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#ccebc5","#ffed6f"]);
            
            const pieGroup = chart
                .append('g')
                    .attr('transform', `translate(${5 * width / 6},${height / 2})`)

            const path = pieGroup
                .append('g')
                .selectAll('path')
                    .data(root.descendants().slice(1))
                    .join('path')
                        .attr('fill', d => {
                            while (d.depth > 1) {
                                d = d.parent;
                            }
                            return colors(d.parent.children.indexOf(d));
                        })
                        .attr('fill-opacity', 1)
                        .attr('d', d => arc(d));

            // Adds title for accessability. Does not affect name label below
            path.append('title')
                .text(d => `${d.data.name} : ${d.data.value} Commits`);

            const label = pieGroup
                .append('g')
                    .style('font-size', '11px')
                    .attr('pointer-events', 'none')
                    .attr('text-anchor', 'middle')
                    .style('user-select', 'none')
                    .selectAll('text')
                        .data(root.descendants().slice(1))
                        .join('text')
                            .attr('dy', '0.35em')
                            .attr('transform', d => labelTransform(d))
                            .attr('h', d => d.x1 - d.x0)
                            .text(d => {
                                return d.data.name.split('/')[1]
                            });

            label.nodes().forEach(node => {
                node.setAttribute('font-size', Math.min(11, Math.floor(11 * radius / node.getComputedTextLength()), Math.floor(Math.PI * radius * node.getAttribute('h') / 2)) + 'px')
            });

            function labelTransform(d) {
                const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
                const y = (d.y0 + d.y1) / 2 * radius;
                return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
            }

            const title = pieGroup
                .append('text')
                .attr('dy', '0.35em')
                .attr('text-anchor', 'middle')
                .attr('class', 'graphtitle')
                .text('Commit Breakdown');

            const subtitle = pieGroup
                .append('text')
                .attr('dy', '1.35em')
                .attr('text-anchor', 'middle')
                .attr('class', 'graphtitle')
                .text(`Week of ${weekData.name.split(' ')[1]} ${weekData.name.split(' ')[2]}`);
        }
    }

    // Turn json obj into desired working data
    function reformatData(obj) {
        // Calculate combined values
        var dataTotals = {};
        var repoCounts = {};
        var repos = repoNameWOwner == null ? Object.keys(obj['data']) : [repoNameWOwner];
        var numReposExpected = repos.length;
        repos.forEach(function(repo) {
            if (obj['data'].hasOwnProperty(repo)) {
                var weeklyNodes = obj['data'][repo];
                for (var i = 0; i < weeklyNodes.length; i++) {
                    var weekstamp = weeklyNodes[i]['week'];
                    var weeklytotal = weeklyNodes[i]['total'];
                    if (!Object.keys(dataTotals).contains(weekstamp)) {
                        dataTotals[weekstamp] = 0;
                        repoCounts[weekstamp] = 0;
                    }
                    dataTotals[weekstamp] += weeklytotal;
                    repoCounts[weekstamp] += 1;
                }
            } else {
                console.log('No activity data recorded for ' + repo + ', using dummy data.');
                // Today
                var end = new Date();
                dataTotals[formatTime(end)] = 0;
                repoCounts[formatTime(end)] = 1;
                // Tomorrow, 1 year ago
                var start = new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate() + 1);
                dataTotals[formatTime(start)] = 0;
                repoCounts[formatTime(start)] = 1;
            }
        });

        // Formats data to allow for timestap look up of value data
        var repoData = {};
        repos.forEach(function(repo) {
            for (var entry of obj['data'][repo]) {
                if (repoData[entry['week']] == undefined) {
                    repoData[entry['week']] = [];
                }
                if (entry['total']) {
                    var input = {};
                    input['name'] = repo
                    input['value'] = entry['total'];
                    repoData[entry['week']].push(input);
                }
            }
        });

        // Format data for graphing
        var data = [];
        var sortedTimestamps = Object.keys(dataTotals).sort();
        sortedTimestamps.forEach(function(timestamp) {
            var numReposFound = repoCounts[timestamp];
            if (numReposFound == numReposExpected) {
                data.push({ date: timestamp, value: dataTotals[timestamp], breakdown: repoData[timestamp] });
            } else {
                console.log('Repo count mismatch for activity on ' + timestamp + ': expected ' + numReposExpected + ', found ' + numReposFound);
            }
        });

        return data;
    }

    // Return appropriate date object for a month-day date given the graph's time range
    function getYearDate(monthDayString, dToday) {
        var thisYear = formatTime(dToday).split('-')[0];
        if (d3.min([dToday, parseTime(thisYear + '-' + monthDayString)]) == dToday) {
            var aYear = (parseInt(thisYear) - 1).toString();
            return parseTime(aYear + '-' + monthDayString);
        } else {
            return parseTime(thisYear + '-' + monthDayString);
        }
    }
}
