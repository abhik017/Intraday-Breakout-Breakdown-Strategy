const path = require('path');
const fs = require('fs');
const parse = require('csv-parse');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const calcCpr = require('./calculate-cpr')
const csvWriter1 = createCsvWriter({
    path: '../extemely-narrow-cpr.csv',
    header: [
      {id: 'stock', title: 'Name'},
    //   {id: 'width', title: 'Priority'}
    ]
});
const csvWriter2 = createCsvWriter({
    path: '../moderately-narrow-cpr.csv',
    header: [
        {id: 'stock', title: 'Name'},
        // {id: 'width', title: 'Priority'}
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
    // if(delta === 0) return 1000000;
    // return close/delta; -> This method is being used on chartink screeners!
    return (delta/pivot) * 100; // -> this method is used in cpr width indicator in tradingview
}

async function getNarrowCprList() {
    const extremelyNarrow = [], narrow = [];
    try {
        const tickerData1 = await tickerData;
        for(let index = 0; index < tickerData1.length; index++) {
            try {
                const element = tickerData1[index];
                const width = await getCprWidth(parseFloat(element.high), parseFloat(element.low), parseFloat(element.close));
                if(width <= 0.25) {
                    extremelyNarrow.push({
                        stock: `NSE:${element.stock},`, // storing it in this way, so that by copying the column in excel and pasting it in notepad and saving it we can directly import list in tradingview!
                        width: parseFloat(width)
                    });
                } else if(width <= 0.5) {
                    narrow.push({
                        stock: `NSE:${element.stock},`, // storing it in this way, so that by copying the column in excel and pasting it in notepad and saving it we can directly import list in tradingview!
                        width: parseFloat(width),
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
        narrow: narrow,
    };
}

async function generateCsv() {
    try {
        const {extremelyNarrow, narrow} = await getNarrowCprList();
        extremelyNarrow.sort((a,b) => {
            return ( a.width > b.width ? 1 : -1 ); // sorting the excel on the basis of width!
        });
        narrow.sort((a,b) => {
            return ( a.width > b.width ? 1 : -1 ); // sorting the excel on the basis of width!
        });
        csvWriter1
            .writeRecords(extremelyNarrow)
            .then(() => {
                console.log('CSV 1 generated!')
            });
        csvWriter2
            .writeRecords(narrow)
            .then(() => {
                console.log('CSV 2 generated!');
            });
    } catch(err) {
        console.log(err);
    }
}

generateCsv();

// module.exports = getCpr;