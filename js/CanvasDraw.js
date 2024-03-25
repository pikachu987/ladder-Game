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