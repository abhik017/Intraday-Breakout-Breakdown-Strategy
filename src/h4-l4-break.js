const fs = require('fs');
const parse = require('csv-parse');
const path = require('path');
const fetchStockData = require('./fetch-data');
const tempArrayTicker = [], tempArrayTickerRange = [];
const tempArrayTickerL4 = [], tempArrayTickerH4 = [];

let counter = 0, tickerData;

tickerData = new Promise((resolve) => {
    fs.createReadStream(path.join(__dirname, "../ind_nifty500list.csv"))
    .pipe(
        parse({
            delimiter: ','
        })
    )
    .on('data', (dataRow) => {
        if(counter != 0) {
            tempArrayTicker.push(dataRow[2]);
            tempArrayTickerL4.push(dataRow[5]);
            tempArrayTickerH4.push(dataRow[4]);
        }
        counter++;
    })
    .on('end', () => {
        resolve({
            tickerArray: tempArrayTicker,
            tickerH4: tempArrayTickerH4,
            tickerL4: tempArrayTickerL4
        });
    });
});

async function runAlgorithm() {
    tickerData = await tickerData;
    const ticker = tickerData.tickerArray, h4 = tickerData.tickerH4, l4 = tickerData.tickerL4;
    const aboveH4 = [], belowL4 = [];
    for(let i = 0; i < ticker.length; i++) {
        try {
            const ohlcData = await fetchStockData(ticker[i]);
            const datasetSize = ohlcData.close.length;
            const closePrice = ohlcData.close[datasetSize - 1];
            if(closePrice + (0.0005) * closePrice >= h4[i]) {
                aboveH4.push(ticker[i]);
            }
            if(closePrice - (0.0005) * closePrice <= l4[i]) {
                belowL4.push(ticker[i]);
            }
            console.log(`****** Below L4 stocks: {${belowL4}} ****** Above H4 stocks: {${aboveH4}} ******`);
        } catch(err) {
            console.log(err);
        }        
    }
}

    runAlgorithm();

