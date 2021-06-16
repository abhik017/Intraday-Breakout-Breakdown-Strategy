const path = require('path');
const fs = require('fs');
const parse = require('csv-parse');
const fetchStockData = require('./fetch-data');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: '../prev-day-range.csv',
  header: [
    {id: 'range', title: 'Range'},
    {id: 'h4', title: 'Camarilla H4'},
    {id: 'l4', title: 'Camarilla L4'}
  ]
});

let counter = 0, tempArray = [];

let tickerData = new Promise((resolve) => {
    fs.createReadStream(path.join(__dirname, "../ind_nifty500list.csv"))
    .pipe(
        parse({
            delimiter: ','
        })
    )
    .on('data', (dataRow) => {
        if(counter != 0) {
            tempArray.push(dataRow[2]);
        }
        counter++;
    })
    .on('end', () => {
        resolve(tempArray);
    });
});

async function rangeCalculator() {
    tickerData = await tickerData;
    const rangeL4H4Array = [];
    for(let i = 0; i < tickerData.length;i++) {
        try {
            const ohlcData = await fetchStockData(tickerData[i]);
            const datasetSize = ohlcData.close.length;
            const closePrice = ohlcData.close[datasetSize - 1];
            let minPrice = 1000000, maxPrice = 0;
            for(let j = 0; j < datasetSize; j++) {
                if(ohlcData.low[j] !== null && ohlcData.low[j] < minPrice) {
                    minPrice = ohlcData.low[j];
                }
                if(ohlcData.high[j] !== null && maxPrice < ohlcData.high[j]) {
                    maxPrice = ohlcData.high[j];
                }
            }
            const range = Math.abs(maxPrice - minPrice);
            const l4 = closePrice - (range * (1.1/2)), h4 = closePrice + (range * (1.1/2));
            rangeL4H4Array.push({
                range: range,
                l4: l4,
                h4: h4
            });
            console.log(`fetched ${i+1} records. Close the CSV file, if Open!!`);
        } catch(err) {
            console.log(`error encountered in ${i+1}th record`)
        }
    }
    return rangeL4H4Array;
}

async function writeToCsv() {
    const rangeL4H4Array = await rangeCalculator();
    csvWriter
        .writeRecords(rangeL4H4Array)
        .then(() => {
            console.log("CSV generated!");
        });
}

writeToCsv();