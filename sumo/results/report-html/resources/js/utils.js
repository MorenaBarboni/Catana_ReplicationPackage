
function redirectToPage(url) {
    window.location.href = url;
}

function returnToPreviousPage() {
    window.history.back();
}

function initMutationsStatus() {
    return new Map([
        ['Stillborn', 0], ['Timedout', 0], ['Uncovered', 0], ['Live', 0], ['Killed', 0]
    ]);
}

function loadComponent(relativePath) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: relativePath,
            method: "GET",
            dataType: "html",
            success: function (response) {
                resolve(response);
            },
            error: function (xhr, status, error) {
                reject("Error loading component:", url, error);
            }
        })
    })
}

function getMsColor(ms) {

    if (ms >= 80)
        return "rgb(64, 133, 88)";

    if (ms >= 60 && ms < 80)
        return "rgb(245, 195, 68)";

    return "rgb(203, 68, 74)";
}

function getColor(ms) {
    if (ms >= 80)
        return "success";

    if (ms >= 60 && ms < 80)
        return "warning";

    return "danger";
}

function downloadCSV(csvFile, filename) {
    // Create a data URI for the CSV content
    var encodedUri = 'data:text/csv;charset=utf-8,' + encodeURI(csvFile);

    // Create a download link element
    var link = $('<a>')
        .attr('href', encodedUri)
        .attr('download', filename);

    // Append the link to the document body and trigger the click event
    $('body').append(link);
    link[0].click();
}

function getContentPopover(content) {
    switch (content) {
        case "csv":
            if (summary.totalMutants == summary.testedMutants) {
                return "Export to csv file"
            }
            return "Export to csv file  <br> <strong>Incomplete data!</strong> <img src='./resources/data/alert.svg' class='alert-icon pb-1'>";
        case "settings":
            return "Settings";
        default:
            return content;
    }

}

function openModal(modal) {
    $(modal).modal('show');
    $('<p>').appendTo('#contract-differencies');
}

function generateHashFromFile(path) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: path,
            method: "GET",
            dataType: "json",
            success: function (response) {
                $.each(response, function (ctr, mutations) {
                    $.each(mutations, function (index, item) {
                        item.testingTime = 0;
                    });
                });
                var spark = new SparkMD5();
                spark.append(JSON.stringify(response));
                resolve(spark.end());
            },
            error: function (xhr, status, error) {
                reject("Error hash file:", path, error);
            }
        })
    })

}
