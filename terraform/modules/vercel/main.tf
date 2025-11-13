# Módulo de Vercel para gestionar el proyecto y deployment

resource "vercel_project" "main" {
  name      = var.project_name
  framework = "nextjs"

  # Configuración de build
  build_command   = "npm run build"
  output_directory = ".next"
  install_command  = "npm ci"

  # Variables de entorno
  dynamic "environment" {
    for_each = var.environment_variables
    content {
      key    = environment.key
      value  = environment.value.value
      target = environment.value.target
    }
  }

  # Git configuration
  git_repository = var.git_repository
}

resource "vercel_deployment" "main" {
  project_id = vercel_project.main.id
  ref        = var.deployment_ref
  production = var.production
}

