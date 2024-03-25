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