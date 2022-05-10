var ping = [];
var t0, t1;
var POPULATIONS = {
    peaceful : {
        name: 'Мирные',
        id : 1
    },
    predator : {
        name: 'Хищные',
        id : 2
    }
};
class World {
    removed = []; // УДОЛИ

    width = 300;
    height = 300;
    radiation = 30; // от 1 до 100
    worldUpdateTimer = 1; // ms, не забывай менять еду.
    eatSpawnTicks = 50; //  тик спавна еды
    eatCountPearTick = 20;
    tick = 0;
    eatMass = 7.5;
    maxLifeTime = 30; // вре жизни нашего опосума) в килоТиках (тик * 10^3)
    transPopulationChance = .01; // 0.002 шанс смены популяции. от 0 до 1
    statistic = {};
    neat = {};
    worldScale = 1;
    populations = ["peaceful", "predator"];

    stopScaling = false;

    startEntityGenus = {
        speed: 1,
        devisionRatio: 0.5,
        sonarRadius: 100,
        minMassForDiv: 70,
        population: this.populations[0]
    };

    Entitys = [];
    Eats = [];

    Sectors = {}; // сектора мира

    observerEntity = null;
    EntitysCount = 0;
    EatsCount = 0;
    lastCalledTime = 0;
    fps = 0;
    stopRun = false;

    worldInterval = 0;
    worldSize = 2;

    constructor() {
        this.width = $(".wrapper").width() * this.worldSize; // обязательно в размерах экранах иначе слетит разделение на сектора!
        this.height = $(".wrapper").height() * this.worldSize; // ###### обязательно в размерах экранах иначе слетит разделение на сектора!

        console.log(`World size ${this.width}x${this.height}`);

        this.backgroundCanvas = document.getElementById('background'); // канвас с отрисовкой животинки
        this.canvas = document.getElementById('world'); // канвас с отрисовкой еды

        this.canvas.width = this.backgroundCanvas.width = this.width;
        this.canvas.height = this.backgroundCanvas.height = this.height;

        this.Sectors = new Sectors(this.height, this.width, 25, 25);

        this.statickStage = new createjs.Stage(this.backgroundCanvas);
        this.worldStage = new createjs.Stage(this.canvas);

        this.worldStage.enableMouseOver(10);

        this.EatStage = new createjs.Container();
        this.EntityStage = new createjs.Container();

        this.worldStage.addChild(this.EatStage);
        this.worldStage.addChild(this.EntityStage);


        // this.initGreed([460, 461]); // 
        this.initGreed(this.Sectors.getSectorsByRadius(1200, 500, 300));
        // проверка сохранений

        let saves = new SavesManager(this);

        this.statistic = new Statistic(this);

        this.spawnEntity(40, new AI(this), this.startEntityGenus, this.width / 10, this.height / 10);

        this.observerEntity = this.Entitys[0];

        $("#btn-simulation-toggler").on("click", () => {
            if (this.worldInterval != -1) {
                this.stop();
            } else {
                this.start();

            }
        });

        $("#btn-observer-off").on("click", () => {
            this.observerEntity = null;
            $("#btn-observer-off").addClass("d-none");
        });


        // Добавляем ресайз отображаймой области
        $(".wrapper").scroll(() => {
            if (this.notScroll) {
                this.notScroll = false;
            } else {
                this.observerEntity = null;

            }
            this.render();
        });

        $(window).resize(() => {
            this.render();
        });

        $(window).bind('mousewheel', (e) => {

            if (this.stopScaling) {
                return;
            }

            if (e.originalEvent.wheelDelta > 0) {
                this.scaleWorld(0.05, e.clientX, e.clientY);
            } else {
                this.scaleWorld(-0.05, e.clientX, e.clientY);
            }

            this.render();

        });

        $(".wrapper").touchanddrag(() => {
            if (this.worldInterval && this.worldInterval != -1) {
                this.stopRun = true; // останавливаем мир чтобы сгладить передвижение
            }
        }, () => {
            if (this.stopRun) {
                this.stopRun = false; // запускаем мир снова
            }
        });

        console.log("Максимум еды на карте: " + this.width * this.height / 4500);

        // this.start();
    }

    run() {

        if (this.stopRun) { // исключение устанавливается во время скролла для более плавного перемещения
            return;
        }


        if (this.tick % this.eatSpawnTicks == 0) {
            this.addEat();
        }

        let t0 = performance.now();

        ping = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let renderedEnemy = 0;

        this.Entitys.slice(0).sort((a, b) => b.mass - a.mass).forEach(Entity => {
            if (Entity.mass <= 0) { // трупы не в счет!
                return;
            }
            Entity.Walk();
            renderedEnemy++;
        });

        let t1 = performance.now();


        if (this.observerEntity) {
            this.notScroll = true;
            $(".wrapper").scrollLeft(this.observerEntity.positionX - $(window).width() / 2)
                .scrollTop(this.observerEntity.positionY - $(window).height() / 2);
        }



        this.statistic.update();

        this.render();

        if (this.tick % 50 == 0) {

            console.log('Entity:', (t1 - t0).toFixed(2), 'ms ');
            console.log('Entity Ping:', ping.map( num => {
                return num.toFixed(2) * this.fps;
            }), 'ms. Sum: ', ping.reduce(function (sum, current) {
                return sum + current;
            }, 0).toFixed(2));
            console.log('Отрендерено:', renderedEnemy, 'мобов ');

            this.fps = this.requestAnimFrame().toFixed(0);

            if (this.observerEntity && this.observerEntity.body) {
                let m = this.observerEntity.mass.toFixed(1);
                let s = this.observerEntity.speed.toFixed(2);
                let r = this.observerEntity.sonarRadius.toFixed(0);
                let dr = this.observerEntity.devisionRatio.toFixed(2);
                let mmfd = this.observerEntity.minMassForDiv.toFixed(1);
                let age = ((this.tick - this.observerEntity.birthtick) / 1000).toFixed(2);

                $("#entity-info").html(`ID: <b>${this.observerEntity.id}</b> Возраст: <b>${age} кТик</b> Масса: <b>${m}</b> Скорость: <b>${s}</b> Радиус обзора: <b>${r}</b> Процент деления: <b>${dr}</b>  Минимальная масса для деления: <b>${mmfd}</b> `);
            } else {
                $("#entity-info").html("");
            }
            $("#entitys-count").html(this.EntitysCount);
            $("#fps").html(this.fps);
        }

        this.tick++;

    }

    render() {
        if (this.tick % 50 == 0) {
            var t0 = performance.now();
        }

        let l = $(".wrapper").scrollLeft();
        let t = $(".wrapper").scrollTop();


        // let w = $(".wrapper").width()  + (this.width * (1 / this.worldScale) - this.width) / 2;
        let w = $(".wrapper").width();
        let h = $(".wrapper").height(); // + (this.height * (1 / this.worldScale) - this.height) / 2

        let objects = this.EatStage.children.concat(this.EntityStage.children);
        objects.forEach(ch => {

            let r = (ch._areaRadius) ? ch._areaRadius : 0;
            let c1 = ch.x >= l - r && ch.y >= t - r;
            let c2 = ch.x <= l + w + r && ch.y <= t + h + r;
            if (c1 && c2) {
                if (ch.hideByArea) {
                    ch.visible = true;
                    ch.hideByArea = false;
                }
            } else {
                ch.hideByArea = true;
                ch.visible = false;
            }

        });

        this.worldStage.update();

        if (this.tick % 50 == 0) {
            var t1 = performance.now();
        }
        if (this.tick % 50 == 0)
            console.log('[Render] Render:', (t1 - t0).toFixed(4), ' ms');

    }

    start() {
        this.worldInterval = setInterval(() => {
            this.run();

        }, this.worldUpdateTimer);

        $("#btn-simulation-toggler").html("Пауза");
        console.log("Симуляция запущена!");
    }
    stop() {

        clearInterval(this.worldInterval);
        this.worldInterval = -1;


        this.Entitys.forEach(Entity => {
            Entity.body.hideByArea = false;
            Entity.Draw();
        });

        $("#btn-simulation-toggler").html("Продолжить");
        console.log("Симуляция остановлена!");

    }
    // добавить еду.
    addEat(x = -1, y = -1, m = -1, c = -1) {
        if (m != -1 && m < 2) {
            return;
        }
        let count = (c != -1) ? c : this.eatCountPearTick;

        for (let i = 0; i < count; i++) {

            if (this.EatsCount >= this.width * this.height / 4500) {
                return;
            }

            this.Eats.push(new Eat(this, m, x, y));
            this.EatsCount++;
        }

    }

    spawnEntityByParent(parent) {
        let genes = Object.assign({}, parent.genes);

        let brain = new AI(this, parent.brain, {mutation: true, chance: 0.01, rate: .1});

        let newMass = parent.mass * parent.devisionRatio;

        genes.speed += genes.speed / (100 / this.radiation) * (0.5 - Math.random());
        genes.sonarRadius += genes.sonarRadius / (100 / this.radiation) * (0.5 - Math.random());
        genes.minMassForDiv += genes.minMassForDiv / (100 / this.radiation) * (0.5 - Math.random());

        genes.devisionRatio += genes.devisionRatio / (100 / this.radiation) * (0.5 - Math.random());
        genes.devisionRatio = Math.max(0.14, Math.min(0.82, genes.devisionRatio));


        genes.population = (this.transPopulationChance > Math.random()) ? this.populations[Math.floor(this.populations.length * Math.random())] : parent.population;


        if (newMass >= 10) {

            parent.mass -= newMass;

            let x = parent.positionX + (parent.mass + newMass) * Math.cos(parent.seed * this.tick * Math.PI / 180);
            let y = parent.positionY + (parent.mass + newMass) * Math.sin(parent.seed * this.tick * Math.PI / 180);

            if (x > this.width) {
                x = parent.positionX - (parent.mass + newMass) * Math.cos(parent.seed * this.tick * Math.PI / 180);
            }
            if (y > this.height) {
                y = parent.positionY - (parent.mass + newMass) * Math.sin(parent.seed * this.tick * Math.PI / 180);
            }
            this.spawnEntity(newMass, brain, genes, x, y, parent);
        } else {
            console.log("Чилдрен погиб при родах, ибо родитель пожадничал массы ему. Родитель теряет 0.2 от своей массы (типо потеря крови)", newMass >= 10);

            parent.mass *= 0.8;
        }

    }

    spawnEntity(newMass, brain, genes, x, y, parent = null) {
        let entity = {};

        switch (genes.population) {
            case "peaceful":
                entity = new Peaceful(this, newMass, brain, genes, x, y, parent);
                break;
            case "predator":
                entity = new Predator(this, newMass, brain, genes, x, y, parent);
                break;
            default:
                console.error("Неизвестная популяция!");
                console.error(genes.population);
                return;
        }
        this.Entitys.push(entity);
        this.EntitysCount++;
        // if(this.EntitysCount > 500){
        //     // alert(this.fps);
        //     console.error(ping);
        //     this.stop();
        // }
    }

    setObservedEntity(entity) {
        this.observerEntity = entity;
    }

    removeEntity(entity, addEat = 1) {
        
        if (!this.Entitys[entity.id]) {
            console.error("ok", entity.id, entity);
            return;
        }

        if (this.observerEntity == entity) {
            this.observerEntity = null;
        }
        if (addEat) {
            this.addEat(entity.positionX, entity.positionY, entity.mass, 1);
        }
        entity.remove();

        this.EntitysCount--;

        if(this.EntitysCount <= 0){
            let brain = new AI(this, highestNetowrk.network, {mutation: true, chance: 0.3, rate: .3});
            this.spawnEntity(40, brain, this.startEntityGenus, this.width / 10, this.height / 10);
        }
    }

    requestAnimFrame() {

        if (!this.lastCalledTime) {
            this.lastCalledTime = Date.now();
            let fps = 0;
            return 0;
        }
        let delta = (Date.now() - this.lastCalledTime) / 1000;
        this.lastCalledTime = Date.now();

        let fps = 1 / delta * 50;

        // if(fps <= 30){
        //     let averageMass = 0;
        //     this.Entitys.forEach(entity => {
        //         averageMass =  Math.round((averageMass + entity.mass) / 2, 2);
        //     });
        //     alert("Entity count: "+this.EntitysCount+" mass: "+ averageMass+" k: "+(this.EntitysCount/averageMass).toFixed(2)+" fps:" +fps);
        // }
        return fps;
    }



    getRandomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }



    getRadByCoordinates(x, y) {
        if (x == 0) {
            return Math.PI / 2;
        }
        let rad = Math.atan(y / x);

        if (x < 0) {
            rad += Math.PI;
        }
        if (rad < 0) {
            rad = Math.PI * 2 + rad;
        }
        return rad * 180 / Math.PI;
    }

    scaleWorld(delta, focusX = -1, focusY = -1) {
        let oldScale = this.worldScale;
        this.worldScale = Math.max(0.35, Math.min(1.25, this.worldScale + delta));

        // $("#world-area").css("transform", `scale(${this.worldScale})`);
        // this.worldStage.scale = this.worldScale;
        this.canvas.setZoom(this.worldScale);
        let l = $(".wrapper").scrollLeft() - ($(".wrapper").width() * (1 / this.worldScale) - $(".wrapper").width() * (1 / oldScale)) / 2;
        let t = $(".wrapper").scrollTop() - ($(".wrapper").height() * (1 / this.worldScale) - $(".wrapper").height() * (1 / oldScale)) / 2;

        // $(".wrapper").scrollLeft(l).scrollTop(t);

        let block = $("<span>x" + this.worldScale.toFixed(2) + "</span>");

        $(".scale-bar").html(block);
        $(block).fadeOut(1500);

    };

    initGreed(sectros = [], greed = false) {
        this.statickStage.removeAllChildren();
        let g = new createjs.Graphics();
        for (let x = 0; x < this.width; x += 50) {

            g.setStrokeStyle(1);
            g.beginStroke("#cc7d39");

            g.moveTo(x, 0).lineTo(x, this.height);

        }

        for (let y = 0; y < this.height; y += 50) {
            g.setStrokeStyle(1);
            g.beginStroke("#cc7d39");

            g.moveTo(0, y).lineTo(this.width, y);

        }

        g.endStroke();

        this.Sectors.sectors.forEach(sector => {
            let g = new createjs.Graphics();
            if (sectros[sector.id] !== undefined) {
                g.beginFill("#ff3333");
            } else {
                g.beginFill("#cccc77");
            }

            g.beginStroke("#000");

            let rect = new createjs.Shape();
            g.rect(0, 0, sector.width, sector.height);

            rect.set({
                graphics: g,
                x: sector.offsetX,
                y: sector.offsetY,
                alpha: 0.5
            });

            let text = new createjs.Text(sector.id, "12px Arial", "#ff7700");
            text.x = sector.offsetX + sector.width / 2 - 12;
            text.y = sector.offsetY + sector.height / 2 + 12;
            text.textBaseline = "alphabetic";
            if(greed){
                this.statickStage.addChild(rect);
                this.statickStage.addChild(text);
            }

        });

        this.statickStage.addChild(new createjs.Shape()).set({
            graphics: g,
            x: 0,
            y: 0,
            alpha: 0.5
        });

        this.statickStage.update();
    }
    __debug_Show_Entity_Greed(){
        let sectors = {}
        this.Entitys.forEach(entity => {
            sectors = Object.assign(sectors, this.Sectors.getSectorsByRadius(entity.positionX, entity.positionY, entity.mass + entity.sonarRadius));
        });
        this.initGreed(sectors,true);
    }

};


function getObjectTypeId(name) {
    if (name instanceof Object) {

        if (name instanceof Eat) {
            return 0;
        }

        return POPULATIONS[name.population].id;

    } else {
        switch (name) {
            case "eat":
                return 0;
                break;
            case "peaceful":
                return 1;
                break;
            case "predator":
                return 2;
                break;

            default:

                return parseInt(name);
        }
    }

}

function distance(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;

    return Math.sqrt(dx * dx + dy * dy);
}

function getPriority(type, angle, distance, mass) {
    let priority = 0;
    if (type == 0) {
        priority = 0.5 + 1 / (Math.E ** (0.01 * distance) + 1); // https://www.desmos.com/calculator/rcrxxwvfkl
    }
    if (type == 1) {
        priority = 0.25 + 1 / (Math.E ** (0.01 * distance) + 1);
    }
    if (type == 2) {
        priority = 0.5 + 1 / (Math.E ** (0.01 * distance) + 1);
    }
    return priority;
}

/** Get the angle from one point to another */
function angleToPoint(x1, y1, x2, y2) {

    d = distance(x1, y1, x2, y2);
    if (d == 0) {
        return 0;
    }
    dx = (x2 - x1) / d;
    dy = (y2 - y1) / d;

    a = Math.acos(dx);
    a = dy < 0 ? 2 * Math.PI - a : a;
    if (isNaN(a)) {
        console.error("Фатальный облом обнаружен!", dx, dy, x1, y1, x2, y2);
    }
    return a;
}

function getDifferenceForMass(mass, mass2) { // от 0 до 1, 0.5 - если они одинаковы, меньше если первый меньше второго, больше если больше.
    let m = mass / mass2 / 2;
    if (m > 1) {
        m = 1 - 1 / m;
    }
    return m;
}

var stop = false;
var world = {};


window.onload = function () {
    world = new World();
}