docker stop grafana;
docker remove grafana;

docker run -d \
  --env=PATH=/usr/share/grafana/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  --env=GF_PATHS_CONFIG=/etc/grafana/grafana.ini \
  --env=GF_PATHS_DATA=/var/lib/grafana \
  --env=GF_PATHS_HOME=/usr/share/grafana \
  --env=GF_PATHS_LOGS=/var/log/grafana \
  --env=GF_PATHS_PLUGINS=/var/lib/grafana/plugins \
  --env=GF_PATHS_PROVISIONING=/etc/grafana/provisioning \
  --network=bridge \
  --workdir=/usr/share/grafana \
  --restart=no \
  --label='maintainer=Grafana Labs <hello@grafana.com>' \
  --runtime=runc \
  --mount source=grafana,target=/var/lib/grafana \
  -p 8001:3000 \
  --name=grafana \
  grafana/grafana:latest
