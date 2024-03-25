class Utils {
    static random(min, max) {
        return (Math.random() * (max - min) + min).toFixed(3);
    }

    static roundRandom(min, max) {
        return Math.round((Math.random() * (max - min) + min).toFixed(3));
    }

    static getSize(text, fontSize) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = fontSize;
        let metrics = context.measureText(text);
        let width = metrics.width;
        let fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
        let actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        return new Size(width, fontHeight - 4);
    }

    static shuffle(array) {
        let currentIndex = array.length;
        let randomIndex;
        while (currentIndex > 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }
    
    static numberSortFn = (a, b) => {
        if (a < b) {
            return -1;
        } else if (a === b) {
            return 0;
        } else {
            return 1;
        }
    }
}