import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { ChangeEvent, useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import indicators from 'highcharts/indicators/indicators-all.js';

indicators(Highcharts);

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

function App() {
  const [symbol, setSymbol] = useState('2603');
  const [from] = useState('2019-01-01');
  const [isAdjested, setIsAdjested] = useState(false);
  const [isBB, setIsBB] = useState(false);

  const tickerUrl = `/api/ticker/${symbol}`;
  const adjestedCandlesUrl = `/api/adjested/candles/${symbol}?from=${from}`;
  const originalCandlesUrl = `/api/original/candles/${symbol}?from=${from}`;

  const handleIsAdjestedChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIsAdjested(event.target.checked);
  };

  const handleIsBBChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIsBB(event.target.checked);
  };

  const getSeries = () => {
    const series = [
      {
        type: 'candlestick',
        id: 'ohlc',
        name: 'Stock Price',
        data: isAdjested ? adjestedCandlesMemo.ohlc : originalCandlesMemo.ohlc,
      },
      {
        type: 'column',
        id: 'volume',
        name: 'Volume',
        data: isAdjested
          ? adjestedCandlesMemo.volume
          : originalCandlesMemo.volume,
        yAxis: 1,
      },
    ];

    if (!isBB) return series;
    return [
      ...series,
      {
        type: 'bb',
        linkedTo: 'ohlc',
      },
    ];
  };

  const {
    data: ticker,
    error: tickerError,
    isLoading: tickerLoading,
    mutate: tickerMutate,
  } = useSWR(tickerUrl, fetcher);

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
        <button style={{ marginLeft: '8px'}} type="submit">submit</button>
      </form>
      <div
        style={{
          height: '70vh',
          width: '100vw',
          margin: 'auto',
        }}
      >
        <h3>
          {ticker?.name} ({symbol})
          {ticker?.exchange === 'TWSE' && <span style={{fontSize: '16px', marginLeft: '8px'}}>上市</span>}
          {ticker?.exchange === 'TPEx' && <span style={{fontSize: '16px', marginLeft: '8px'}}>上櫃</span>}
        </h3>

        <label>
          <input
            type="checkbox"
            checked={isAdjested}
            onChange={handleIsAdjestedChange}
          />
          還原股價
        </label>
        <label style={{ marginLeft: '8px'}}>
          <input type="checkbox" checked={isBB} onChange={handleIsBBChange} />
          布林通道
        </label>
        <HighchartsReact
          containerProps={{ style: { height: '100%' } }}
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={{
            ...templateOptions,
            series: getSeries(),
          }}
        />
      </div>
    </>
  );
}

export default App;
