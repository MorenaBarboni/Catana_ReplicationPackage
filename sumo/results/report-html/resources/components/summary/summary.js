var summary = { testedMutants: 0, totalMutants: 0, time: 0, killed: 0, live: 0 };
var dataChart = [0, 0, 0, 0, 0, 0];
var mutationsStatus = initMutationsStatus();
var chartStepSize = 1;

var histogramChart = new Chart(document.getElementById('histogramChart'), {
    type: 'bar',
    data: {
        labels: Array.from(mutationsStatus.keys()),
        datasets: [{
            label: 'Mutations',
            data: dataChart,
            borderWidth: 2,
            borderRadius: 3,
            borderColor: 'rgb(0, 128, 255, 0.8)',
            backgroundColor: 'rgb(0, 128, 255, 0.5)'

        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: chartStepSize
                }
            }
        },
        plugins: {
            legend: {
                position: "bottom"
            }
        }
    }
});

$(document).ready(function () {

    window.addEventListener('resize', function () {
        histogramChart.resize();
    });

})

function inizializeSummary() {
    summary = { testedMutants: 0, totalMutants: 0, time: 0, killed: 0, live: 0 };
    mutationsStatus = initMutationsStatus();
}

function summaryCreation(mutant) {
    summary.totalMutants += 1;

    if (!mutant.status) return;

    var mutantStatus = mutant.status.charAt(0).toUpperCase() + mutant.status.slice(1);
    summary.testedMutants += 1;

    summary.time += (mutant.testingTime / 60000);
    if (mutantStatus == 'Live' || mutantStatus == 'Killed')
        summary[mutant.status] += 1;

    mutationsStatus.set(mutantStatus, mutationsStatus.get(mutantStatus) + 1);
}

function processSummaryView() {
    console.log("Creation of the Summary ...");


    var ms = "0.0";
    if (summary.killed + summary.live !== 0)
        ms = ((summary.killed / (summary.killed + summary.live)) * 100).toFixed(1);

    document.getElementById('mutants').textContent = summary.testedMutants + " / " + summary.totalMutants;
    document.getElementById('valid').textContent = summary.killed + summary.live;
    document.getElementById('time').textContent = (summary.time).toFixed(1);
    document.getElementById('ms').textContent = ms + "%";
    document.documentElement.style.setProperty("--ms-color", getMsColor(ms));


    if (summary.totalMutants > 1000) {
        chartStepSize = Math.ceil(summary.totalMutants / 1000);
        histogramChart.options.scales.y.ticks.stepSize = chartStepSize;
    }

    var i = 0;
    for (let ms of mutationsStatus.values()) {
        dataChart[i] = ms;
        i++
    }

    histogramChart.update();

    console.log("DONE!");
}