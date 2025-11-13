# Outputs de Vercel
output "vercel_project_id" {
  description = "ID del proyecto de Vercel"
  value       = try(vercel_project.main.id, null)
}

output "vercel_project_url" {
  description = "URL del proyecto de Vercel"
  value       = try(vercel_project.main.production_deployment_host, null)
}

# Outputs de AWS (si usas recursos de AWS)
output "aws_kafka_brokers" {
  description = "Brokers de Kafka en AWS"
  value       = try(aws_msk_cluster.kafka.bootstrap_brokers, null)
}

# Outputs de GCP (si usas recursos de GCP)
output "gcp_kafka_brokers" {
  description = "Brokers de Kafka en GCP"
  value       = try(google_compute_instance.kafka[*].network_interface[0].network_ip, null)
}

# Outputs de configuración
output "environment" {
  description = "Entorno actual"
  value       = var.environment
}

output "project_name" {
  description = "Nombre del proyecto"
  value       = var.project_name
}

