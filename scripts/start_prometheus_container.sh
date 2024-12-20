docker stop prometheus;
docker remove prometheus;

docker run \
  --env=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  --volume=/prometheus \
  --network=bridge \
  --workdir=/prometheus \
  --restart=no \
  --label='maintainer=The Prometheus Authors <prometheus-developers@googlegroups.com>' \
  --runtime=runc \
  -d \
  --name prometheus \
  --mount source=prometheus,target=/prometheus \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  -p 9090:9090 \
  prom/prometheus:latest
