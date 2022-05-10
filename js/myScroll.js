
    // пишем функцию с именем нашего плагина
    $.fn.touchanddrag = function(callBack1 = null, callBack2 = null){
        var scr = $(this);
        scr.mousedown(function () {

            let startY = $(this).scrollTop();
            let startX = $(this).scrollLeft();
            let cY = event.pageY;
            let cX = event.pageX;

            console.log(startY, startX);
            
            scr.mousemove(function () {
                $("body").css({cursor:'pointer'});

                if(callBack1){
                    callBack1();
                }

                $(this).scrollTop(startY + cY - event.pageY);
                $(this).scrollLeft(startX + cX - event.pageX);
               
                return false;
            });
        });
        $(window).mouseup(function () {
            scr.off("mousemove"); 
            $("body").css({cursor:'default'});
            if(callBack2){
                callBack2();
            }
        });
        
        return this;
    };