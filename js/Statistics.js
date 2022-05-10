class Statistic {
    EntitysCountStatistics = [];
    EntitysgenesStatistics = [];
    PerfomanceStatistics = [];

    names = {
        predator: "Хищные особи",
        peaceful: "Мирные особи",
        total: "Общее количетсво",
        fps: "FPS",
        entitysCount: "Количесвто особей",
        averageMass: "Средня масса"

    };
    
    genes = {
        speed: "Скорость",
        sonarRadius: "Радиус обзора",
        devisionRatio: "Процент отданой массы при делении",
        minMassForDiv: "Минимальная масса для деления",

    };
    world = {};
    charts = [];
    showedGraphics = 0;

    constructor(world) {
        this.world = world;

        $("#add-graphic").on("click", () => {
            this.addGraphickBlock();
        });

        $('#statisticsModal').on('show.bs.modal', (e) => {
            this.world.stopScaling = true;
            $("#statistic-container select").each((index, element)=>{
                if($(element).val() != "null"){
                    this.bindGraphics(element, true);
                }
            });
        });
        $('#statisticsModal').on('hide.bs.modal', (e) => {
            this.world.stopScaling = false;

        });
    }
    update() {
        if (this.world.tick % 1000 == 0) {
            let stats = {
                total: this.world.EntitysCount
            };
            let stats2 = {};
            let stats3 = {
                entitysCount: this.world.EntitysCount,
                fps: this.world.fps,
                averageMass: 0
            };

            this.world.Entitys.forEach(entity => {

                stats3.averageMass =  Math.round((stats3.averageMass + entity.mass) / 2,2);

                stats[entity.population] = (!stats[entity.population]) ? 1 : stats[entity.population] + 1;
                for(let gen in this.genes){
                    if(!stats2[entity.population]){
                        stats2[entity.population] = {};
                    }
                    if(!stats2[entity.population][gen]){
                        stats2[entity.population][gen] = parseFloat(entity[gen]);
                    } else {
                        stats2[entity.population][gen] = parseFloat(((stats2[entity.population][gen] + parseFloat(entity[gen])) / 2).toFixed(2));
                    }

                }
            });
            this.world.populations.forEach(element => {
                if (!stats[element]) {
                    stats[element] = 0;
                }
                if (!stats2[element]) {
                    stats2[element] = {};
                    for (let gen in this.genes) {
                        stats2[element][gen] = 0;
                    }
                }
            });

            this.EntitysCountStatistics.push(stats);
            this.EntitysgenesStatistics.push(stats2);
            this.PerfomanceStatistics.push(stats3);

            if ($("#statisticsModal").hasClass("show")) { // авто обновление графиков
                $("#statistic-container select").each((index, element)=>{
                    if($(element).val() != "null"){
                        this.bindGraphics(element, true);
                    }
                });
            }
          
        }
    }

    addGraphickBlock() {
        let block = $(".graphics-block.d-none").clone();
        block.removeClass("d-none");
        let id = "graph-" + this.showedGraphics++;
        block.attr("id", id);
        block.find("select").attr("data-graph", "#" + id);

        let obList = {
            propEvolition: "Эволюция признаков"
        };
        for (let pop in this.world.populations) { // популяции
            for (let ob in obList) { // параметры для отслеживания
                block.find("select").append(`<option value="${ob}" data-population='${this.world.populations[pop]}'>${this.names[this.world.populations[pop]]}: ${obList[ob]}</option>`);
            }
        }

        block.find("select").on("change", (el) => {
            this.bindGraphics(el.target);
        });

        let ctx = block.find("canvas")[0].getContext('2d');

        block.find("select").attr("data-chart-id", this.charts.length);

        this.charts.push(new Chart(ctx, {
            type: 'line',

            data: {},

            options: {}
        }));

        $("#statistic-container").append(block);

    }

    bindGraphics(el, isUpdate = false) {
        let stats = {};
        
        switch ($(el).val()) {
            case "entitys-count":
                stats = this.getEntitysCountStatistics();
                break;
            case "propEvolition":
                stats = this.getEntitygenesEvolution($(el).find("option:selected").attr('data-population'));
                break;
            case "perfomance":
                stats = this.getPerfomanceStats();
                break;    
        }

        let myLineChart = this.charts[$(el).attr("data-chart-id")];

        if(!isUpdate){
            myLineChart.data.datasets = [];
        }

        myLineChart.data.labels = stats.labels;    
        let i = 0;
        
        if(stats.datasets){
            stats.datasets.forEach(dataset => {
                if(!myLineChart.data.datasets[i]){
                    myLineChart.data.datasets[i] = dataset;                
                } else {
                    myLineChart.data.datasets[i].data = dataset.data;
                }
            
                i++;
            });
        } else {
            myLineChart.data.datasets = [];
        }

        myLineChart.update();      
    }

    getEntitysCountStatistics() {
        let colors = ["rgb(30,255,30)", "rgb(30,30,255)", "rgb(255,30,30)"];
        let bgColors = ["rgba(30,255,30,.3)", "rgba(30,30,255,.3)", "rgba(255,30,30,.3)"];

        let data = {
            labels: [],
            datasets: []
        };
        let kTick = 0;
        let lables = [];

        let datasets = {};

        this.EntitysCountStatistics.forEach(day => {
            let i = 0;
            for (let param in day) {

                if (!datasets[param]) {

                    datasets[param] = {
                        label: this.names[param],
                        data: [day[param]],
                        backgroundColor: (param != "total") ? bgColors[i] : "transparent",
                        borderColor: (param != "total") ? colors[i] : "#fe00f7"
                    };
                    i++;
                } else {
                    datasets[param].data.push(day[param]);
                }
            }

            lables.push(kTick + "0 кТик");
            kTick++;
        });

        for (let dataset in datasets) {
            data.datasets.push(datasets[dataset]);
        }

        data.labels = lables;

        return data;
    }

    getEntitygenesEvolution(population) {
        let colors = ["rgb(30,255,30)", "rgb(30,30,255)", "rgb(255,30,30)", "rgb(255,30,255)"];

        let smallParams = {speed: 100, devisionRatio: 100};

        let data = {
            labels: [],
            datasets: []
        };
        let kTick = 0;
        let lables = [];

        let datasets = {};

        this.EntitysgenesStatistics.forEach(day => {
            let i = 0;

            for (let param in day[population]) {
                let num = day[population][param];

                num = (smallParams[param]) ? num * smallParams[param]: num;

                if (!datasets[param]) {
                    datasets[param] = {
                        label: (this.genes[param])+((smallParams[param]) ? " x"+smallParams[param] : ""),
                        data: [num],
                        backgroundColor:  "transparent",
                        borderColor: colors[i],
                        trendlineLinear: {
                                style: colors[i],
                                lineStyle: "dotted",
                                width: 2
                            }
                        
                    };
                    i++;
                } else {
                    datasets[param].data.push(num);
                }
            }

            lables.push(kTick + "0 кТик");
            kTick++;
        });

        for (let dataset in datasets) {
            data.datasets.push(datasets[dataset]);
        }

        data.labels = lables;

        return data;
    }

    getPerfomanceStats(){
        let colors = ["rgb(30,255,30)", "rgb(30,30,255)", "rgb(255,30,30)"];
        let bgColors = ["rgba(30,255,30,.3)", "rgba(30,30,255,.3)", "rgba(255,30,30,.3)"];

        let data = {
            labels: [],
            datasets: []
        };
        let kTick = 0;
        let lables = [];

        let datasets = {};

        this.PerfomanceStatistics.forEach(day => {
            let i = 0;
            for (let param in day) {

                if (!datasets[param]) {

                    datasets[param] = {
                        label: this.names[param],
                        data: [day[param]],
                        backgroundColor: (param != "total") ? bgColors[i] : "transparent",
                        borderColor: (param != "total") ? colors[i] : "#fe00f7",
                        trendlineLinear: {
                            style: colors[i],
                            lineStyle: "dotted",
                            width: 2
                        }
                    };
                    i++;
                } else {
                    datasets[param].data.push(day[param]);
                }
            }

            lables.push(kTick + "0 кТик");
            kTick++;
        });

        for (let dataset in datasets) {
            data.datasets.push(datasets[dataset]);
        }

        data.labels = lables;

        return data;
    }
}