const getGroups = function (results) {
    const groupSubset = document.querySelector('#group-subset');

    let groups;
    switch (groupSubset.value) {
        case 'red':
            groups = [
                ...new Set(
                    results
                        .filter((d) => Math.abs(parseInt(d.Flag)) === 2)
                        .map((d) => d.GroupID)
                ),
            ];
            break;
        case 'amber':
            groups = [
                ...new Set(
                    results
                        .filter((d) => Math.abs(parseInt(d.Flag)) === 1)
                        .map((d) => d.GroupID)
                ),
            ];
            break;
        case 'red-or-amber':
            groups = [
                ...new Set(
                    results
                        .filter((d) => Math.abs(parseInt(d.Flag)) >= 1)
                        .map((d) => d.GroupID)
                ),
            ];
            break;
        default:
            groups = [...new Set(results.map((d) => d.GroupID))];
    }

    return groups;
};
