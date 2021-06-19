const path = require('path');
const fs = require('fs');
const parse = require('csv-parse');
const fetchStockData = require('./fetch-price-data');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter1 = createCsvWriter({
    path: '../cpr-tc.csv',
    header: [
      {id: 'tc', title: 'TC'},
    ]
});
const csvWriter2 = createCsvWriter({
    path: '../cpr-bc.csv',
    header: [
        {id: 'bc', title: 'BC'},
    ]
});
const csvWriter3 = createCsvWriter({
    path: '../cpr-p.csv',
    header: [
        {id: 'pivot', title: 'Central Pivot'},
    ]
});
let counter = 0, tickerData;
const tempArray = [];
tickerData = new Promise((resolve) => {
    fs.createReadStream(path.join(__dirname, "../ind_nifty500list.csv"))
    .pipe(
        parse({
            delimiter: ','
        })
    )
    .on('data', (dataRow) => {
        if(counter != 0) {
            tempArray.push({
                stock: dataRow[2],
                centralPivot: dataRow[9],
                bc: dataRow[10],
                tc: dataRow[11]
            });
        }
        counter++;
    })
    .on('end', () => {
        resolve(tempArray);
    });
});

async function runAlgorithm() {
    const data = await tickerData;
    const tcList = [], bcList = [], pivotList = [];
    for(let index = 0; index < data.length; index++) {
        try {
            const stock = data[index].stock, centralPivot = data[index].centralPivot, bc = data[index].bc, tc = data[index].tc;
            const ohlcData = await fetchStockData(stock);
            const datasetSize = ohlcData.close.length;
            let closePrice = ohlcData.close[datasetSize - 1];
            let jj = datasetSize - 1;
            while(closePrice === null && jj>=0) {
                closePrice = ohlcData.close[jj-1];
                jj--;
            }
            if(closePrice === null) {
                throw "Error";
            }
            if(centralPivot + 0.002 * centralPivot >= closePrice && centralPivot - 0.002 * centralPivot <= closePrice) {
                pivotList.push({
                    pivot: stock
                });
            } else if(tc + 0.002 * tc >= closePrice && tc - 0.002 * tc <= closePrice) {
                tcList.push({
                    tc: stock
                })
            } else if(bc + 0.002 * bc >= closePrice && bc - 0.002 * bc <= closePrice) {
                bcList.push({
                    bc: stock
                });
            }
            if(!(index % 10)) {
                console.log(`fetched ${index + 1} records.`);
            }
        } catch(err) {
            console.log(err, `error encountered in ${index + 1}th record`);
        }
    }
    return {
        tcList: tcList,
        bcList: bcList,
        pivotList: pivotList
    }
}

async function generateCsv() {
    try {
        const result = await runAlgorithm();
        csvWriter1
            .writeRecords(result.tcList)
            .then(() => {
                console.log("TC CSV generated!");
            });
        csvWriter2
            .writeRecords(result.bcList)
            .then(() => {
                console.log("BC CSV generated!");
            });
        csvWriter3
            .writeRecords(result.pivotList)
            .then(() => {
                console.log("Pivot CSV generated!")
            });
    } catch(err) {
        console.log(err);
    }
}

generateCsv();