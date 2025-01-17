var mutations = [];
var contractName = "";

var selectedStatus = "";
var selectedOperator = "";

var mutantLoaded = 0;
const mutantToLoad = 100;
var loadingComplete = false;
const linesRange = 3;

var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));

$(document).ready(function () {
    // Obtaining the current script path
    var scriptPath = $('script[src$="./resources/js/conract.js"]').attr('src');
    console.log(scriptPath);

    readMutationJson();

    inizializeContent();

});

async function inizializeContent() {
    try {

        receiveContractName();
        setupContractName();
        statusFilter();

        const response = await loadComponent("./resources/components/summary/summary.html");
        $("#summary-container").html(response);

        loadData(() => {
            processContractJson();
            setupContentLoader();
            var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
                return new bootstrap.Popover(popoverTriggerEl, { content: getContentPopover(popoverTriggerEl["attributes"]["data-bs-content"].value), html: true });
            });
        });

    } catch (error) {
        console.log(error);
    }
}

// Obtains the contract name via URL
function receiveContractName() {
    var encodedData = new URLSearchParams(window.location.search).get('data');
    contractName = JSON.parse(decodeURIComponent(encodedData));
}

// Set the page's title and displays the name of the contract
function setupContractName() {
    document.getElementById('title').textContent = contractName;
    document.getElementById('contract').textContent = contractName;
}

function inizializeVariables() {
    summary = { testedMutants: 0, totalMutants: 0, time: 0, killed: 0, live: 0 };
    mutationsStatus = initMutationsStatus();
}

function setupContentLoader() {
    window.addEventListener('scroll', function () {
        // Check whether the user has reached the bottom of the page
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            if (!loadingComplete)
                processTableMutationsBody(false);
        }
    });
}

function processContractJson() {

    inizializeVariables();

    $.each(mutationsJson, function (index, item) {
        if (index === contractName) {
            mutations = Object.assign({}, item);
            return;
        }
    });

    $.each(mutations, function (index, item) {
        summaryCreation(item);
    })

    // Change html view
    processSummaryView();
    operatorsFilter();
    fillTableMutations();
}

function fillTableMutations() {
    console.log("Creation of the Operators Table ...");

    processTableMutationsHead();
    processTableMutationsBody(false);

    console.log("DONE!");
}

function processTableMutationsHead() {
    var tableHead = $('#mutations-table thead');

    if (tableHead.children().length > 0)
        return;

    var header = $('<tr>');

    $('<th>').text("Hash").appendTo(header);
    $('<th>').text("LOC").appendTo(header);
    $('<th>').text("Function").appendTo(header);
    $('<th>').text("Operator").appendTo(header);
    $('<th>').text("Original").appendTo(header);
    $('<th>').text("Replacement").appendTo(header);
    $('<th>').text("Status").appendTo(header);
    $('<th>').text("Time(s)").appendTo(header);

    header.appendTo(tableHead);

}

/**
 * 
 * @param {boolean} clear true, remove all elements in the table; false, otherwise
 */
function processTableMutationsBody(clear) {
    var tableBody = $('#mutations-table tbody');

    let loaded = mutantToLoad;
    let count = 0;

    if (clear) {
        tableBody.empty();
        mutantLoaded = 0;
        loadingComplete = false;
    }

    // Extract mutation objects into an array
    let mutationArray = Object.values(mutations);

    // Sort mutations based on the startLine
    mutationArray.sort((a, b) => {
        if (a.startLine < b.startLine) return -1;
        if (a.startLine > b.startLine) return 1;
        return 0;
    });

    mutationArray.forEach(item => {

        if (loaded <= 0)
            return false; // exit loop

        if (!applyFilters(item))
            return true; // skips to the next iteration

        count++;
        if (count <= mutantLoaded)
            return true;

        var row = $('<tr>').attr('onclick', `compareContracts('${item.id}')`);
        $('<td>').text(item.id).appendTo(row);
        $('<td>').text(item.startLine === item.endLine ? item.startLine : item.startLine + "-" + item.endLine).appendTo(row);
        $('<td>').text(item.functionName).appendTo(row);
        $('<td>').text(item.operator).appendTo(row);
        $('<td>').text((item.original == null ? "null" : item.original)).appendTo(row);
        $('<td>').text((item.replace == null ? "null" : item.replace)).appendTo(row);
        $('<td>').text(item.status).appendTo(row);
        $('<td>').text((item.testingTime * 0.001).toFixed(0)).appendTo(row);

        loaded--;
        row.appendTo(tableBody);
    });

    if (loaded > 0) loadingComplete = true;

    mutantLoaded += (mutantToLoad - loaded);
}

function statusFilter() {
    // Add options dynamically
    var select = $('#status-menu');

    for (var key of initMutationsStatus().keys()) {
        select.append($('<option></option>').val(key.charAt(0).toLowerCase() + key.slice(1)).text(key));
    }
}

function operatorsFilter() {
    // Add options dynamically
    var select = $('#operators-menu');

    if (select.children().length > 1) return;

    $.each(operatorsJson, function (opr, value) {
        select.append($('<option></option>').val(opr).text(opr));
    });
}

function handleFilterChange(type, value) {
    switch (type) {
        case "status":
            selectedStatus = value;
            break;
        case "operator":
            selectedOperator = value;
            break;
        default:
            return;
    }

    processTableMutationsBody(true);
}

function applyFilters(mutant) {


    let statusFilter = selectedStatus === "" ||
        (selectedStatus === "tested" && mutant.status !== null) ||
        (selectedStatus === "to-test" && mutant.status === null) ||
        mutant.status === selectedStatus;

    let operatorFilter = selectedOperator === "" || mutant.operator === selectedOperator

    return statusFilter && operatorFilter;
}

function downloadMutantsCSV() {
    downloadCSV(generateCSV(), contractName.split(".")[0]);
}

function generateCSV() {
    // Create an empty array to hold the CSV rows
    var csvData = [];

    // Creation of csv header
    var headers = '"Hash","Operator","StartLine","EndLine", "Function", "Original","Replacement","Status","Time(s)"';
    csvData.push(headers);

    // console.log(mutations);
    $.each(mutations, function (index, m) {
        let time = (m.testingTime * 0.001).toFixed(0);
        let row =
            '"' + m.id
            + '","' + m.operator
            + '","' + m.startLine
            + '","' + m.endLine
            + '","' + m.functionName
            + '","' + (m.original == null ? 'null' : m.original.replaceAll('\n', '\\n')?.replaceAll('"', '""'))
            + '","' + (m.replace == null ? 'null' : m.replace.replaceAll('\n', '\\n')?.replaceAll('"', '""'))
            + '","' + m.status
            + '","' + time
            + '"'
        csvData.push(row);
    })

    // Create the CSV content by joining the CSV rows
    return csvData.join('\n');
}

function compareContracts(mutantId) {
    writeModalTitle(mutantId);

    let differences;
    $.each(mutations, function (index, item) {
        // console.log(mutantId, item)
        if (item.id === mutantId) {
            differences = item.diff;
            return false;
        }

    });

    // console.log("differences: \n" + differences);

    checkDifferences(differences);
}


function checkDifferences(differences) {

    if (!differences) {
        alert("There is no data to display for this mutant!");
        return;
    }

    //Open the modal
    openModal('#differences-modal');

    let diff = differences.split('\n')

    var preElement = document.createElement('pre');
    var codeElement = document.createElement('code');
    codeElement.classList.add('js');
    preElement.appendChild(codeElement);

    diff.forEach(function (part) {

        var className = "hljs-line";

        let ignore = false;
        if (part.includes("---")) {
            className = "hljs-deletion";
            ignore = true;
        }
        else if (part.includes("+++")) {
            className = 'hljs-addition';
            ignore = true
        }

        var partElement = document.createElement('span');
        partElement.classList.add(className);
        partElement.textContent = part;

        codeElement.appendChild(partElement);
        //if (!ignore) << DO NOT REMOVE >>
        hljs.highlightElement(partElement);
    });

    var contractDifferencies = document.getElementById("contract-differences");
    contractDifferencies.appendChild(preElement);
}

// function showDifferences(line, color) {
//     let p = $('#contract-differences p');
//     $('<span>').append(line + '<br>')
//         .attr('style', 'background-color:' + color)
//         .appendTo(p);
// }

function clearModalContent() {
    // Clear the content inside the modal
    $('#contract-differences').empty();
}

function writeModalTitle(mutantId) {
    $('#mutant-modal-title').html("Mutant: <strong>" + mutantId + "</strong>");
}
