output "broker_ips" {
  description = "IPs de los brokers de Kafka"
  value       = google_compute_instance.kafka[*].network_interface[0].network_ip
}

output "broker_external_ips" {
  description = "IPs externas de los brokers"
  value       = google_compute_instance.kafka[*].network_interface[0].access_config[0].nat_ip
}

output "network_name" {
  description = "Nombre de la red"
  value       = google_compute_network.kafka.name
}

