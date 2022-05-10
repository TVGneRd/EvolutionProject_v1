class SavesManager {
    
    selectedBlock = -1;

    constructor(world) {
        this.world = world;
        

        $("#btn-save-world").on("click", () => {
            if(this.selectedBlock == -1){
                alert("Выберите блок в который хотите сохранить!");
                return;
            }
            let name = $("#world-name-input").val();
            name = (!name) ? "Сохранение №"+(this.selectedBlock+1) : name;

            this.saveWorld(this.selectedBlock, name);
        });

        $('#savesModal').on('show.bs.modal', (e) => {
           this.updateSavesBlocks();
        });
    }
    updateSavesBlocks(){
        $("#saves-container > .save-block").not("#null-block").remove();
        let saves = $.cookie('saves');

        saves = (!saves) ? [] : JSON.parse(saves); 
        console.log(saves);
        for (let i = 0; i < 9; i++) {
            let block = $("#saves-container #null-block").clone();  
            block.removeClass("d-none").attr('id',`save-${i}`).attr('data-save-num',i);     

            if(saves[i]){ 
                block.find(".card").removeClass("bg-secondary").addClass('bg-primary')
                block.find(".card-header").html(saves[i].date);
                block.find(".card-title").html(saves[i].name);
                let worldTime = (saves[i].worldData.tick / 1000).toFixed(2)
                block.find(".card-text").html(`Время мира: ${worldTime} кТик <br> Количество особей: ${saves[i].worldData.EntitysCount}  <br> Размер мира: ${saves[i].worldData.size[0]}x${saves[i].worldData.size[1]}`);

            }

            $("#saves-container").append(block);

            block.on("click", (el) => {    

                $(`#save-${this.selectedBlock}`).find(".card").removeClass("bg-success").not(".bg-primary").addClass("bg-secondary");
                
                this.selectedBlock = i;
                $(`#save-${i}`).find(".card").removeClass("bg-secondary").addClass("bg-success");
            }); 
        }
    }

    saveWorld(id, name){
        let save = {
            name: name,
            date: (new Date()).toLocaleString('ru-RU'),

            worldData: {
                Eats: [], // TODO Доделать
                Entitys: [], // TODO Доделать
                EntitysCount: this.world.EntitysCount,
                tick: this.world.tick,
                radiation: this.world.radiation,
                size: [this.world.height, this.world.width],
                maxLifeTime: this.world.maxLifeTime,
                transPopulationChance: this.world.transPopulationChance
            }
        };
        let saves = $.cookie('saves');
        saves = (!saves) ? [] : JSON.parse(saves); 

        saves[id] = save;

        saves = JSON.stringify(saves);

        $.cookie('saves', saves, { expires: 60 });

        this.updateSavesBlocks();
    }
}