class Eat {

    positionX = 0;
    positionY = 0;
    mass = 7.5;

    constructor(world, mass, x, y) {
        this.world = world;

        this.id = this.world.Eats.lenght; // TODO исправить баг с ИД (не у всех он есть)

        this.color = [255 * Math.random(),255 * Math.random(),255 * Math.random() ];

        this.positionX = x;
        this.positionY = y;

        mass = (( this.mass != -1) ?  this.mass : this.world.eatMass);
        this.body = new createjs.Shape();

        this.body.graphics.beginFill(`rgb(${this.color[0]},${this.color[1]},${this.color[2]})`).drawCircle(0, 0, mass);
        this.mass = mass;
        
        this.body.x = this.positionX = (x != -1) ? x : this.world.width * Math.random();
        this.body.y = this.positionY = (y != -1) ? y : this.world.height * Math.random();

        this.world.Sectors.changeSector(this, this.positionX, this.positionY);

        this.world.EatStage.addChild(this.body);
        
    }

    remove(){
        this.world.EatStage.removeChild(this.body);
        this.mass = 0;
        this.world.Sectors.changeSector(this, -1, -1);
        this.world.EatsCount--;
        delete this.world.Eats[this.id];

    }

};