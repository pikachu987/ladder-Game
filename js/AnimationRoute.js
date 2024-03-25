const AnimationRoute = Object.freeze({
    click: {
        prefix: function() {
            return 'click';
        },
        combineAnimationID: function(id) {
            return `${this.prefix()}_${id}`;
        },
        removePrefix: function(id) {
            return id.replace(`${this.prefix()}_`, '');
        }
    },
    move: {
        prefix: function() {
            return 'move';
        },
        combineAnimationID: function(id) {
            return `${this.prefix()}_${id}`;
        },
        removePrefix: function(id) {
            return id.replace(`${this.prefix()}_`, '');
        }
    },
    interaction: {
        prefix: function() {
            return 'interaction';
        },
        combineAnimationID: function(id) {
            return `${this.prefix()}_${id}`;
        },
        removePrefix: function(id) {
            return id.replace(`${this.prefix()}_`, '');
        }
    },
});