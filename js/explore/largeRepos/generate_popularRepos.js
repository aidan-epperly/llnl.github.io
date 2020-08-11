function generate_popularRepos(obj, lineObj, commits, cutoff) {
    // Turn json obj into desired working data
    const data = [];
    const lineData = computeTotalAdditions(lineObj);

    console.debug(lineData);

    for (var repoWOwner in obj['data']) {
        const repoAndOwner = repoWOwner.split('/');
        const repoObj = obj['data'][repoWOwner];
        data.push({ name: repoAndOwner[1], owner: repoAndOwner[0], forks: repoObj['forks']['totalCount'], stars: repoObj['stargazers']['totalCount'], contributors: repoObj['mentionableUsers']['totalCount'], additions: lineData[repoWOwner] == undefined ? 0 : lineData[repoWOwner] });
    }

    if (commits) {
        data.sort((a, b) => b.stars - a.stars);
    } else {
        data.sort((a, b) => b.additions - a.additions);
    }

    console.debug(data);
    
    return data.slice(0, cutoff);
}

function computeTotalAdditions(obj) {
    const data = {};

    for (var repoWOwner in obj['data']) {
        let total = 0;

        for (var array of obj['data'][repoWOwner]) {
            total += array[1];
        }
        returnObj = data[repoWOwner] = total;
    }

    return data;
}