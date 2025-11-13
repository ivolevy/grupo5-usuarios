output "cluster_arn" {
  description = "ARN del cluster de MSK"
  value       = aws_msk_cluster.kafka.arn
}

output "bootstrap_brokers" {
  description = "Brokers de bootstrap para conexión"
  value       = aws_msk_cluster.kafka.bootstrap_brokers
}

output "bootstrap_brokers_tls" {
  description = "Brokers de bootstrap con TLS"
  value       = aws_msk_cluster.kafka.bootstrap_brokers_tls
}

output "zookeeper_connect_string" {
  description = "String de conexión de Zookeeper"
  value       = aws_msk_cluster.kafka.zookeeper_connect_string
}

output "vpc_id" {
  description = "ID de la VPC"
  value       = aws_vpc.kafka.id
}

output "security_group_id" {
  description = "ID del security group"
  value       = aws_security_group.kafka.id
}

