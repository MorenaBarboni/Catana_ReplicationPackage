var contracts = new Map();
var operatorsMap = new Map();

var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));

$(document).ready(function () {
    // Obtaining the current script path
    var scriptPath = $('script[src$="./resources/js/index.js"]').attr('src');
    console.log(scriptPath);

    //readMutationJson();
    loadHistory(() => { processHistoryDropdown() });
    inizializeContent();

});

async function inizializeContent() {

    try {

        if (!$("#summary-container").html()) {
            const response = await loadComponent("./resources/components/summary/summary.html");
            $("#summary-container").html(response);
        }

        loadData(() => {

            processJson();

            var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
                return new bootstrap.Popover(popoverTriggerEl, { content: getContentPopover(popoverTriggerEl["attributes"]["data-bs-content"].value), html: true });
            });
        });

    } catch (error) {
        console.log(error);
    }
}

function inizializeVariables() {
    contracts.clear();
    operatorsMap.clear();
    inizializeSummary();
}

function processJson() {

    inizializeVariables();
    $.each(operatorsJson, function (opr, value) {
        operatorsMap.set(opr, newOperatorDataRow(opr))
    });

    $.each(mutationsJson, function (ctr, mutations) {
        contractsCreation(ctr);
        $.each(mutations, function (index, item) {
            summaryCreation(item);
            fillContractInfo(ctr, item);
            var dataRow = operatorsMap.get(item.operator);
            if (dataRow) {
                dataRow.total += 1;
                if (item.status) {
                    dataRow[item.status] += 1;
                    dataRow.time += (item.testingTime / 60000);
                }
                dataRow.tested = dataRow.live + dataRow.killed;
                if (dataRow.killed + dataRow.live !== 0)
                    dataRow.ms = ((dataRow.killed / (dataRow.killed + dataRow.live)) * 100).toFixed(1);

            }
        });
    });

    // Change html view
    processSummaryView();
    processContractsTable();
    processOperatorsTable();

    if (summary.totalMutants === summary.testedMutants)
        processHistoryDropdown();
}

function contractsCreation(contract) {
    let contractInfo = {
        time: 0, total: 0, tested: 0, live: 0, killed: 0
    }
    contracts.set(contract, contractInfo);
}

function fillContractInfo(contract, mutant) {
    var info = contracts.get(contract);
    info.time += (mutant.testingTime);
    info.total += 1;
    if (mutant.status) {
        info.tested += 1;
        if (mutant.status === "live")
            info.live += 1;

        if (mutant.status === "killed")
            info.killed += 1;
    }
}

async function processHistoryDropdown() {
    readMutationJson();

    let listPath = Array.from(mutationsJsonHistoryPath.keys());

    var select = $('#history-menu');
    select.children('option:not(:first)').remove();

    await filterHistoryPath(listPath);

    for (var path of listPath) {
        var option = $('<option></option>').val(path)
            .text((path.split("/history/")[1]).split("/")[0]);

        if (path === mutationsJsonPath) {
            option.attr('selected', 'selected')
        }

        select.append(option);
    }
}

//TODOs
async function filterHistoryPath(listPath) {

    if (summary && configJson && summary.totalMutants === summary.testedMutants) {
        let lastHistoryHash = mutationsJsonHistoryPath.get(listPath.slice(-1)[0]);
        let lastHash = await generateHashFromFile(mutationsJsonDefaultPath)

        if (lastHistoryHash === lastHash) {
            listPath.pop();
        }
    }

    listPath.reverse();

    /*
        let usedHash = [];
        let paths = [];

        //Remove the last item in history if the ru is terminated
        if (summary && configJson && summary.totalMutants === summary.testedMutants && configJson.historyStatus && !mutationsJsonPath.includes("/history/")) {
            console.log("Last", listPath.slice(-1)[0]);
            let deleted = listPath.pop();
            console.log(deleted);
            usedHash.push(mutationsJsonHistoryPath.get(deleted))
        }

        // Visualize only different runs
        listPath.forEach(p => {
            let hash = mutationsJsonHistoryPath.get(p);
            if (usedHash.indexOf(hash) < 0) {
                paths.push(p);
                usedHash.push(hash);
            }
        });
        listPath.splice(0, listPath.length);
        listPath.push(...paths);
    
    */

}

function processContractsTable() {
    console.log("Creation of the Contracts Table ...");

    var tableBody = $('#contracts-table tbody');
    tableBody.empty();

    for (var contract of contracts.keys()) {
        let encodedData = encodeURIComponent(JSON.stringify(contract));
        let row = $('<tr>').attr('onclick', `redirectToPage('contract.html?data=${encodedData}')`);
        let contractsValue = contracts.get(contract);
        let ms = "0.00";
        if (contractsValue.killed + contractsValue.live !== 0)
            ms = ((contractsValue.killed / (contractsValue.killed + contractsValue.live)) * 100).toFixed(1);

        $('<td>').text(contract).appendTo(row);
        $('<td>').text(contractsValue.total).appendTo(row);
        $('<td>').text((contractsValue.time / 60000).toFixed(1)).appendTo(row);

        var mutationScore = $('<td>').attr('class', 'd-flex align-items-center').text(ms + "%");
        var divProgress = $('<div>').attr('class', 'progress ms-4');

        $('<div>').attr('class', 'progress-bar bg-' + getColor(ms))
            .attr('role', 'progressbar')
            .css('width', ms + '%')
            .appendTo(divProgress);
        divProgress.appendTo(mutationScore);
        mutationScore.appendTo(row);

        row.appendTo(tableBody);
    }

    console.log("DONE!");
}

function processOperatorsTable() {
    console.log("Creation of the Operators Table ...");

    processOperatorsTableHead();
    processOperatorsTableBody();
    processOperatorsTableFoot();

    console.log("DONE!");
}

function processOperatorsTableHead() {

    var tableHead = $('#operators-table thead');

    if (tableHead.children().length > 0)
        return;

    var header = $('<tr>');

    $('<th>').text("ID").appendTo(header);
    $('<th>').text("Total").appendTo(header);
    $('<th>').text("Stillborn").appendTo(header);
    $('<th>').text("Timedout").appendTo(header);
    $('<th>').text("Uncovered").appendTo(header);
    $('<th>').text("Tested").appendTo(header);
    $('<th>').text("Killed").appendTo(header);
    $('<th>').text("Live").appendTo(header);
    $('<th>').text("Mutation Score %").appendTo(header);
    $('<th>').text("Time(min)").appendTo(header);

    header.appendTo(tableHead);
}


function processOperatorsTableBody() {
    var tableBody = $('#operators-table tbody');

    tableBody.empty();

    for (var key of operatorsMap.keys()) {
        //Create new table row
        var row = $('<tr>').attr('id', key);
        var item = operatorsMap.get(key);
        $('<th>').text(key).appendTo(row);
        $('<td>').text(item.total).appendTo(row);
        $('<td>').text(item.stillborn).appendTo(row);
        $('<td>').text(item.timedout).appendTo(row);
        $('<td>').text(item.uncovered).appendTo(row);
        $('<td>').text(item.tested).appendTo(row);
        $('<td>').text(item.killed).appendTo(row);
        $('<td>').text(item.live).appendTo(row);
        $('<td>').text((parseFloat(item.ms)).toFixed(1)).appendTo(row);
        $('<td>').text((item.time).toFixed(1)).appendTo(row);

        row.appendTo(tableBody);
    }

}


function processOperatorsTableFoot() {
    var tableFoot = $('#operators-table tfoot');
    tableFoot.empty();
    var foot = $('<tr>');

    $('<th>').text("Total").appendTo(foot);
    $('<td>').text(summary.totalMutants).appendTo(foot);
    $('<td>').text(mutationsStatus.get("Stillborn")).appendTo(foot);
    $('<td>').text(mutationsStatus.get("Timedout")).appendTo(foot);
    $('<td>').text(mutationsStatus.get("Uncovered")).appendTo(foot);
    $('<td>').text(summary.killed + summary.live).appendTo(foot);
    $('<td>').text(mutationsStatus.get("Killed")).appendTo(foot);
    $('<td>').text(mutationsStatus.get("Live")).appendTo(foot);
    $('<td>').text(((summary.killed / (summary.killed + summary.live)) * 100).toFixed(1)).appendTo(foot);
    $('<td>').text((summary.time).toFixed(1)).appendTo(foot);


    foot.appendTo(tableFoot);
}

function newOperatorDataRow(opr) {
    return {
        operator: opr, total: 0,
        //null: 0, Maybe necessary when the status is null in processJson()
        stillborn: 0, timedout: 0, uncovered: 0, tested: 0, killed: 0, live: 0,
        ms: "0.0", time: 0
    }
}

function downloadContractsCSV() {
    downloadCSV(generateCSVfromJson(), "contracts");
}

function downloadOperatorsCSV() {
    downloadCSV(generateCSVfromTable(), "operators");
}

function generateCSVfromJson() {
    // Create an empty array to hold the CSV rows
    var csvData = [];

    // Extract the headers from the JSON object
    //const headers = Object.keys(mutationsJson[Object.keys(mutationsJson)[0]][0]);
    const headers = '"Hash","File","Operator","Start","End","StartLine","EndLine","Original","Replacement","Status","Time(ms)"';
    csvData.push(headers);

    var mutationJsoncpy = Object.assign({}, mutationsJson);
    $.each(mutationJsoncpy, function (ctr, mutants) {
        $.each(mutants, function (index, item) {
            var row = '"'
                + item.id
                + '","' + item.file
                + '","' + item.operator
                + '","' + item.start
                + '","' + item.end
                + '","' + item.startLine
                + '","' + item.endLine
                + '","' + (item.original == null ? 'null' : item.original.replaceAll('\n', '\\n')?.replaceAll('"', '""'))
                + '","' + (item.replace == null ? 'null' : item.replace.replaceAll('\n', '\\n')?.replaceAll('"', '""'))
                + '","' + item.status
                + '","' + item.testingTime
                + '"';
            csvData.push(row);
        });
    });

    // Create the CSV content by joining the CSV rows
    return csvData.join('\n');
}

function generateCSVfromTable() {
    // Create an empty array to hold the CSV rows
    var csvData = [];

    // Creation of csv header
    const headers = '"Operator","Total","Stillborn","Timedout","Uncovered","Tested","Killed","Live","MutationScore%","Time(min)"';
    csvData.push(headers);

    for (var value of operatorsMap.values()) {
        let row = [];

        Object.keys(value).forEach(function (field) {
            let data = value[field];
            if (field == "time")
                data = data.toFixed(1);
            if (field == "ms")
                data = parseFloat(data).toFixed(1);
            row.push('"' + data + '"');
        });
        csvData.push(row.join(','));
    }
    // Creation of csv footer
    var valid = summary.killed + summary.live;
    var ms = ((summary.killed / (summary.killed + summary.live)) * 100).toFixed(1);

    const footer = '"Total'
        + '","' + summary.totalMutants
        + '","' + mutationsStatus.get('Stillborn')
        + '","' + mutationsStatus.get('Timedout')
        + '","' + mutationsStatus.get('Uncovered')
        + '","' + valid
        + '","' + mutationsStatus.get('Killed')
        + '","' + mutationsStatus.get('Live')
        + '","' + ms
        + '","' + summary.time.toFixed(1)
        + '"';
    csvData.push(footer);

    // Create the CSV content by joining the CSV rows
    return csvData.join('\n');
}

function handleHistoryChange(value) {
    loadNewMutationsJson(value);
    inizializeContent();
}