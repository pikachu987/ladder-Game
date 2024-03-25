class Item {
    constructor(text) {
        this.text = text;
        this.fontSize = '';
        this.textSize = new Size(0, 0);
        this.frame = new Rect(0, 0, 0, 0);
        this.multilines = [];
        this.destinationIndex = undefined;
        this.color = undefined;
        this.animationType = undefined;
    }

    reduceMultilineHeight() {
        return this.multilines.map(function(item) {
            return item.size.height;
        }).reduce(function (acc, cur, idx) {
            return acc + cur;
        });
    }

    reduceMultilineHeightWidthSpacing() {
        let spacing = (this.multilines.length - 1) * Config.text.lineSpacing;
        return this.multilines.map(function(item) {
            return item.size.height;
        }).reduce(function (acc, cur, idx) {
            return acc + cur;
        }) + spacing;
    }

    longerMultilineWidth() {
        return this.multilines.map(function(multiline) { 
            return multiline.size.width;
         }).sort(Utils.numberSortFn)[this.multilines.length - 1];
    }
}

class User extends Item {
    
}

class Product extends Item {
    
}