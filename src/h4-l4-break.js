const fs = require('fs');
const parse = require('csv-parse');
const path = require('path');
const fetchStockData = require('./fetch-data');
const tempArrayTicker = [], tempArrayTickerRange = [];
const tempArrayTickerL4 = [], tempArrayTickerH4 = [];
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter1 = createCsvWriter({
    path: '../h4-breaks.csv',
    header: [
      {id: 'h4', title: 'Camarilla H4 Breakout'},
    ]
  });
const csvWriter2 = createCsvWriter({
path: '../l4-breaks.csv',
header: [
    {id: 'l4', title: 'Camarilla H4 Breakout'},
]
});
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
    const responseH4 = [], responseL4 = [];
    for(let i = 0; i < ticker.length; i++) {
        try {
            const ohlcData = await fetchStockData(ticker[i]);
            const datasetSize = ohlcData.close.length;
            let closePrice = ohlcData.close[datasetSize - 1];
            let j = datasetSize - 1;
            while(closePrice === null && j>=0) {
                closePrice = ohlcData.close(j-1);
                j--;
            }
            //h4[i] will be equal to l4[i] when range =0, and it will happen only to circuit stocks
            if(h4[i] !== l4[i] && closePrice + (0.0005) * closePrice >= h4[i]) {
                aboveH4.push(ticker[i]);
                responseH4.push({
                    h4: ticker[i],
                });
            }
            if(h4[i] !== l4[i] && closePrice - (0.0005) * closePrice <= l4[i]) {
                belowL4.push(ticker[i]);
                responseL4.push({
                    l4: ticker[i],
                });
            }
            if(i%10 === 0) {
                console.log(`****** Below L4 stocks: {${belowL4}} ****** Above H4 stocks: {${aboveH4}} ******`);
            }
        } catch(err) {
            console.log(err);
        }        
    }
    return {
        h4: responseH4,
        l4: responseL4
    };
}

async function generateCsv() {
    const result = await runAlgorithm();
    csvWriter1
        .writeRecords(result.h4)
        .then(() => {
            console.log("H4 CSV generated!");
        });
    csvWriter2
    .writeRecords(result.l4)
    .then(() => {
        console.log("L4 CSV generated!");
    });
}

generateCsv();

