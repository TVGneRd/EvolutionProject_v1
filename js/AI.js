var Neat = neataptic.Neat;
var Methods = neataptic.Methods;
var Config = neataptic.Config;
var Architect = neataptic.Architect;

var INPUT_SIZE = 5;
var OUTPUT_SIZE = 2;

var highestNetowrk = {score: 0, network: null};

class AI {
    world = {};
    neat = {};
    score = 0;

    constructor(world, parent = null, options = {mutation: false, rate: .3, chance: .1}) {

        this.world = world;

        if(!parent){
            this.network = this.getStartBrain();
        } else {

            if(parent.score > highestNetowrk.score){
                highestNetowrk.score = parent.score;
                highestNetowrk.network = parent;
            }

            this.network = neataptic.Network.fromJSON(parent.network.toJSON());
            if(options.mutation){
                this.mutation(options.rate, options.chance);
            }
        }
    }

    mutation(rate, chance){
      
        this.network.connections.forEach(connection => {
            if(Math.random() < chance){
                // console.error(1,connection.weight);
                connection.weight = Math.max(-1, Math.min(1, connection.weight + rate * (1 - 2 * Math.random()))); 
                // console.error(2, connection.weight);

            }
        });
    }

    activate(arr){
        return this.network.activate(arr);
    }

    getStartBrain() {
        var debug = true;
        if (neirons && !confirm("запускать нейросеть?")) {
            var network = neataptic.Network.fromJSON(neirons);
        } else {

            var network = new Architect.Perceptron(INPUT_SIZE,  Math.max(5, Math.round(40 * Math.random())), OUTPUT_SIZE);
            
            debug = true;

            /*  input {
                    0: тип объекта (от 0 - Х) {0 - еда}
                    1: угол до объекта
                    2: дистанция до объекта
                    3: разница масс этого объекта и выбранного получаем  с помощью ф-ии: getDifferenceForMass()
                    4: Синус времени
            } 
                output {
                    0: приоритет
                    1: угол направления
                }
            */

            let data = [];

            for (let i = 0; i <= 360; i++) {

                let a = i / 180 * Math.PI;
                let distance = Math.max(1, 500 * Math.random());
                let m = 500 * Math.random();

                m = getDifferenceForMass(m, this.world.eatMass);

                // console.log((i+1), [0, a / (Math.PI * 2), 1 / distance, m], [getPriority(0, a, distance, m), a / (Math.PI * 2)]);

                data.push({
                    input: [0, a / (Math.PI * 2), 1 / distance, m, Math.abs(Math.sin(i))],
                    output: [getPriority(0, a, distance, m), a / (Math.PI * 2)]
                });
            }

            for (let i = 0; i <= 360; i++) {

                let a = i / 180 * Math.PI;
                let distance = Math.max(1, 500 * Math.random());
                let m = 500 * Math.random();

                m = getDifferenceForMass(m, this.world.eatMass);

                // console.log((i+1), [0, a / (Math.PI * 2), 1 / distance, m], [getPriority(0, a, distance, m), a / (Math.PI * 2)]);

                data.push({
                    input: [1, a / (Math.PI * 2), 1 / distance, m, Math.abs(Math.sin(i))],
                    output: [getPriority(1, a, distance, m), (a < Math.PI ?  Math.PI - a : a -  Math.PI) / (Math.PI * 2)]
                });
            }


            network.train(data, {
                log: 100,
                iterations: 1000000,
                error: 1e-5,
                rate: 0.3,
                momentum: 0.9,
                ratePolicy: Methods.Rate.EXP(),
                shuffle: true,
                schedule: {
                    function: function (data) {
                        console.log(data)
                    },
                    iterations: 100
                }
            });
        }


        // проверка
        var error = 0;

        var max = 0;
        var min = 2 * Math.PI;

        for (let i = 0; i <= 100; i++) {
            let a = Math.random() * 2 * Math.PI;
            let distance = Math.max(1, 500 * Math.random());
            let m = 500 * Math.random();

            m = getDifferenceForMass(m, this.world.eatMass);

            let priority = getPriority(0, a, distance, m);

            let res = this.checkNetwork(network, [0, a / (Math.PI * 2), 1 / distance, m, Math.abs(Math.sin(i))], [priority, a / (Math.PI * 2)], {
                error: error,
                min: min,
                max: max
            })

            error = res.error;
            min = res.min;
            max = res.max;

        }

        debug = true;

        if (debug) {
            console.log("Средний уровень ошибки: " + (error / Math.PI * 180));
            console.log("Мин / Макс " + (min / Math.PI * 180) + " / " + (max / Math.PI * 180));
            console.log(JSON.stringify(network.toJSON()));
        }

        return network;
    }

    checkNetwork(network, params, real, options) {
        var debug = true;

        let res = network.activate(params);

        let priority = res[0];

        options.error = (options.error + Math.abs(priority - real)) / 2;

        options.min = Math.min(Math.abs(priority - real), options.min);
        options.max = Math.max(Math.abs(priority - real), options.max);
        if (debug) {
            console.log("====================");
            console.log("[Data] ", params);
            console.log("[AI] ", res[0] , res[1] * (Math.PI * 2) / Math.PI * 180, " (" + res + ")");
            console.log("[Real] " ,  real[0] , real[1] * (Math.PI * 2) / Math.PI * 180 , ` (${real})`);
        }
        return options;
    }
}