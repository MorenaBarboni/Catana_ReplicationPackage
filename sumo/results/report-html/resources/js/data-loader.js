//"../history/my-project-2023-06-06-16-32-16/results/mutations.json"
var mutationsJsonDefaultPath = "../mutations.json";
var historyPath = "../../history";
var historyMuatationsJsonPath = "results/mutations.json";

var mutationsJson = undefined;
var operatorsJson = undefined;
var configJson = undefined;
var mutationsJsonHistoryPath = new Map();
var mutationsJsonPath = mutationsJsonDefaultPath;

var pollingInterval = 1000;
var pollingActive = false;
var mutationFileTimestamp = 0;
var pollingIntervalId;

function loadData(callback) {

    console.log("Loading data ... ");
    readMutationJson();
    $.when(
        $.ajax({
            url: mutationsJsonPath,
            dataType: 'json',
            error: function () {
                alert('Error loading mutations.json file.');
            }
        }),
        $.ajax({
            url: './resources/data/operators.config.json',
            dataType: 'json',
            error: function () {
                alert('Error loading operators.config.json file.');
            }
        }),
        $.ajax({
            url: './resources/data/config.json',
            dataType: 'json',
            error: function () {
                alert('Error loading config.json file.');
            }
        })
    ).done(function (mutationsData, operatorsData, configData) {
        console.log("DONE!");
        mutationFileTimestamp = mutationsData[2].getResponseHeader('Last-Modified');
        mutationsJson = Object.assign({}, mutationsData[0]);
        operatorsJson = Object.assign({}, operatorsData[0]);
        configJson = configData[0];

        callback();

        if (!pollingActive && mutationsJsonPath === mutationsJsonDefaultPath) {
            startFilePolling(callback);
        }

    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.log("Error AJAX: " + textStatus + ", " + errorThrown);
    });
}

function loadHistory(callback) {

    console.log("Loading history ... ");
    mutationsJsonHistoryPath.clear();

    $.when(
        $.ajax({
            url: historyPath
        })
    ).done(async function (historyData) { //configData
        console.log("DONE!");

        //configJson = configData[0];

        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = historyData;

        let hrefs = Array.from(tempDiv.getElementsByTagName('a'))
            .map(a => a.getAttribute('href'))
            .filter(s => s.includes("/history/"))
            .map(h => h.split("/history/")[1]);

        // hrefs.forEach(async h => {
        //     let hash = await generateHashFromFile(historyPath + "/" + h + "/" + historyMuatationsJsonPath);
        //     mutationsJsonHistoryPath.set(historyPath + "/" + h + "/" + historyMuatationsJsonPath, hash);
        // });

        for (let h of hrefs) {
            let hash = await generateHashFromFile(historyPath + "/" + h + "/" + historyMuatationsJsonPath)
            // console.log(hash, historyPath + "/" + h + "/" + historyMuatationsJsonPath)
            mutationsJsonHistoryPath.set(historyPath + "/" + h + "/" + historyMuatationsJsonPath, hash);
        }

        callback();
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.log("Error AJAX: " + textStatus + ", " + errorThrown);
    });

}

function loadNewMutationsJson(path) {
    if (path == mutationsJsonPath) return;

    if (path == mutationsJsonDefaultPath || path === "last") {
        stopFilePolling();
        pollingActive = false;
        mutationsJsonPath = mutationsJsonDefaultPath;
        saveMutationJson(mutationsJsonPath);
        return;
    }

    let index = mutationsJsonHistoryPath.has(path);

    if (!index) {
        console.log("Error loading history", path);
        return;
    }

    mutationsJsonPath = path;
    stopFilePolling();
    saveMutationJson(mutationsJsonPath);
}

function saveMutationJson(value) {
    sessionStorage.setItem("mutations-path", value);
}

function readMutationJson() {

    let value = sessionStorage.getItem("mutations-path");

    if (!value || value === "last") {
        value = mutationsJsonDefaultPath;
        saveMutationJson(value);
    }

    mutationsJsonPath = value;
}

function startFilePolling(callback) {
    pollingActive = true;
    pollingIntervalId = setInterval(() => {
        $.ajax({
            url: mutationsJsonPath,
            type: 'HEAD', // HEAD request to obtain only the header of files without downloading them
            success: function (data, textStatus, jqXHR) {
                var newMutationFileTimestamp = jqXHR.getResponseHeader('Last-Modified');
                if (newMutationFileTimestamp !== mutationFileTimestamp) {
                    mutationFileTimestamp = newMutationFileTimestamp;
                    loadData(callback);
                }
            }
        });
    }, pollingInterval);
}

function stopFilePolling() {
    // console.log("pollingIntervalId", pollingIntervalId)
    clearInterval(pollingIntervalId);
}