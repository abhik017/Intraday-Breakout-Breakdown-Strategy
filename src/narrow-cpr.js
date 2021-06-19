const path = require('path');
const fs = require('fs');
const parse = require('csv-parse');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const calcCpr = require('./calculate-cpr')
const csvWriter1 = createCsvWriter({
    path: '../extemely-narrow-cpr.csv',
    header: [
      {id: 'stock', title: 'Name'},
      {id: 'width', title: 'Priority'}
    ]
});
const csvWriter2 = createCsvWriter({
    path: '../narrow-cpr.csv',
    header: [
      {id: 'stock', title: 'Name'}
    ]
});
let counter = 0;
const tempArray = [];
let tickerData = new Promise((resolve) => {
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
                high: dataRow[6],
                low: dataRow[7],
                close: dataRow[8]
            });
        }
        counter++;
    })
    .on('end', () => {
        resolve(tempArray);
    });
});

async function getCprWidth(high, low, close) {
    const {pivot, bc, tc} = calcCpr(high, low, close);
    const delta = Math.abs(bc - tc);
    if(delta === 0) return 1000000;
    return close/delta;
}

async function getNarrowCprList() {
    const extremelyNarrow = [], narrow = [];
    try {
        const tickerData1 = await tickerData;
        for(let index = 0; index < tickerData1.length; index++) {
            try {
                const element = tickerData1[index];
                const width = await getCprWidth(parseFloat(element.high), parseFloat(element.low), parseFloat(element.close));
                if(width >= 1000) {
                    extremelyNarrow.push({
                        stock: element.stock,
                        width: width
                    });
                }
                if(!(index % 10)) {
                    console.log(`completed ${index + 1} records`);
                }
            } catch(err) {
                console.log(err);
            }
        }
        
    } catch(err) {
        console.log(err);
    }
    return {
        extremelyNarrow: extremelyNarrow,
    };
}

async function generateCsv() {
    try {
        const {extremelyNarrow, narrow} = await getNarrowCprList();
        csvWriter1
            .writeRecords(extremelyNarrow)
            .then(() => {
                console.log('CSV 1 generated!')
            });
    } catch(err) {
        console.log(err);
    }
}

generateCsv();

module.exports = getCpr;