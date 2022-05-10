class Entity {

    genes = {};

    population = "peaceful";
    mass = 20;
    speed = 1;
    devisionRatio = 0.5; // сколько процентов массы отдается ребенку 
    sonarRadius = 70;
    minMassForDiv = 50;
    positionX = 0;
    positionY = 0;
    seed = 0;
    color = [150, 150, 150];
    parent = null;

    birthtick = 0;
    step = 2;
    rollbackTime = 0; // время на востановление после родов
    isHover = false;
    lastCallTick = 0;
    internalObjects = [];

    constructor(world, mass, brain, genes, x, y, parent) {
        this.id = world.Entitys.length;

        this.genes = genes;
        this.brain = brain;
        this.birthtick = world.tick;
        this.mass = mass;
        this.speed = this.genes.speed;
        this.devisionRatio = this.genes.devisionRatio;
        this.sonarRadius = this.genes.sonarRadius;
        this.population = this.genes.population;
        this.minMassForDiv = this.genes.minMassForDiv;
        this.seed = Math.random();
        this.parent = parent;

        this.color = [~~(this.color[0] * this.devisionRatio / world.startEntityGenus.devisionRatio), ~~(this.color[1] * this.sonarRadius / world.startEntityGenus.sonarRadius), ~~(this.color[2] * this.speed / world.startEntityGenus.speed)];

        this.positionX = x;
        this.positionY = y;

        this.world = world;

        this.body = new createjs.Shape();

        this.Draw();

        this.body.addEventListener("click", () => {
            this.world.setObservedEntity(this);
            $("#btn-observer-off").removeClass("d-none");
        });

        this.body.on("mouseover", () => {
            this.isHover = true;
            if(this.world.worldInterval == -1){
                this.Draw();
                this.world.render();
            }
        });
        this.body.on("mouseout", () => {
            this.isHover = false;

            if(this.world.worldInterval == -1){
                this.Draw();
                this.world.render();
            }
        });
        this.world.EntityStage.addChild(this.body);

    }

    async Walk() {
        if (this.lastCallTick == this.world.tick) {
            return;
        }

        this.lastCallTick = this.world.tick;

        // t0 = performance.now();

        this.wasteOfEnergy();

        // смерть от недожера
        if (this.mass < this.world.eatMass) {
            // console.log(`Бобик ${this.id} здох от недожера.`);
            this.world.removeEntity(this);
            return;
        }
        // смерть от стапрости
        if ((this.world.tick - this.birthtick) / 1000 > this.world.maxLifeTime) {
            // console.log(`Бобик ${this.id} здох от старости.`);
            this.world.removeEntity(this);
            return;
        }

        // размножение
        if (this.mass >= this.minMassForDiv) {
            if (this.rollbackTime > 0) {
                this.rollbackTime--;
            } else {
                this.world.spawnEntityByParent(this);

                this.brain.score += 10;

                this.rollbackTime = 10; // 0.1 секунды. 
            }
        }
        // t1 = performance.now();
        // ping[0] += (t1 - t0).toFixed(4) - 0;

        let target = this.getAngleToTarget(); //this.getTarget(radius);

        let angle = target.angle;

        let stepX = 2 * this.speed * Math.cos(angle) * (4 / Math.pow(this.mass + 5, 0.3)); // Mass graphic: https://www.desmos.com/calculator/qdgcq4rtl5
        let stepY = 2 * this.speed * Math.sin(angle) * (4 / Math.pow(this.mass + 5, 0.3)); // Mass graphic: https://www.desmos.com/calculator/qdgcq4rtl5

        this.positionY = Math.max(0, Math.min(this.world.height - this.mass, this.positionY + stepY));
        this.positionX = Math.max(0, Math.min(this.world.width - this.mass, this.positionX + stepX));

        // границы мира убивают!
        if (this.positionX >= this.world.width - this.mass - 1 || this.positionX <= this.mass + 1) {
            this.mass -= 1;
            this.brain.score -= 2;
        }
        if (this.positionY >= this.world.height - this.mass - 1 || this.positionY <= this.mass + 1) {
            this.mass -= 1;
            this.brain.score -= 2;
        }

        this.world.Sectors.changeSector(this, this.positionX, this.positionY);

        if (this.internalObjects.length != 0) {
            this.Eat();
        }

        this.Draw(target, angle);


    }

    Draw(target = null, angle = null) {

        this.body._areaRadius = this.mass * 2; //  + this.sonarRadius

        if (this.body.hideByArea) {
            return;
        }

        this.body.graphics.clear();
        if (this.mass <= 0) {
            console.error("Zero mass");
            return;
        }
        this.body.graphics.setStrokeStyle(1).beginStroke("rgba(0, 0, 0, .4)").beginFill(`rgb(${this.color[0]},${this.color[1]},${this.color[2]})`).drawCircle(0, 0, this.mass);
        this.body.graphics.endStroke();

        if (angle !== null) {
            this.body.graphics.setStrokeStyle(2).beginStroke("#00e8ff").moveTo(0, 0).lineTo(this.mass * Math.cos(angle), this.mass * Math.sin(angle));
            // вектор скорости
        }

        this.body.graphics.endStroke();



        if (this.isHover) {
            this.body.graphics.setStrokeStyle(2).beginStroke("rgb(255, 0, 0)").beginFill("transparent").drawCircle(0, 0, this.mass + this.sonarRadius); // область обзора
            this.body.graphics.endStroke();

            if (target && target.object) {
                this.body.graphics.setStrokeStyle(2).beginStroke("rgb(255, 0, 0)").moveTo(0, 0).lineTo(target.object.positionX - this.positionX, target.object.positionY - this.positionY); // линия цели
                this.body.graphics.endStroke();
            }
        }

        this.body.x = this.positionX;
        this.body.y = this.positionY;

    }

    Eat() {
        this.internalObjects.forEach(obj => {

            if (obj instanceof Eat) {
                this.mass += obj.mass;
                obj.remove();
                this.brain.score++;
            }

        });
    }

    getAngleToTarget() {
        let radius = this.mass + this.sonarRadius;

        let objects = this.getObjectsInRadius(radius);
        let rand = this.brain.activate([0, 1, 1, 1, Math.abs(Math.sin(this.world.tick + 10 * this.seed))]);

        let target = {
            object: null,
            angle: rand[0] * (Math.PI * 2),
            priority: -1
        };

        // console.log("==================");
        // console.log(objects);
        for (let item of objects) {

            let obj = item[0];
            let distance = item[1];

            let a = angleToPoint(0, 0, obj.positionX - this.positionX, obj.positionY - this.positionY);
            let t = getObjectTypeId(obj);
            let m = getDifferenceForMass(this.mass, obj.mass);
            let res = this.brain.activate([t, a / (Math.PI * 2), 1 / (distance - this.mass), m, Math.abs(Math.sin(this.world.tick + 10 * this.seed))]);
            // if(this.world.worldUpdateTimer == 100){
            //     console.log(obj, res[0], res[1] * (Math.PI * 2) / Math.PI * 180);
            // }
            if (res[0] > target.priority) {
                // console.log(res[0], obj);
                target.priority = res[0];
                target.angle = res[1] * (Math.PI * 2); // берем не из переменной "а" потому что ИИ может решить не идти к цели а наоборот уходить от нее.
                target.object = obj;

            }
        }
        return target;
    }

    getTarget(radius) {
        // let t0 = performance.now();
        let objects = this.getObjectsInRadius(radius);

        // let t1 = performance.now();
        // ping[0] += (t1 - t0).toFixed(4) - 0;

        let result = {
            Entity: {
                distance: Infinity,
                angle: -Math.PI * 2,
                object: null,
                mobType: -1,

            },
            Eat: {
                distance: Infinity,
                angle: -Math.PI * 2,
                object: null,
                mobType: -1

            }
        };
       
        for (let item of objects) {

            let obj = item[0];
            let d = item[1];



            if (obj instanceof Entity) { // животное 

                if (d < result.Entity.distance) {
                    result.Entity.object = obj;
                    result.Entity.distance = d;
                    result.Entity.angle = angleToPoint(this.positionX, this.positionY, obj.positionX, obj.positionY);
                    result.Entity.mobType = getObjectTypeId(obj.population);
                }

            } else { // еда


                if (d < result.Eat.distance) {

                    result.Eat.object = obj;
                    result.Eat.distance = d;

                    result.Eat.angle = angleToPoint(this.positionX, this.positionY, obj.positionX, obj.positionY);
                    result.Eat.mobType = 0;
                }

            }
        }

        return result;
    }

    wasteOfEnergy() {
        if (this.mass < 0) {
            return;
        }
        
        this.mass -= 0.02 * Math.pow(this.speed, 2) * ((this.sonarRadius / 75 > 1) ? this.sonarRadius / 75 : 1) * (Math.pow(this.mass + 11, 1.1) / 40); // График: https://www.desmos.com/calculator/qdgcq4rtl5 
        let m = 1;

    }

    getDisanceTo(x, y) {
        return distance(0, 0, this.positionX - x, this.positionY - y);
    }

    getRadByCoordinates(x, y) {
        if (x == 0) {
            return Math.PI / 2;
        }
        let rad = Math.atan(y / x);

        if (x < 0) {
            rad += Math.PI;
        }
        return rad;
    }

    getObjectsInRadius(radius, noLimits = false) {
        let sectors = this.world.Sectors.getSectorsByRadius(this.positionX, this.positionY, radius);

        let max = 1;
        let i = 0;

        this.internalObjects = []; // отчищаем список объектов находящихся внутри нашего

        let c = 0; // #

        let objcts = [];
        let distns = [];

        distns[max] = Infinity;

        for(var sector in sectors) { 
            let distanceTo = sectors[sector]; 
       
            // if (!noLimits && i >= max) {
            //     return;
            // }
            
            if(distanceTo > distns[max]){
               continue;
            }

            this.world.Sectors.sectors[sector].objects.forEach(item => {


                let dist = distance(0, 0, item.positionX - this.positionX, item.positionY - this.positionY);

                ping[0]++; // #
                c++; // #

                // *#
                if(ping[3] < c){
                    ping[3] = c;
                    ping[4] = this.id;
                } // *#

                if (dist < this.mass) {
                    this.internalObjects.push(item);
                    return;
                }
                
                if ((radius + item.positionX - this.positionX >= 0) &&
                    this !== item &&
                    (radius + item.positionY - this.positionY >= 0) &&
                    dist <= radius && (!objcts[max] || distns[max] < dist)
                ) {
                    
                    for(let j = 0; j <= max; j++){
                        ping[1]++; // #
                        if(!distns[j] || dist < distns[j]){
                            distns[j] = dist;
                            objcts[j] = item;
                            
                            break;
                        }
                    }
                    // objects.set(item, dist);
                    i++;
                } 

            });


        };

        let objects = new Map();

        for(let i = 0; i<=max; i++){
            if(objcts[i]){
                objects.set(objcts[i], distns[i]);
            }
        }

        return objects;
    }

    remove() {
        if (this.world.removed[this.id]) {
            console.error("Popalsya bug ebaniy", this);
            this.world.stop();
        }
        this.world.removed[this.id] = 1;
        // console.warn("romoved", this.id, this);

        this.world.EntityStage.removeChild(this.body);
        this.mass = 0;
        this.world.Sectors.changeSector(this, -1, -1);
        delete this.world.Entitys[this.id];

    }



};


class Peaceful extends Entity {

};

class Predator extends Entity {
    fullPredator = false;

    criticalMass = 20; // масса после которой хищник становится всеядным

    constructor(world, mass, brain, genes, x, y, parent) {
        super(world, mass, brain, genes, x, y, parent);

        if (parent) {
            this.fullPredator = parent.fullPredator;
        }
    }

    Draw(target = null, angle = null) {
        if (this.body.hideByArea) {
            return;
        }

        super.Draw(target, angle);

        for (let a = 120; a <= 360; a += 120) {
            this.body.graphics.setStrokeStyle(2).beginStroke("rgb(255, 0, 0)").moveTo(0, 0).lineTo(Math.sin(a / 180 * Math.PI) * this.mass, Math.cos(a / 180 * Math.PI) * this.mass);
        }

        this.body.graphics.endStroke();

    }

    Eat() {

        this.internalObjects.forEach(obj => {

            if (obj instanceof Entity && obj != this.parent && obj.parent != this) {

                // if (obj.population == this.world.populations[0] && this.mass / obj.mass > 1.4) {
                //     // console.log(`Бобик ${obj.id} здох от того что его СОЖРАЛ барбос ${this.id}!`);

                //     this.mass += obj.mass;
                //     // console.log(`Бобик ${obj.id} здох от того что его СОЖРАЛ барбос ${this.id}!`);

                //     this.world.removeEntity(obj, 0);
                //     this.brain.score += 40;

                //     this.fullPredator = true;

                // } else if (obj.population == this.world.populations[1] && this.mass / obj.mass > 1) {
                //     let m = obj.mass * this.mass / obj.mass / 10;
                //     obj.mass -= m;
                //     this.mass += m * .35;

                //     if (Math.random() < 0.4) {
                //         this.world.addEat(this.positionX, this.positionY, m * .5, 1);
                //     }

                //     if (obj.mass <= 0) {
                //         this.world.removeEntity(obj, 0);
                //         this.brain.score += 30;
                //     }
                // }

                if (obj.population == this.world.populations[1] && this.mass / obj.mass < 1) {
                    return;
                }

                let m = obj.mass * this.mass / Math.max(1, obj.mass) / 100; // max для защиты от деления на 0!
                obj.mass -= m;
                this.mass += m;

                this.brain.score += .5;  

                if (obj.mass <= 0) {
                    this.world.removeEntity(obj, 0);
                    this.brain.score += 30;
                    this.fullPredator = true;
                }

            } else if (obj instanceof Eat && this.mass < this.criticalMass && !this.fullPredator) {

                this.mass += obj.mass;
                obj.remove();

            }


        });

    }


};