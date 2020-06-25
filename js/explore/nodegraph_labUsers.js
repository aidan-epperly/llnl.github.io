/* Creates node graph visualization for webpage */
function draw_nodegraph_labUsers(areaID) {
    // load data file, process data, and draw visualization
    var url = ghDataDir + '/labUsers.json';
    d3.json(url, function(obj) {
        var data = reformatData(obj);
        drawGraph(data, areaID);
    });

    // Draw graph from data
    function drawGraph(data, areaID) {
        const graphHeader = 'LLNL Org. Repos';

        const margin = { top: stdMargin.top, right: stdMargin.right, bottom: stdMargin.bottom, left: stdMargin.left },
            width = stdWidth,
            height = stdHeight;
        const dotRadius = 40;
        const averageHMargin = (margin.right + margin.left)/2;
        const averageVMargin = (margin.top + margin.bottom)/2;
        const center = [margin.left - averageHMargin + width/2, margin.top - averageVMargin + height/2];

        const root = d3.hierarchy(data);

        const chart = d3
            .select('.' + areaID)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        
        // Add title
        const title = chart
            .append('text')
            .attr('class', 'graphtitle')
            .attr('x', width / 2)
            .attr('y', 0 - margin.top / 3)
            .attr('text-anchor', 'middle')
            .text(graphHeader);

        function update(source, animate) {
            // WARNING NO DATA VALIDATION
            let headNode = source;
            let childNodes = headNode.children.slice(0,6);

            console.debug(headNode);

            let theta = d3
                .scaleLinear()
                .domain([
                    d3.min(childNodes, function(c) {
                        return c['data']['id'];
                    }) ,
                    d3.max(childNodes, function(c) {
                        return c['data']['id'];
                    }) + 1    
                ])
                .range([
                    0,
                    2*Math.PI
                ]);

            let r = d3
                .scaleLinear()
                .domain([0,1])
                .range([0,width/2 - averageHMargin]);

            // Creates groups for children nodes
            let gCNodes = chart
                .append('g')
                .attr('cursor', 'pointer')
                .attr('pointer-events', 'all');

            // Creates a group for each child to hold text and circle
            let cNodes = gCNodes
                .selectAll('g')
                .data(childNodes)
                .enter()
                .append('g')
                .attr('transform', function(c) {
                    return 'translate(' + center[0] + ',' + center[1] + ')';
                });

            // Adds circle to each child
            cNodes
                .append('circle')
                .attr('class', 'circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', dotRadius + 5)
                .on('click', function(c) {
                    if(c.children != null) {
                        let dur = 700
                        cNodes
                            .transition()
                            .duration(dur)
                            .attr('transform', 'translate(' + center[0] + ',' + center[1] + ')');
                        setTimeout(function(){
                            gCNodes.remove();
                            gPNode.remove();
                            update(c);
                        }, dur)
                    }
                });

            // Adds each childs name
            let cNames = cNodes
                .append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '5')
                .text(function(c) {
                    return c['data']['name'];
                })
                .attr('fill', 'white')
                .attr('lengthAdjust', 'spacingAndGlyphs')
                .attr('textLength', function(c) {
                    return c['data']['name'].length * 7.5 > 87 ? 87 : c['data']['name'].length * 7.5;
                });

            let gPNode = chart
                .append('g')
                .attr('cursor', 'pointer')
                .attr('pointer-events', 'all');

            let pNode = gPNode
                .selectAll('g')
                .data([headNode]) // Data needs to be in array form to work properly
                .enter()
                .append('g')
                .attr('transform', 'translate(' + center[0] + ',' + center[1] + ')');

            pNode
                .append('circle')
                .attr('class', 'circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', dotRadius + 10)
                .on('click', function(p) {
                    if(p.parent != null) {
                        let dur = 700
                        cNodes
                            .transition()
                            .duration(dur)
                            .attr('transform', 'translate(' + center[0] + ',' + center[1] + ')');
                        setTimeout(function(){
                            gCNodes.remove();
                            gPNode.remove();
                            update(p.parent);
                        }, dur)
                    }
                });

            pNode
                .append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '5')
                .text(function(p) {
                    return p['data']['name'];
                })
                .attr('lengthAdjust', 'spacingAndGlyphs')
                .attr('textLength', function(p) {
                    return p['data']['name'].length * 7.5 > 98 ? 98 : p['data']['name'].length * 7.5;
                })
                .attr('fill', 'white');

            // Plays animation
            cNodes
                .transition()
                .duration(700)
                .attr('transform', function(c) {
                    let xCoord = r(0.7)*(Math.cos(theta(c['data']['id']))) + center[0];
                    let yCoord = r(0.7)*(Math.sin(theta(c['data']['id']))) + center[1];
                    return 'translate(' + xCoord + ',' + yCoord + ')';
                });
        }
        
        update(root, false);
    }

    // Turn json obj into desired working data
    // WARNING NO DATA VALIDATION
    function reformatData(obj) {
        // Creates an object called organization from labUsers.json that orders data org -> suborg -> repo -> user
        var organization = { name: 'LLNL', url: 'https://www.llnl.gov/', suborganizations: {} };
        var names = Object.keys(obj['data']);
        names.forEach(function(name) {
            if(obj['data'][name]['contributedLabRepositories'] != null) {
                var reposAndSubOrgs = obj['data'][name]['contributedLabRepositories']['nodes'];
                reposAndSubOrgs.forEach(function(repoAndSubOrg) {
                    let split = repoAndSubOrg.split('/');
                    let repo = split[1];
                    let subOrg = split[0];
                    if(organization['suborganizations'] != null && organization['suborganizations'][subOrg] != undefined) {
                        if(organization['suborganizations'][subOrg]['repos'].hasOwnProperty(repo)) {
                            let userName = obj['data'][name]['name'] != null ? obj['data'][name]['name'].replace(' ','\n') : name.replace(' ','\n');
                            organization['suborganizations'][subOrg]['repos'][repo]['users'][name] = { name: userName };
                        } else {
                            let userName = obj['data'][name]['name'] != null ? obj['data'][name]['name'].replace(' ','\n') : name.replace(' ','\n');
                            organization['suborganizations'][subOrg]['repos'][repo] = { name: repo, users: {} };
                            organization['suborganizations'][subOrg]['repos'][repo]['users'][name] = { name: userName };
                        }
                    } else {
                        let userName = obj['data'][name]['name'] != null ? obj['data'][name]['name'].replace(' ','\n') : name.replace(' ','\n');
                        organization['suborganizations'][subOrg] = { name: subOrg, repos: {} };
                        organization['suborganizations'][subOrg]['repos'][repo] = { name: repo, users: {} };
                        organization['suborganizations'][subOrg]['repos'][repo]['users'][name] = { name: userName };
                    } 
                })
            }
        });


        // Converts organization into data matching d3 hierarchy layout
        let subOrgArray = [];
        let subOrgs = Object.keys(organization['suborganizations']);
        let i = 0,
            j = 0,
            k = 0
            l = 0;
        subOrgs.forEach(function(subOrg) {
            j = 0;
            let repoArray = [];
            let repos = Object.keys(organization['suborganizations'][subOrg]['repos']);
            repos.forEach(function(repo) {
                k = 0;
                let userArray = [];
                let users = Object.keys(organization['suborganizations'][subOrg]['repos'][repo]['users']);
                users.forEach(function(user) {
                    l = 0;
                    let secondRepoArray = [];
                    let name = organization['suborganizations'][subOrg]['repos'][repo]['users'][user]['name'];
                    if(obj['data'][user]['contributedLabRepositories'] != undefined) {
                        let secondRepos = obj['data'][user]['contributedLabRepositories']['nodes'];
                        secondRepos.forEach(function(secondRepo) {
                            secondRepoArray.push({ name: secondRepo.split('/')[1], id: l });
                            l++;
                        });
                        userArray.push({ name: name, id: k, children: secondRepoArray });
                    } else {
                        userArray.push({ name: name, id: k, children: [] });
                    }
                    k++;
                });
                repoArray.push({ name: repo, id: j, children: userArray });
                j++;
            });
            subOrgArray.push({ name: subOrg, id: i, children: repoArray });
            i++;
        });
        let data = { name: organization['name'], children: subOrgArray };
        return data;
    }
}