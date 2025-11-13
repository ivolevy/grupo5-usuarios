output "project_id" {
  description = "ID del proyecto de Vercel"
  value       = vercel_project.main.id
}

output "project_url" {
  description = "URL del proyecto"
  value       = vercel_project.main.production_deployment_host
}

output "deployment_id" {
  description = "ID del deployment"
  value       = vercel_deployment.main.id
}

