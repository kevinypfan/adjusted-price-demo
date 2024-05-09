import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import indicators from 'highcharts/indicators/indicators-all.js';
import { title } from 'process';

indicators(Highcharts);

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

function App() {
  const [symbol, setSymbol] = useState('2603');
  const [from] = useState('2019-01-01');

  const adjestedCandlesUrl = `/api/adjested/candles/${symbol}?from=${from}`;
  const originalCandlesUrl = `/api/original/candles/${symbol}?from=${from}`;

  const {
    data: adjestedCandles,
    error: adjestedError,
    isLoading: adjestedLoading,
    mutate: adjestedMutate,
  } = useSWR(adjestedCandlesUrl, fetcher);
  const {
    data: originalCandles,
    error: originalError,
    isLoading: originalLoading,
    mutate: originalMutate,
  } = useSWR(originalCandlesUrl, fetcher);

  const adjestedCandlesMemo = useMemo<any>(() => {
    if (!adjestedCandles) return [];
    const copiedCandles = adjestedCandles.map((obj: any) => ({ ...obj }));
    const dataLength = copiedCandles.length;

    const ohlc = [];
    const volume = [];

    for (let i = 0; i < dataLength; i += 1) {
      ohlc.push([
        new Date(copiedCandles[i]['date']).valueOf(), // the date
        copiedCandles[i]['open'], // open
        copiedCandles[i]['high'], // high
        copiedCandles[i]['low'], // low
        copiedCandles[i]['close'], // close
      ]);

      volume.push([
        new Date(copiedCandles[i]['date']).valueOf(), // the date
        copiedCandles[i]['volume'], // the volume
      ]);
    }

    return { ohlc, volume };
  }, [adjestedCandles]);

  const originalCandlesMemo = useMemo<any>(() => {
    if (!originalCandles) return [];
    const copiedCandles = originalCandles.map((obj: any) => ({ ...obj }));
    const dataLength = copiedCandles.length;

    const ohlc = [];
    const volume = [];

    for (let i = 0; i < dataLength; i += 1) {
      ohlc.push([
        new Date(copiedCandles[i]['date']).valueOf(), // the date
        copiedCandles[i]['open'], // open
        copiedCandles[i]['high'], // high
        copiedCandles[i]['low'], // low
        copiedCandles[i]['close'], // close
      ]);

      volume.push([
        new Date(copiedCandles[i]['date']).valueOf(), // the date
        copiedCandles[i]['volume'], // the volume
      ]);
    }

    return { ohlc, volume };
  }, [originalCandles]);

  const submitHandler = (e: any) => {
    e.preventDefault();
    setSymbol(e.target.symbol.value);
    // setFrom(e.target.from.value);
  };

  const templateOptions: Highcharts.Options = {
    plotOptions: {
      candlestick: {
        color: 'green',
        upColor: 'red',
      },
    },
    yAxis: [
      {
        labels: {
          align: 'left',
        },
        height: '80%',
        resize: {
          enabled: true,
        },
      },
      {
        labels: {
          align: 'left',
        },
        top: '80%',
        height: '20%',
        offset: 0,
      },
    ],
    tooltip: {
      headerShape: 'callout',
      borderWidth: 0,
      shadow: false,
      positioner: function (width, height, point) {
        const chart = this.chart;
        let position;

        if (point.isHeader) {
          position = {
            x: Math.max(
              // Left side limit
              chart.plotLeft,
              Math.min(
                point.plotX + chart.plotLeft - width / 2,
                // Right side limit
                chart.chartWidth - width
              )
            ),
            y: point.plotY,
          };
        } else {
          position = {
            x: point.series.chart.plotLeft,
            y: chart.plotTop,
          };
        }

        return position;
      },
    },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 800,
          },
          chartOptions: {
            rangeSelector: {
              inputEnabled: false,
            },
          },
        },
      ],
    },
  };

  if (adjestedLoading) return <div>loading...</div>;

  return (
    <>
      <form onSubmit={submitHandler}>
        <label htmlFor="symbol">symbol: </label>
        <input type="text" name="symbol" />
        {/* <input type="date" name="from" /> */}
        <button type="submit">submit</button>
      </form>
      <div
        style={{
          height: '50vh',
          width: '100vw',
          margin: 'auto',
        }}
      >
        <h3>symbol: {symbol}</h3>
        <HighchartsReact
          containerProps={{ style: { height: '100%' } }}
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={{
            ...templateOptions,
            title: {
              text: "original"
            },
            series: [
              {
                type: 'candlestick',
                id: 'ohlc',
                name: 'Stock Price',
                data: originalCandlesMemo.ohlc,
              },
              {
                type: 'column',
                id: 'volume',
                name: 'Volume',
                data: originalCandlesMemo.volume,
                yAxis: 1,
              },
              {
                type: 'bb',
                linkedTo: 'ohlc',
              },
            ],
          }}
        />
      </div>
      <div
        style={{
          height: '50vh',
          width: '100vw',
          margin: 'auto',
        }}
      >
        <h3>symbol: {symbol}</h3>
        <HighchartsReact
          containerProps={{ style: { height: '100%' } }}
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={{
            ...templateOptions,
            title: {
              text: 'adjected'
            },
            series: [
              {
                type: 'candlestick',
                id: 'ohlc',
                name: 'Stock Price',
                data: adjestedCandlesMemo.ohlc,
              },
              {
                type: 'column',
                id: 'volume',
                name: 'Volume',
                data: adjestedCandlesMemo.volume,
                yAxis: 1,
              },
              {
                type: 'bb',
                linkedTo: 'ohlc',
              },
            ],
          }}
        />
      </div>
    </>
  );
}

export default App;
