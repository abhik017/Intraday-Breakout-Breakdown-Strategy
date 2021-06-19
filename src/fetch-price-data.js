const axios = require('axios');

const fetchStockData = async(stock) => {
    try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${stock}.NS`);
        const ohlcData = response.data.chart.result[0].indicators.quote[0];
        return ohlcData;
    } catch (err) {
        console.log(err);
        return {
            close: [100000],
            open: [0]
        }
    }
}

module.exports = fetchStockData;

// response RANGE - 1 day
// -> data
// -> chart
// -> result = array
// -> [0]
// -> meta, timestamp, indicators
// -> quote = array
// -> [0]
// -> open, close, high, low of 1 minute candles
// ex: response.data.chart.result[0].indicators.quote[0].close
