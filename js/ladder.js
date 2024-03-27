
class Line {
    constructor(x, fromY, toY) {
        this.x = x;
        this.fromY = fromY;
        this.toY = toY;
    }
}
const AnimationType = Object.freeze({
    none: 'none',
    proceeding: 'proceeding',
    complete: 'complete'
});
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

    getResults() {
        let list = [];
        for (let i=0; i<this.#users.length; i++) {
            let user = this.#users[i];
            let product = this.#products[user.destinationIndex];
            list.push({
                username: user.text,
                userIndex: i,
                productName: product.text,
                productIndex: user.destinationIndex,
                isWinning: product.isWinning
            });
        }
        return list;
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
    
    userAnimation(callback) {
        this.#canvas.startUserAnimation(undefined, AnimationRoute.interaction, callback);
    }

    productAnimation(callback) {
        this.#canvas.startProductAnimation(undefined, AnimationRoute.interaction, callback);
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
        for (let i=0; i<this.#products.length; i++) {
            this.#products[i].isWinning = true;
        }
        for (let i=products.length; i<userCount; i++) {
            let product = new Product(Config.text.loseText);
            product.isWinning = false;
            products.push(product);
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
class Rect {
    constructor(x, y, width, height) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.width = parseFloat(width);
        this.height = parseFloat(height);
    }
}
class Size {
    constructor(width, height) {
        this.width = parseFloat(width);
        this.height = parseFloat(height);
    }
}
class CanvasDraw {
    #context;

    constructor(context) {
        this.#context = context;
    }

    destory() {
        this.#context = undefined;
    }

    drawRect(frame, color) {
        this.#context.lineWidth = parseFloat(Config.item.size);
        this.#context.strokeStyle = color;
        this.#context.beginPath();
        this.#context.strokeRect(frame.x, frame.y, frame.width, frame.height);
        this.#context.closePath();
    }

    drawText(text, x, y, font, color) {
        this.#context.direction = "ltr";
        this.#context.textAlign = 'left';
        this.#context.textBaseline = 'top';
        this.#context.font = font;
        this.#context.fillStyle = color;
        this.#context.beginPath();
        this.#context.fillText(text, x, y);
        this.#context.closePath();
    }
    
    drawLine(fromX, fromY, toX, toY, lineWidth, color) {
        this.#context.lineWidth = parseFloat(lineWidth);
        this.#context.strokeStyle = color;
        this.#context.beginPath();
        this.#context.moveTo(fromX, fromY);
        this.#context.lineTo(toX, toY);
        this.#context.closePath();
        this.#context.stroke();
    }

    fillRect(style, frame) {
        this.#context.fillStyle = style;
        this.#context.beginPath();
        this.#context.fillRect(frame.x, frame.y, frame.width, frame.height);
        this.#context.closePath();
    }

    clearRect(frame) {
        this.#context.clearRect(frame.x, frame.y, frame.width, frame.height);
    }
}
class ConnectLine {
    constructor(fromX, toX, y) {
        this.fromX = fromX;
        this.toX = toX;
        this.y = y;
    }
}
class Config {
    static canvas = {
        maxWidth: parseFloat(16000)
    }
    static content = {
        margin: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        },
    }
    static item = {
        size: 1,
        color: 'rgba(0, 0, 0, 1)',
        horizontalSpacing: 4,
    }
    static text = {
        color: 'rgba(0, 0, 0, 1)',
        oneLineMaxWidth: 16,
        maxNumberOfLines: 4,
        baseFontSize: 18,
        fontSuffix: 'px serif',
        loseText: '꽝',
        lineSpacing: 1,
        verticalPadding: 8,
        horizontalPadding: 4

    }
    static line = {
        size: 1,
        color: 'rgba(0, 0, 0, 1)',
    }
    static connectLine = {
        size: 1,
        color: 'rgba(0, 0, 0, 1)',
        verticalMargin: 10,
        minCount: 1,
        maxCount: 2,
    }
    static animation = {
        line: {
            size: 8,
            colorOpacity: 0.7,
            repeatCount: 10,
            repeatDelay: 0.01,    
        },
        item: {
            colorOpacity: 0.3,
            repeatCount: 20,
            repeatDelay: 0.001   
        }
    }
}
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
    isWinning;
}
class Canvas {
    #size;
    #canvas;
    #canvasDraw;
    #animation;
    #delegate;
    #clickEvent;
    #mousemoveEvent;
    #mouseleaveEvent;

    constructor(canvasParentId) {
        this.#canvas = document.createElement('canvas');
        this.#canvasDraw = new CanvasDraw(this.#canvas.getContext('2d'));
        this.#animation = new Animation();
        document.getElementById(canvasParentId).append(this.#canvas);
        this.#setupEvent();
    }

    setSize(size) {
        this.#size = size;
        this.#canvas.width = this.#size.width;
        this.#canvas.height = this.#size.height;
    }

    getSize() {
        return this.#size;
    }

    getFrame() {
        return new Rect(0, 0, this.#size.width, this.#size.height);
    }

    setDelegate(delegate) {
        this.#delegate = delegate;
    }

    destory() {
        this.#removeEvent();
        this.clearAll();
        this.#canvasDraw.destory();
        this.#canvas.parentNode.removeChild(this.#canvas);
        this.#size = undefined;
        this.#canvas = undefined;
        this.#canvasDraw = undefined;
        this.#animation = undefined;
        this.#delegate = undefined;
    }

    draw() {
        this.clearAll();
        this.drawUsers();
        this.drawProducts();
        this.drawLines();
        this.drawConnectLines();
        this.#animation.resetAnimation();
    }

    drawUsers(i) {
        let users = this.#delegate.users();
        if (i == undefined) {
            for (let i=0; i<users.length; i++) {
                this.drawUsers(i);
            }
        } else {
            let user = users[i];
            this.#canvasDraw.drawRect(user.frame, Config.item.color);
            this.#drawMultilineText(user);
        }
    }

    drawProducts(i) {
        let products = this.#delegate.products();
        if (i == undefined) {
            for (let i=0; i<products.length; i++) {
                this.drawProducts(i);
            }
        } else {
            let product = products[i];
            this.#canvasDraw.drawRect(product.frame, Config.item.color);
            this.#drawMultilineText(product);
        }
    }
    
    drawLines(i) {
        let lines = this.#delegate.lines();
        if (i == undefined) {
            for (let i=0; i<lines.length; i++) {
                this.drawLines(i);
            }
        } else {
            let line = lines[i];
            this.#canvasDraw.drawLine(line.x, line.toY, line.x, line.fromY, Config.line.size, Config.line.color);
        }
    }

    drawConnectLines(i) {
        let connectLines = this.#delegate.connectLines();
        if (i == undefined) {
            for (let i=0; i<connectLines.length; i++) {
                this.drawConnectLines(i);
            }
        } else {
            let connectLine = connectLines[i];
            this.#canvasDraw.drawLine(connectLine.fromX, connectLine.y, connectLine.toX, connectLine.y, Config.connectLine.size, Config.connectLine.color);
        }
    }

    clearUsers(i) {
        let users = this.#delegate.users();
        if (users.length == 0) { return; }
        if (i == undefined) {
            let firstUser = users[0];
            let lastUser = users[users.length - 1];
            let clearFrame = new Rect(firstUser.frame.x, firstUser.frame.y, lastUser.frame.x + lastUser.frame.width, firstUser.frame.height);
            this.#canvasDraw.clearRect(clearFrame);   
        } else {
            let user = users[i];
            this.#canvasDraw.clearRect(user.frame);
        }
    }

    clearProducts(i) {
        let products = this.#delegate.products();
        if (products.length == 0) { return; }
        if (i == undefined) {
            let firstProduct = products[0];
            let lastProduct = products[products.length - 1];
            let clearFrame = new Rect(firstProduct.frame.x, firstProduct.frame.y, lastProduct.frame.x + lastProduct.frame.width, firstProduct.frame.height);
            this.#canvasDraw.clearRect(clearFrame);
        } else {
            let product = products[i];
            this.#canvasDraw.clearRect(product.frame);
        }
    }

    clearAnimating() {
        for (let i=0; i<this.#delegate.users().length; i++) {
            this.#delegate.users()[i].animationType = AnimationType.none;
            this.#delegate.products()[i].animationType = AnimationType.none;
        }
        this.#animation.resetAnimation();
    }

    clearAll() {
        this.#canvasDraw.clearRect(this.getFrame());
        this.clearAnimating();
    }

    startUserAnimation(index, animationRoute, callback) {
        if (index == undefined) {
            let users = this.#delegate.users();
            let callbackCount = 0;
            for (let i=0; i<users.length; i++) {
                this.startUserAnimation(i, animationRoute, function() { 
                    callbackCount += 1;
                    if (callbackCount == users.length) {
                        callback();
                    }
                });
            }
        } else {
            let users = this.#delegate.users();
            let products = this.#delegate.products();
            let user = users[index];
            let product = products[user.destinationIndex];
            user.animationType = AnimationType.proceeding;
            product.animationType = AnimationType.proceeding;
            this.#userAnimation(index, animationRoute, function() {
                let connectLines = JSON.parse(JSON.stringify(this.#delegate.connectLines()));
                this.#lineAnimation(true, animationRoute, index, user.color, connectLines, user.frame.width / 2, user.frame.y + user.frame.height + 1, function(index) {
                    this.#productAnimation(index, animationRoute, function() {
                        user.animationType = AnimationType.complete;
                        product.animationType = AnimationType.complete;
                        if (callback != undefined && typeof(callback) == 'function') {
                            callback()
                        }
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }
    }

    startProductAnimation(index, animationRoute, callback) {
        if (index == undefined) {
            let products = this.#delegate.products();
            let callbackCount = 0;
            for (let i=0; i<products.length; i++) {
                this.startUserAnimation(i, animationRoute, function() { 
                    callbackCount += 1;
                    if (callbackCount == products.length) {
                        callback();
                    }
                });
            }
        } else {
            let products = this.#delegate.products();
            let users = this.#delegate.users();
            let product = products[index];
            let user = users[product.destinationIndex];
            product.animationType = AnimationType.proceeding;
            user.animationType = AnimationType.proceeding;
            this.#productAnimation(index, animationRoute, function() {
                let connectLines = JSON.parse(JSON.stringify(this.#delegate.connectLines()));
                this.#lineAnimation(false, animationRoute, index, product.color, connectLines, product.frame.width / 2, product.frame.y - 1, function(index) {
                    this.#userAnimation(index, animationRoute, function() {
                        product.animationType = AnimationType.complete;
                        user.animationType = AnimationType.complete;
                        if (callback != undefined && typeof(callback) == 'function') {
                            callback()
                        }
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }
    }

    #setupEvent() {
        this.#clickEvent = function(event) {
            let point = this.#getEventPoint(event);
            this.#click(point);
        }.bind(this);
        this.#mousemoveEvent = function(event) {
            let point = this.#getEventPoint(event);
            this.#mousemove(point);
        }.bind(this);
        this.#mouseleaveEvent = function(event) {
            this.#mouseleave();
        }.bind(this);

        this.#canvas.addEventListener('click', this.#clickEvent, false);
        this.#canvas.addEventListener('mousemove', this.#mousemoveEvent, false);
        this.#canvas.addEventListener('mouseleave', this.#mouseleaveEvent, false);
    }

    #removeEvent() {
        if (this.#clickEvent != undefined) {
            this.#canvas.removeEventListener('click', this.#clickEvent, false);
            this.#clickEvent = undefined;
        }
        if (this.#mousemoveEvent != undefined) {
            this.#canvas.removeEventListener('mousemove', this.#mousemoveEvent, false);
            this.#mousemoveEvent = undefined;
        }
        if (this.#mouseleaveEvent != undefined) {
            this.#canvas.removeEventListener('mouseleave', this.#mouseleaveEvent, false);
            this.#mouseleaveEvent = undefined;
        }
    }

    #drawMultilineText(item) {
        function isKorea(text) {
            const korean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
            return korean.test(text);
        }
        let multilineTextHeight = item.reduceMultilineHeightWidthSpacing();
        let multilineTextY = (item.frame.height - multilineTextHeight) / 2;

        for (let i=0; i<item.multilines.length; i++) {
            let multiline = item.multilines[i];
            let centerTextX = (item.frame.width - multiline.size.width) / 2;
            let textX = item.frame.x + centerTextX;
            
            let prevMultilineHeight = 0;
            for (let j=i-1; j>=0; j--) {
                prevMultilineHeight += item.multilines[j].size.height;
            }
            let addLineY = prevMultilineHeight + (Config.text.lineSpacing * i);
            let isKoreaTextY = isKorea(multiline.text) ? 2 : 0;
            let textY = item.frame.y + multilineTextY + addLineY + isKoreaTextY;
            this.#canvasDraw.drawText(multiline.text, textX, textY, `${item.fontSize}${Config.text.fontSuffix}`, Config.text.color);
        }
    }

    #getEventPoint(event) {
        let elemLeft = this.#canvas.offsetLeft + this.#canvas.clientLeft;
        let elemTop = this.#canvas.offsetTop + this.#canvas.clientTop;
        let x = event.pageX - elemLeft;
        let y = event.pageY - elemTop;
        return new Point(x, y);
    }

    #click(point) {
        let inUserIndex = this.#inItems(this.#delegate.users(), point);
        if (inUserIndex != -1) {
            this.clearAll();
            this.draw();
            this.startUserAnimation(inUserIndex, AnimationRoute.click);
            return;
        }

        let inProductIndex = this.#inItems(this.#delegate.products(), point);
        if (inProductIndex != -1) {
            this.clearAll();
            this.draw();
            this.startProductAnimation(inProductIndex, AnimationRoute.click);
            return;
        }
    }

    #mousemove(point) {
        let inUserIndex = this.#inItems(this.#delegate.users(), point);
        let inProductIndex = this.#inItems(this.#delegate.products(), point);
        let users = this.#delegate.users();
        let products = this.#delegate.products();

        if (inUserIndex != -1 || inProductIndex != -1) {
            document.body.style.cursor = "pointer";
        } else {
            document.body.style.cursor = "default";
        }

        if (this.hoverEventUserIndex != inUserIndex) {
            if (this.hoverEventUserIndex != undefined && users[this.hoverEventUserIndex].animationType == AnimationType.none) {
                this.#animation.resetAnimation(AnimationRoute.move);
                this.clearUsers(this.hoverEventUserIndex);
                this.drawUsers(this.hoverEventUserIndex);
                this.hoverEventUserIndex = undefined;
            }
            if (inUserIndex != -1 && users[inUserIndex].animationType == AnimationType.none) {
                this.hoverEventUserIndex = inUserIndex;
                this.#userAnimation(inUserIndex, AnimationRoute.move);
            }   
        }

        if (this.hoverEventProductIndex != inProductIndex) {
            if (this.hoverEventProductIndex != undefined && products[this.hoverEventProductIndex].animationType == AnimationType.none) {
                this.#animation.resetAnimation(AnimationRoute.move);
                this.clearProducts(this.hoverEventProductIndex);
                this.drawProducts(this.hoverEventProductIndex);
                this.hoverEventProductIndex = undefined;
            }
            if (inProductIndex != -1 && products[inProductIndex].animationType == AnimationType.none) {
                this.hoverEventProductIndex = inProductIndex;
                this.#productAnimation(inProductIndex, AnimationRoute.move);
            }   
        }
    }

    #mouseleave() {
        document.body.style.cursor = "default";
        let users = this.#delegate.users();
        let products = this.#delegate.products();

        if (this.hoverEventUserIndex != undefined && users[this.hoverEventUserIndex].animationType == AnimationType.none) {
            this.#animation.resetAnimation(AnimationRoute.move);
            this.clearUsers(this.hoverEventUserIndex);
            this.drawUsers(this.hoverEventUserIndex);
            this.hoverEventUserIndex = undefined;
        }

        if (this.hoverEventProductIndex != undefined && products[this.hoverEventProductIndex].animationType == AnimationType.none) {
            this.#animation.resetAnimation(AnimationRoute.move);
            this.clearProducts(this.hoverEventProductIndex);
            this.drawProducts(this.hoverEventProductIndex);
            this.hoverEventProductIndex = undefined;
        }
    }

    #inItems(items, point) {
        function isInItem(point, item) {
            if (item.frame.x < point.x && point.x < item.frame.x + item.frame.width && item.frame.y < point.y && point.y < item.frame.y + item.frame.height) {
                return true;
            }
            return false;
        }
        for (let i=0; i<items.length; i++) {
            if (isInItem(point, items[i])) {
                return i;
            }
        }
        return -1;
    }

    #userAnimation(index, animationRoute, callback) {
        let users = this.#delegate.users();
        let user = users[index];
        let repeatCount = Config.animation.item.repeatCount;
        this.#animation.animationRecursion(animationRoute, repeatCount, Config.animation.item.repeatDelay, function(i) {
            if (i == -1) {
                if (callback != undefined) {
                    callback();
                }
                return;
            }
            this.clearUsers(index);
            this.drawUsers(index);
            let fillStyle = user.color.value(Config.animation.item.colorOpacity * i / repeatCount);
            this.#canvasDraw.fillRect(fillStyle, user.frame);
        }.bind(this));
    }

    #productAnimation(index, animationRoute, callback) {
        let products = this.#delegate.products();
        let product = products[index];
        let repeatCount = Config.animation.item.repeatCount;
        this.#animation.animationRecursion(animationRoute, repeatCount, Config.animation.item.repeatDelay, function(i) {
            if (i == -1) {
                if (callback != undefined) {
                    callback();
                }
                return;
            }
            this.clearProducts(index);
            this.drawProducts(index);
            let fillStyle = product.color.value(Config.animation.item.colorOpacity * i / repeatCount);
            this.#canvasDraw.fillRect(fillStyle, product.frame);
        }.bind(this));
    }

    #lineAnimation(isUser, animationRoute, index, color, connectLines, fromX, fromY, callback) {
        let item = isUser ? this.#delegate.users()[index] : this.#delegate.products()[index];
        let selectData = CalculatorData.selectConnectLineData(isUser, connectLines, item.frame.x, item.frame.width, fromY);
        let selectConnectLine = selectData.connectLine;

        if (selectConnectLine == undefined) {
            let item = isUser ? this.#delegate.products()[index] : this.#delegate.users()[index];
            let toY = isUser ? item.frame.y : item.frame.y + item.frame.height;
            this.#animationMoveVerticalLine(animationRoute, color, fromX, fromY, toY, function() {
                if (callback != undefined) {
                    callback(index);
                }
            });
            return;
         }
         connectLines.splice(selectData.index, 1);
        
        if (selectData.isAdvance) {
            this.#animationMoveVerticalLine(animationRoute, color, selectConnectLine.toX, fromY, selectConnectLine.y, function() {
                this.#animationMoveHorizontalLine(animationRoute, color, selectConnectLine.toX, selectConnectLine.fromX, selectConnectLine.y, function() {
                    let nextIndex = selectConnectLine.toX < selectConnectLine.fromX ? index + 1 : index - 1;
                    this.#lineAnimation(isUser, animationRoute, nextIndex, color, connectLines, selectConnectLine.fromX, selectConnectLine.y, callback);
                }.bind(this));
            }.bind(this));
        } else {
            this.#animationMoveVerticalLine(animationRoute, color, selectConnectLine.fromX, fromY, selectConnectLine.y, function() {
                this.#animationMoveHorizontalLine(animationRoute, color, selectConnectLine.fromX, selectConnectLine.toX, selectConnectLine.y, function() {
                    let nextIndex = selectConnectLine.toX > selectConnectLine.fromX ? index + 1 : index - 1;
                    this.#lineAnimation(isUser, animationRoute, nextIndex, color, connectLines, selectConnectLine.toX, selectConnectLine.y, callback);
                }.bind(this));
            }.bind(this));
        }
    }

    #animationMoveVerticalLine(animationRoute, color, x, fromY, toY, callback) {
        let repeactCount = Config.animation.line.repeatCount;
        let value = (toY - fromY) / repeactCount;
        this.#animation.animationRecursion(animationRoute, repeactCount, Config.animation.line.repeatDelay, function(i) {
            if (i == -1) {
                if (callback != undefined) {
                    callback();
                }
                return;
            }
            let y = fromY + (value * i);
            this.#canvasDraw.drawLine(x, y, x, y + value, Config.animation.line.size, color.value());
        }.bind(this));
        
    }

    #animationMoveHorizontalLine(animationRoute, color, fromX, toX, y, callback) {
        let repeactCount = Config.animation.line.repeatCount;
        let value = (toX - fromX) / repeactCount;
        this.#animation.animationRecursion(animationRoute, repeactCount, Config.animation.line.repeatDelay, function(i) {
            if (i == -1) {
                if (callback != undefined) {
                    callback();
                }
                return;
            }
            let x = fromX + (value * i);
            this.#canvasDraw.drawLine(x, y, x + value, y, Config.animation.line.size, color.value());
        }.bind(this));
    }
}
class ItemTextLine {
    constructor(text, size) {
        this.text = text;
        this.size = size;
    }
}
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
const ColorTypes = Object.freeze({
    color1: { value: function(alpha) { return 'rgba(255,179,186,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color2: { value: function(alpha) { return 'rgba(255,223,186,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color3: { value: function(alpha) { return 'rgba(255,255,186,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color4: { value: function(alpha) { return 'rgba(186,255,201,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color5: { value: function(alpha) { return 'rgba(186,225,255,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color6: { value: function(alpha) { return 'rgba(255,217,217,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color7: { value: function(alpha) { return 'rgba(255,242,204,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color8: { value: function(alpha) { return 'rgba(234,209,220,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color9: { value: function(alpha) { return 'rgba(252,229,205,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color10: { value: function(alpha) { return 'rgba(217,210,233,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color11: { value: function(alpha) { return 'rgba(254,229,206,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color12: { value: function(alpha) { return 'rgba(213,187,193,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color13: { value: function(alpha) { return 'rgba(178,160,180,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color14: { value: function(alpha) { return 'rgba(133,123,145,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
    color15: { value: function(alpha) { return 'rgba(90,85,107,' + (alpha == undefined ? Config.animation.line.colorOpacity : alpha) + ')'; } },
});
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
class Point {
    constructor(x, y) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }
}
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
class CalculatorData {
    static makeItems(isUser, users, products, itemStartX, itemStartY, maximumHeight) {
        let x = itemStartX;
        let y = itemStartY;
        for (let i=0; i<users.length; i++) {
            let user = users[i];
            let product = products[i];

            let longerUserMultilineWidth = user.longerMultilineWidth();
            let longerProductMultilineWidth = product.longerMultilineWidth();
            let longerWidth = longerUserMultilineWidth > longerProductMultilineWidth ? longerUserMultilineWidth : longerProductMultilineWidth;
            
            let width = longerWidth + (Config.text.horizontalPadding * 2);
            let height = maximumHeight + (Config.text.verticalPadding * 2); 
            if (isUser) {
                user.frame = new Rect(x, y, width, height);
            } else {
                product.frame = new Rect(x, y, width, height);
            }
            
            x += width + parseFloat(Config.item.horizontalSpacing);
        }
    }

    static makeLines(users, products) {
        let line = [];
        for (let i=0; i<users.length; i++) {
            let user = users[i];
            let product = products[i];

            let itemCenterX = user.frame.x + (user.frame.width / 2);
            let fromY = user.frame.y + user.frame.height;
            let toY = product.frame.y;

            line.push(new Line(itemCenterX, fromY, toY));
        }
        return line;
    }

    static makeConnectLines(lines) {
        let lineMaxCount = parseInt(Config.connectLine.minCount);
        let lineMinCount = parseInt(Config.connectLine.maxCount);
        let connectLines = [];
        for (let i=0; i<lines.length; i++) {
            let line = lines[i];

            if (i < lines.length - 1) {
                let lineCount = Utils.roundRandom(lineMaxCount, lineMinCount);
                let nextLine = lines[i + 1];
                for(let j=0; j<lineCount; j++) {
                    let connectLine = this.makeRandomLine(connectLines, line.x, line.fromY + parseFloat(Config.connectLine.verticalMargin), nextLine.x, line.toY - parseFloat(Config.connectLine.verticalMargin));
                    if (connectLine == undefined) {
                        return this.makeConnectLines(lines, lineMaxCount, lineMinCount);
                    }
                    if (connectLine != undefined) {
                        connectLines.push(connectLine);
                    }                                
                }
            }
            
            if (i > 0) {
                let lineCount = Utils.roundRandom(lineMaxCount, lineMinCount);
                let prevLine = lines[i - 1];
                for(var j=0;j<lineCount;j++) {
                    let connectLine = this.makeRandomLine(connectLines, prevLine.x, line.fromY + parseFloat(Config.connectLine.verticalMargin), line.x, line.toY - parseFloat(Config.connectLine.verticalMargin));
                    if (connectLine == undefined) {
                        return this.makeConnectLines(lines, lineMaxCount, lineMinCount);
                    }
                    if (connectLine != undefined) {
                        connectLines.push(connectLine);
                    }
                }
            }
        }

        return connectLines;
    }

    static makeRandomLine(connectLines, fromX, fromY, toX, toY) {
        let connectYList = connectLines
        .filter(function(value, index, array) {
            return value.fromX == fromX || value.fromX == toX || value.toX == fromX || value.toX == toX
        })
        .map(function(value) { return parseFloat(value.y); })
        .sort(Utils.numberSortFn);

        let connectLineFromY = (fromY + toY) / 2;
        let diffValue = 0;
        if (0 < connectYList.length) {
            connectLineFromY = (connectYList[0] + fromY) / 2;
            diffValue = connectYList[0] - fromY;
        } 
        if (connectYList.length > 1) {
            for (var i=0;i<connectYList.length;i++) {
                let connectY = connectYList[i];
                if (i < connectYList.length - 1) {
                    let nextConnectY = connectYList[i + 1];
                    let dummyDiffValue = nextConnectY - connectY;
                    if (diffValue < dummyDiffValue) {
                        diffValue = dummyDiffValue;
                        connectLineFromY = (nextConnectY + connectY) / 2;
                    }
                } else {
                    let dummyDiffValue = toY - connectY;
                    if (diffValue < dummyDiffValue) {
                        diffValue = dummyDiffValue;
                        connectLineFromY = (connectY + toY) / 2;
                    }
                }
            }
        }

        return new ConnectLine(fromX, toX, connectLineFromY);
    }

    static getMaxWidth(users, products, fontSize) {
        let x = parseFloat(Config.content.margin.left);
        for (var i=0; i<users.length; i++) {
            let userWidth = Utils.getSize(users[i].text, fontSize).width;
            let productWidth = Utils.getSize(products[i].text, fontSize).width;

            let itemWidth = userWidth > productWidth ? userWidth : productWidth;
            let width = itemWidth + (Config.text.horizontalPadding * 2);
            let spacing = i == users.length - 1 ? 0 : Config.itemSpacing; 
            x += width + spacing;
        }
        x += parseFloat(Config.content.margin.right);
        return parseFloat(x);
    }

    static searchOptimalFontSize(users, products, fontSize) {
        if (fontSize < 6) { return fontSize; }
        if (Config.canvas.maxWidth < this.getMaxWidth(users, products, `${fontSize}${Config.text.fontSuffix}`)) {
            return this.searchOptimalFontSize(users, products, fontSize - 0.5);
        }
        return fontSize;
    }

    static multilineText(items) {
        for (let i=0; i<items.length; i++) {
            let item = items[i];
            let numberOfLines = 1;
            for (let j=Config.text.maxNumberOfLines; j>0; j--) {
                if (item.textSize.width > Config.text.oneLineMaxWidth * j) {
                    numberOfLines = j;
                    break;
                }
            }
            let splitCount = Math.ceil(item.text.length / numberOfLines);
            item.multilines = [];
            for (let j=0; j<numberOfLines; j++) {
                let toIndex = splitCount * j;
                let lastDot = j == numberOfLines - 1 && numberOfLines == Config.text.maxNumberOfLines;
                let lastDotSplitCount = lastDot ? 3 : 0;
                let lastDotText = lastDot ? '...' : '';
                let cutText = item.text.substr(toIndex, splitCount - lastDotSplitCount) + lastDotText;
                let cutTextSize = Utils.getSize(cutText, item.fontSize);
                item.multilines.push(new ItemTextLine(cutText, cutTextSize));
            }
        }
        return items;
    }

    static selectConnectLineData(isUser, connectLines, itemX, itemWidth, fromY) {
        let dummyConnectLineY = undefined;
        let dummyConnectLine = undefined;
        let dummyIndex = undefined;
        let isAdvance = undefined;

        function checkDummy(connectLine, idx, connectLineX, isAdvanceValue) {
            function comparisonConnectLineAndDummy() {
                if (dummyConnectLineY == undefined) { return true; }
                return isUser ? dummyConnectLineY >= connectLine.y : dummyConnectLineY <= connectLine.y;
            }
            let checkConnectLineAndDummy = comparisonConnectLineAndDummy();
            let checkConnectAndFromY = isUser ? fromY < connectLine.y : fromY > connectLine.y;
            let overlapLineX = connectLineX > itemX - 1 && itemX + itemWidth + 1 > connectLineX;
            if (checkConnectLineAndDummy && checkConnectAndFromY && overlapLineX) {
                dummyConnectLineY = connectLine.y;
                dummyConnectLine = connectLine;
                isAdvance = isAdvanceValue;
                dummyIndex = idx;
            }
        }

        for (let i=0; i<connectLines.length; i++) {
            let connectLine = connectLines[i];
            checkDummy(connectLine, i, connectLine.fromX, false);
            checkDummy(connectLine, i, connectLine.toX, true);
        }
        return {
            connectLine: dummyConnectLine,
            index: dummyIndex,
            isAdvance: isAdvance
        };
    }
}
class Load { static onLoad(callback) { callback(); } }