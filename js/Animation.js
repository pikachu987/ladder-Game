class Animation {
    #animtionIDs = [];

    resetAnimation(animationRoute) {
        this.clearAnimation(animationRoute);
        this.#animtionIDs = [];
    }

    clearAnimation(animationRoute) {
        let prefix = '';
        if (animationRoute != undefined) {
            prefix = animationRoute.prefix()
        }
        for (var i=0;i<this.#animtionIDs.length;i++) {
            let animtionID = this.#animtionIDs[i];
            if (animtionID.startsWith(prefix)) {
                Object.values(AnimationRoute).forEach(function(value) {
                    animtionID = value.removePrefix(animtionID);
                });
                clearTimeout(animtionID);
            }
        }
    }

    animationRecursion(animationRoute, repeatCount, delay, callback) {
        let task = function(i) {
            if (i == repeatCount) {
                callback(-1);
                return;
            }
            let animtionID = setTimeout(function() {
                callback(i);
                task(i + 1);
            }, delay * 1000);
            this.#animtionIDs.push(animationRoute.combineAnimationID(animtionID));
        }.bind(this);
        task(0);
    }
}