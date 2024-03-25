class Load {
    static #loadQueueManager;
    
    constructor() {
        Load.#loadQueueManager = this.#createLoadQueueManager();
        this.#setupScript();
    }

    static onLoad(callback) {
        this.#loadQueueManager.setCompletion(callback);
    }

    #createLoadQueueManager() {
        return (function() {
            class LoadQueueManager {
                static shared = new LoadQueueManager();
        
                #completion = undefined;
                #queue = [];
                #isEvenOncePush = false;
            
                setCompletion(callback) {
                    this.#completion = callback;
                    this.#completionCheck();
                }
            
                appendQueue(value) {
                    this.#queue.push(value);
                    this.#isEvenOncePush = true;
                }
            
                removeQueue(value) {
                    for (var i=0;i<this.#queue.length;i++) {
                        if (this.#queue[i] == value) {
                            this.#queue.splice(i, 1);
                            this.#completionCheck();
                            return;
                        }
                    }
                }
            
                #completionCheck() {
                    if (this.#isEvenOncePush && this.#queue.length == 0 && this.#completion != undefined && typeof(this.#completion) == 'function') {
                        this.#completion();
                    }
                }
            }
            return LoadQueueManager.shared;
        })();
    }

    #addScript(src) {
        const script = document.createElement('script');
        script.src = src;
        script.type = "text/javascript";
        script.onload = function () {
            Load.#loadQueueManager.removeQueue(src);
        };
        script.onerror = function (e) {
            console.error(`script.onerror src: ${src}, e: ${e}`);
        }
        document.head.appendChild(script);
        Load.#loadQueueManager.appendQueue(src);
    }

    #setupScript() {
        this.#addScript('./js/ColorTypes.js');
        this.#addScript('./js/AnimationRoute.js');
        this.#addScript('./js/AnimationType.js');
        this.#addScript('./js/Animation.js');
        this.#addScript('./js/Config.js');
        this.#addScript('./js/Size.js');
        this.#addScript('./js/Point.js');
        this.#addScript('./js/Rect.js');
        this.#addScript('./js/Line.js');
        this.#addScript('./js/ConnectLine.js');
        this.#addScript('./js/ItemTextLine.js');
        this.#addScript('./js/Item.js');
        this.#addScript('./js/Utils.js');
        this.#addScript('./js/CalculatorData.js');
        this.#addScript('./js/CanvasDraw.js');
        this.#addScript('./js/Canvas.js');
        this.#addScript('./js/Game.js');
    }
}

(function() { new Load(); })();