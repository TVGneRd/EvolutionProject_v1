class Sectors {
    sectors = [];

    sectorHeight = 0;
    sectorWidth = 0;
    worldHeight = 0;
    worldWidth = 0;
    columns = 0;
    rows = 0;
    
    constructor(worldHeight, worldWidth, sectorHeight, sectorWidth) {
        this.worldHeight = worldHeight;
        this.worldWidth = worldWidth;
        this.sectorHeight = sectorHeight;
        this.sectorWidth = sectorWidth;
        let i = 0;
        // console.log("[Sectrors] Sectors map: ");
        for (let y = 0; y < worldHeight; y += sectorHeight) {

            let line = [];
        
            this.columns = 0;
            for (let x = 0; x < worldWidth; x += sectorWidth) {
                this.sectors.push(new Sector(this.sectors.length, sectorWidth, sectorHeight, y, x));
                this.columns++;

                line.push(i);
                i++;
            }
            // console.log(line);
            this.rows++;
        }

    }

    changeSector(object, x, y) {

        let id = (x > 0 || y > 0) ? this.getIdByCoordinats(x, y) : -1;

        if (object.mySector) {
            if (object.mySector.id == id) {
                return;
            }
            delete this.sectors[object.mySector.id].objects[object.mySector.num];
        }

        if (this.isSector(id)) {
            object.mySector = {
                id: id,
                num: this.sectors[id].objects.length
            };

            this.sectors[id].objects.push(object);
        }
    }

    getSectorsByRadius(x1, y1, radius) {

        let sectros = this.getSectorsByRect(x1 - radius,  y1 - radius, x1 + radius, y1 + radius);
        let res = {};

        sectros.forEach(id => {

            let x = (this.sectors[id].offsetX > x1) ? this.sectors[id].offsetX : this.sectors[id].offsetX + this.sectorWidth;
            let y = (this.sectors[id].offsetY > y1) ? this.sectors[id].offsetY : this.sectors[id].offsetY + this.sectorHeight;
            
            let d = distance(0, 0, x - x1, y - y1);

            if (d <= radius) {              
                res[id] = d;
            }

        });
       
        return res;
    }

    getSectorsByRect(x1, y1, x2, y2) {
        let res = [];

        x1 = Math.max(0, x1 - x1 % this.sectorWidth); // доходим до начала ближайшего блока
        y1 = Math.max(0, y1 - y1 % this.sectorHeight); // доходим до начала ближайшего блока
        x2 = Math.min(this.worldWidth , x2); 
        y2 = Math.min(this.worldHeight , y2);

        for (let y = y1; y <= y2; y+= this.sectorHeight) {
            for (let x = x1; x <= x2; x+= this.sectorWidth) {
                let newId = this.getIdByCoordinats(x, y); // координаты в номер мектора
                if(this.isSector(newId)){ // проверка существует ли такой сектор
                    res.push(newId);
                }            
            }
        }
      
        return res;
    }

    getIdByCoordinats(x,y){
        let xId = ~~(x / this.sectorWidth); // тоже самое что и Math.floor ток чуточку быстрее
        let yId = ~~(y / this.sectorHeight); // тоже самое что и Math.floor ток чуточку быстрее

        let id = yId * this.columns + xId;
        return id;
    }

    getSurroundingSectors(id) {
        let pos = this.idToNum(id);
        let res = [];

        [
            [-1, -1],
            [0, -1],
            [1, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
            [1, 1]
        ].forEach(newPos => {
            let newId = this.numToId(pos.x + newPos[0], pos.y + newPos[1]);
            if (this.isSector(newId)) {
                res.push(newId);
            }
        });
        return res;
    }

    idToNum(id) {
        let h = Math.ceil(this.worldHeight / this.sectorHeight);
        let w = Math.ceil(this.worldWidth / this.sectorWidth);

        let y = Math.floor(id / h);
        let x = id % w;
        return {
            x: x,
            y: y
        }
    }

    numToId(x, y) {

        if (y < 0 || y >= this.worldHeight || x < 0 || x >= this.worldWidth) {
            return [-1, -1];
        }

        return y * this.columns + x;
    }

    isSector(id) {
        if (id >= 0 && id < this.sectors.length) {
            return true;
        }
        return false;
    }
}
class Sector {
    id = 0;
    width = 300;
    height = 300;
    offsetX = 0;
    offsetY = 0;

    objects = [];

    constructor(id, width, height, top, left) {
        this.id = id;
        this.width = width;
        this.height = height;
        this.offsetY = top;
        this.offsetX = left;
    }


}