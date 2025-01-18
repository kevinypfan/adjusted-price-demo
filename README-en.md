# Practical Guide to Adjusted Stock Prices: Calculating Historical Prices and Demystifying Market Gaps

Having a robust trading strategy is undeniably a key to success in stock market investment. Unfortunately, raw stock price charts often exhibit discontinuous gaps due to corporate actions such as dividends, stock splits, or capital reductions, which severely distort technical analysis indicators. For example, moving averages may fail to accurately reflect actual price trends.

To address this, we must calculate the "adjusted stock price" from scratch, eliminating these non-trading disruptions to restore the actual cost changes of stocks. But how can we correctly calculate adjusted stock prices?

This article will walk you through the calculation process step by step. By obtaining essential data on dividends, capital reductions, and denomination changes, and applying appropriate adjustment formulas, you can automate the restoration of historical stock prices for technical analysis.

Whether you're an experienced algorithmic trader or a beginner investor, understanding the concept and practice of adjusted stock prices will empower your strategy analysis, giving you deeper insights and higher returns.

## Introduction

Stock price trends often show significant differences between raw and adjusted daily data due to the following three factors:

1. Dividends
2. Capital Reductions
3. Denomination Changes

For instance, suppose a stock distributes a cash dividend of $5 per share. The ex-dividend date would directly reduce the stock price by $5. Without using adjusted price charts, the raw price chart would show discontinuous gaps. For investors unaware of the ex-dividend situation, this might lead to misinterpretations of a price drop. Adjusted stock prices remove these non-trading factors, maintaining the accuracy of metrics like moving averages.

## Scope of Application

This project currently supports adjusted stock price calculations for listed stocks affected by dividends and capital reductions. Support for OTC stocks will be added in the future.

## Calculation Steps

1. **Obtain Dividend Data and Calculate Adjustment Factors**  
   Source: [TWSE Dividend Adjustment Table](https://wwwc.twse.com.tw/zh/announcement/ex-right/twt49u.html)

   - Calculate `Dividend Factor` = 1 - `Cash Dividend per Share` / `Closing Price Before Ex-Dividend`
   - Calculate `Stock Factor` = 1 / (1 + `Bonus Shares Ratio per 1,000 Shares` / 1,000)

   Example: **Evergreen (2603)** in 2023

   | Date   | Closing Price | Adjustment Calculation                  | Adjusted Closing Price |
   |--------|---------------|-----------------------------------------|-------------------------|
   | 7/3    | 102.5         | Latest price not adjusted (baseline)   | 102.5                  |
   | 6/30   | 93.5          | Dividend Factor: 1 - 70 / 155 = 0.5483 | 93.5                   |
   | 6/29   | 155           | 155 × 0.5483                           | 84.98                  |
   | 6/28   | 157.5         | 157.5 × 0.5483                         | 86.35                  |
   | 6/27   | 161           | 161 × 0.5483                           | 88.27                  |

   Example: **E.SUN Bank (2884)** in 2023

   | Date   | Closing Price | Adjustment Calculation                                                                  | Adjusted Closing Price |
   |--------|---------------|-----------------------------------------------------------------------------------------|-------------------------|
   | 7/28   | 25.95         | Latest price not adjusted (baseline)                                                   | 25.95                  |
   | 7/27   | 26            | Dividend Factor: 1 - 0.189386 / 26.95 = 0.9929, Stock Factor: 1 / (1 + 37.9 / 1,000) = 0.9634 | 26                   |
   | 6/26   | 26.95         | 26.95 × 0.9929 × 0.9634                                                                | 25.78                  |
   | 6/25   | 26.55         | 26.55 × 0.9929 × 0.9634                                                                | 25.40                  |
   | 6/24   | 26.25         | 26.25 × 0.9929 × 0.9634                                                                | 25.11                  |

2. **Obtain Capital Reduction Data and Calculate Adjustment Factors**  
   Source: [TWSE Capital Reduction Reference Price Table](https://www.twse.com.tw/zh/announcement/reduction/twtauu.html)

   - Calculate `Capital Reduction Factor` = 1 - (`Closing Price Before Trading Suspension` - `Reference Price on Resumption`) / `Closing Price Before Trading Suspension`

3. **Obtain Denomination Change Data and Calculate Adjustment Factors**  
   Source: [TWSE Denomination Change Reference Price Table](https://www.twse.com.tw/pcversion/zh/page/trading/exchange/TWTB8U.html)

   - Calculate `Denomination Change Factor` = 1 - (`Closing Price Before Suspension` - `Reference Price on Resumption`) / `Closing Price Before Suspension`

4. **Retrieve Raw Historical Stock Price Data via Fugle API**  
   Source: [Fugle API Documentation](https://developer.fugle.tw/docs/data/http-api/historical/candles)

5. **Apply Adjustment Factors to Pre-adjustment Prices**  
   Multiply price data for dates earlier than the dividend, capital reduction, or denomination change by the corresponding factors to derive adjusted stock prices.

## Conclusion

Adjusted stock prices play a crucial role in algorithmic trading by offering the following advantages:

1. **More Accurate Technical Analysis**  
   Adjusted prices eliminate anomalies caused by dividends, capital reductions, or denomination changes, enhancing the accuracy of technical indicators. For example, moving averages calculated without adjustments may misrepresent trends due to gaps.

2. **Better Trading Strategies**  
   Technical analysis based on adjusted prices enables traders to develop more rational strategies, better grasp price movements, and improve win rates and profitability.

3. **Improved Risk Management**  
   Adjusted prices help traders assess risks more accurately, avoiding errors caused by unadjusted price anomalies.

Overall, adjusted stock prices help algorithmic traders better understand and analyze price trends, enabling the formulation of more effective strategies to improve trading success and profitability.

Below is a comparison chart of **Evergreen (2603)** showing adjusted and unadjusted prices with Bollinger Bands. The adjusted chart displays smoother price movements, more accurately reflecting actual price changes.

![plot](./assets/adjustment-comparison.png)

## Getting Started

- Install dependencies:

```bash
npm install
```

### Backend Environment Variables

- Add your Fugle API Key to `apps/backend/.env`:

```env
TZ="Asia/Taipei"
FUGLE_API_KEY=""
```

### Run the Application

```bash
npx nx run-many --target=serve --projects=backend,frontend
```

Visit http://localhost:4200 to view the comparison charts.

## Project Structure

1. `backend/src/twse-scraper.service.ts`: Scrapes dividend, capital reduction, and denomination change data.
2. `backend/src/fugle-api.service.ts`: Fetches stock price data using Fugle API.
3. `backend/src/aggregator.service.ts`:
   - `getAdjustedRates`: Converts dividends, capital reductions, and denomination changes into adjustment factors.
   - `getAdjustedCandles`: Fully adjusts OHLC candles.
4. `backend/src/app.controller.ts`: Provides RESTful API for external access.
5. `frontend/**`: A simple React demo interface using [Highcharts Stock](https://www.highcharts.com/docs/stock/getting-started-stock) for rendering charts.

