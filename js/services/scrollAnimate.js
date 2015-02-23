myApp.factory('myScrollAnimate', function(){
    return {
        animate: function(el, parent, offset){
            el = this.el(el);
            if(!el) return;

            parent = this.el(parent);
            offset = offset || 0;
            this.initialValue = parent.scrollTop;
            this.start = Date.now();
            this.target = parent.scrollTop + el.getBoundingClientRect().top - offset;

            this.tick(el, parent, offset);
        },
        top: function(el){
            this.el(el).scrollTop = 0;
        },
        el: function(id){
            return document.querySelector(id);
        },
        initialValue: null,
        start: null,
        progress: function(){
            var val = (Date.now() - this.start) / 6000;
            return val > 1 ? 1 : val;
        },
        validDuration: function(){
            return (Date.now()-this.start) / 1000 < 1;
        },
        tick: function(el, parent, offset){
            var scroll = parent.scrollTop,
                step, progress, target;

            if(this.target - scroll > 1 && this.validDuration()){
                progress = this.progress();
                step = (progress * (this.target - this.initialValue));
                target = parent.scrollTop + step;
                if(target > this.target) target = this.target;
                parent.scrollTop = target;

                requestAnimationFrame(this.tick.bind(this, el, parent, offset));
            }
        }
    }
});