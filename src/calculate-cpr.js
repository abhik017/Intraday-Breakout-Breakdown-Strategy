function calcCpr(high, low, close) {
    const pivot = (high + low + close)/3;
    const bc = (high + low)/2;
    const tc = pivot - bc + pivot;
    return {
        pivot: pivot,
        bc: bc,
        tc: tc
    } 
}

module.exports = calcCpr;