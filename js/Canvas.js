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

    startUserAnimation(index, animationRoute) {
        if (index == undefined) {
            let users = this.#delegate.users();
            for (let i=0; i<users.length; i++) {
                this.startUserAnimation(i, animationRoute);
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
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }
    }

    startProductAnimation(index, animationRoute) {
        if (index == undefined) {
            let product = this.#delegate.products();
            for (let i=0; i<product.length; i++) {
                this.startUserAnimation(i, animationRoute);
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