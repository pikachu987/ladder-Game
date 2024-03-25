class Game {
    #canvas;
    #users = [];
    #products = [];
    #lines = [];
    #connectLines = [];
    #height = 0;
    isStart = false;

    constructor(canvasParentId) {
        this.#canvas = new Canvas(canvasParentId);

        this.#canvas.setDelegate({
            users: function() {
                return this.#users;
            }.bind(this),
            products: function() {
                return this.#products;
            }.bind(this),
            lines: function() {
                return this.#lines;
            }.bind(this),
            connectLines: function() {
                return this.#connectLines;
            }.bind(this)
        });
    }

    destory() {
        this.#destoryUsers();
        this.#destoryProducts();
        this.#destoryLines();
        this.#destoryConnectLines();
        if (this.isStart) { 
            this.#canvas.destory();
        }
        this.#canvas = undefined;
        this.#users = undefined;
        this.#products = undefined;
        this.#lines = undefined;
        this.#connectLines = undefined;
    }

    clearCanvas() {
        if (this.isStart == false) { return; }
        this.#canvas.clearAll();
    }

    clearCanvasUsers() {
        if (this.isStart == false) { return; }
        this.#canvas.clearUsers();
    }

    clearCanvasProducts() {
        if (this.isStart == false) { return; }
        this.#canvas.clearProducts();
    }

    clearCanvasLines() {
        if (this.isStart == false) { return; }
        this.#canvas.clearLines();
    }

    clearCanvasConnectLines() {
        if (this.isStart == false) { return; }
        this.#canvas.clearConnectLines();
    }

    drawCanvas() {
        if (this.isStart == false) { return; }
        this.#canvas.clearAll();
        this.#canvas.draw();
    }

    drawCanvasUsers() {
        if (this.isStart == false) { return; }
        this.#canvas.clearUsers();
        this.#canvas.drawUsers();
    }

    drawCanvasProducts() {
        if (this.isStart == false) { return; }
        this.#canvas.clearProducts();
        this.#canvas.drawProducts();
    }

    start(height, users, products) {
        this.#height = height;
        this.#users = this.#ifNeededCreateItems(users, function(value) {
            return new User(value);
        });
        this.#products = this.#ifNeededCreateItems(products, function(value) {
            return new Product(value);
        });
        this.#products = this.#updateDummyProducts(this.#users.length, this.#products);
        this.#calcAndCanvasDraw();
        this.isStart = true;
    }

    redraw() {
        if (this.isStart == false) { return; }
        this.clearCanvas();
        this.#calcAndCanvasDraw();
    }

    #calcAndCanvasDraw() {
        let fontSize = CalculatorData.searchOptimalFontSize(this.#users, this.#products, Config.text.baseFontSize);
        this.#configurateItem(function(item) { 
            item.fontSize = `${fontSize}${Config.text.fontSuffix}`;
            item.textSize = Utils.getSize(item.text);
        });

        this.#users = CalculatorData.multilineText(this.#users);
        this.#products = CalculatorData.multilineText(this.#products);
        
        let maximumUsersHeight = this.#users.map(function(item) { 
            return item.reduceMultilineHeightWidthSpacing();
        }).sort(Utils.numberSortFn)[this.#users.length - 1];

        let maximumProductsHeight = this.#products.map(function(item) { 
            return item.reduceMultilineHeightWidthSpacing();
        }).sort(Utils.numberSortFn)[this.#products.length - 1];

        let itemStartX = parseFloat(Config.content.margin.left);
        
        let userStartY = parseFloat(Config.content.margin.top);
        CalculatorData.makeItems(true, this.#users, this.#products, itemStartX, userStartY, maximumUsersHeight);
        
        this.#canvas.setSize(new Size(this.#getWidthToUsers(), this.#height));
        
        let productStartY = this.#canvas.getSize().height - maximumProductsHeight - (Config.text.verticalPadding * 2) - parseFloat(Config.content.margin.bottom);
        CalculatorData.makeItems(false, this.#users, this.#products, itemStartX, productStartY, maximumProductsHeight);

        this.#lines = CalculatorData.makeLines(this.#users, this.#products);
        this.#connectLines = CalculatorData.makeConnectLines(this.#lines);

        this.#setupRandomColor();
        this.#canvas.draw();
    }

    #ifNeededCreateItems(items, createCallback) {
        if (items != undefined && items.length != 0) {
            if (!(items[0] instanceof Item)) {
                let tmpItems = [];
                for(let i=0; i<items.length; i++) {
                    tmpItems.push(createCallback('' + items[i]));
                }
                items = tmpItems;
            }
        }
        return items;
    }

    #updateDummyProducts(userCount, products) {
        for (let i=products.length; i<userCount; i++) {
            products.push(new Product(Config.text.loseText));
        }
        products = Utils.shuffle(products);
        return products;
    }
    
    #configurateItem(handler) {
        for (let i=0; i<this.#users.length; i++) {
            handler(this.#users[i])
        }
        for (let i=0; i<this.#products.length; i++) {
            handler(this.#products[i])
        }
    }

    #setupRandomColor() {
        let connectLinesStr = JSON.stringify(this.#connectLines);
        for (let i=0; i<this.#users.length; i++) {
            let user = this.#users[i];
            let connectLines = JSON.parse(connectLinesStr);
            let destinationIndex = this.#getUserToProductIndex(i, connectLines, user.frame.y + user.frame.height + 1);
            
            let rand = Math.floor(Math.random() * Object.keys(ColorTypes).length);
            let color = ColorTypes[Object.keys(ColorTypes)[rand]];
            
            this.#users[i].color = color;
            this.#users[i].destinationIndex = destinationIndex;
            this.#products[destinationIndex].color = color;
            this.#products[destinationIndex].destinationIndex = i;
        }
    }

    #getUserToProductIndex(index, connectLines, fromY) {
        let item = this.#users[index];
        let selectData = CalculatorData.selectConnectLineData(true, connectLines, item.frame.x, item.frame.width, fromY);
        let selectConnectLine = selectData.connectLine;

        if (selectConnectLine == undefined) {
            return index;
        }

        connectLines.splice(selectData.index, 1);
        
        if (selectData.isAdvance) {
            let nextIndex = selectConnectLine.toX < selectConnectLine.fromX ? index + 1 : index - 1;
            return this.#getUserToProductIndex(nextIndex, connectLines, selectConnectLine.y);
        } else {
            let nextIndex = selectConnectLine.toX > selectConnectLine.fromX ? index + 1 : index - 1;
            return this.#getUserToProductIndex(nextIndex, connectLines, selectConnectLine.y);
        }
    }

    #getWidthToUsers() {
        if (this.#users.length == 0) { return 0; }
        let lastUser = this.#users[this.#users.length - 1];
        let lastX = lastUser.frame.x + lastUser.frame.width;
        return lastX + parseFloat(Config.content.margin.right) + 1;
    }

    #destoryUsers() {
        this.#users = [];
    }

    #destoryProducts() {
        this.#products = [];
    }

    #destoryLines() {
        this.#lines = [];
    }

    #destoryConnectLines() {
        this.#connectLines = [];
    }
}