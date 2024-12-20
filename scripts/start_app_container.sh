docker stop valr-aave-arb;
docker remove valr-aave-arb;

docker run -d -p 3000:3000 \
    -e PORT=3000 \
    -e VALR_API_KEY= \
    -e VALR_API_SECRET= \
    -e VALR_LEND_RATE_METRIC_INTERVAL=5000 \
    -e VALR_ETH_PRICE_METRIC_INTERVAL=5000 \
    -e AAVE_METRICS_INTERVAL_MS=5000 \
    --name valr-aave-arb \
    valr-aave-arb:latest
