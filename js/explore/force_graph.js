function draw_force_graph(areaID) {

    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    const n = 100;
    const nodeArray = [];
    const linkArray = [];
    for (var i = 0; i < n; i++) {
        nodeArray.push({ id: i });
        /*if (i + 1 < n) {
            linkArray.push({ source: i, target: i + 1, value: 1 });
        } else {
            linkArray.push({ source: i, target: 0, value: 1 });
        }*/
        let rand = getRandomInt(i);
        linkArray.push({ source: i, target: rand, value: Math.abs(rand - i) });
    }
    const data = { nodes: nodeArray, links: linkArray };

    console.debug(data);

    drawGraph(data, areaID);

    function drawGraph(data, areaID) {
        const graphHeader = 'LLNL Orgs';

        const margin = { top: stdMargin.top / 2, right: stdMargin.right / 2, bottom: stdMargin.bottom / 2, left: stdMargin.left / 2 },
            width = stdTotalWidth - margin.left - margin.right,
            height = stdTotalHeight - margin.top - margin.bottom;

        const chart = d3
            .select('.' + areaID)
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', [-width / 2, -height / 2, width, height]);

        const nodes = data.nodes;
        const links = data.links;

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(d => 30 / (3 - (2 / Math.log(100) * (Math.log(d.value))))))
            .force('charge', d3.forceManyBody())
            .force('x', d3.forceX())
            .force('y', d3.forceY());

        const link = chart
            .append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .enter()
                .append("line")
                .attr("stroke-width", d => 2 - (2 / Math.log(100) * (Math.log(d.value))) );

        const node = chart
            .append('g')
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5)
            .selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
                .attr('r', 5)
                .attr('fill', '#008080');

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

        return chart.node();
    }
}