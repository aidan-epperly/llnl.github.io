function generate_trendyRepos(obj, cutoffWeeks, cutoffMonths, mostPopularRepos) {
    const data = [];

    for (var repo in obj['data']) {
        const repoLength = obj['data'][repo].length;
        const weekEntries = obj['data'][repo].slice(repoLength - cutoffWeeks, -1);
        const monthEntries = obj['data'][repo].slice(repoLength - cutoffMonths * 5, -1);
        const measure = sumTotal(monthEntries) == 0 ? 0 : sumTotal(weekEntries) * sumTotal(weekEntries)/sumTotal(monthEntries);
        data.push({ name: repo, entries: weekEntries, measure: measure });
        //console.debug({ name: repo, entries: weekEntries, measure: measure });
    }

    console.debug(mostPopularRepos);

    data.sort((a,b) => b.measure - a.measure);

    console.debug(data);

    return data.filter(d => !mostPopularRepos.some(o => `${o.owner}/${o.name}` == d.name)).slice(0, 10);

    function sumTotal(array) {
        let sum = 0;

        for (var i of array) {
            sum += i.total;
        }

        return sum;
    }
}