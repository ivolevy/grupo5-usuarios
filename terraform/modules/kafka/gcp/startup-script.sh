#!/bin/bash
# Startup script para instalar y configurar Kafka en GCP

set -e

BROKER_ID=${broker_id}
KAFKA_VERSION="3.5.1"
KAFKA_HOME="/opt/kafka"
KAFKA_USER="kafka"

# Actualizar sistema
apt-get update
apt-get install -y openjdk-17-jdk wget curl

# Crear usuario de Kafka
useradd -r -s /bin/false $KAFKA_USER || true

# Descargar Kafka
cd /opt
wget "https://downloads.apache.org/kafka/${KAFKA_VERSION}/kafka_2.13-${KAFKA_VERSION}.tgz"
tar -xzf "kafka_2.13-${KAFKA_VERSION}.tgz"
mv "kafka_2.13-${KAFKA_VERSION}" kafka
chown -R $KAFKA_USER:$KAFKA_USER $KAFKA_HOME

# Configurar Kafka
cat > $KAFKA_HOME/config/server.properties <<EOF
broker.id=$BROKER_ID
listeners=PLAINTEXT://0.0.0.0:9092
advertised.listeners=PLAINTEXT://$(hostname -I | awk '{print $1}'):9092
num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
log.dirs=/var/kafka-logs
num.partitions=1
num.recovery.threads.per.data.dir=1
offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000
zookeeper.connect=localhost:2181
zookeeper.connection.timeout.ms=18000
group.initial.rebalance.delay.ms=0
EOF

# Crear directorio de logs
mkdir -p /var/kafka-logs
chown -R $KAFKA_USER:$KAFKA_USER /var/kafka-logs

# Instalar Zookeeper (requerido para Kafka)
apt-get install -y zookeeperd

# Crear servicio systemd para Kafka
cat > /etc/systemd/system/kafka.service <<EOF
[Unit]
Description=Apache Kafka Server
After=network.target zookeeper.service

[Service]
Type=simple
User=$KAFKA_USER
Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
ExecStart=$KAFKA_HOME/bin/kafka-server-start.sh $KAFKA_HOME/config/server.properties
ExecStop=$KAFKA_HOME/bin/kafka-server-stop.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Habilitar y iniciar servicios
systemctl daemon-reload
systemctl enable zookeeper
systemctl start zookeeper
systemctl enable kafka
systemctl start kafka

# Verificar estado
sleep 10
systemctl status kafka --no-pager || true

