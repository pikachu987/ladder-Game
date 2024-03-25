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