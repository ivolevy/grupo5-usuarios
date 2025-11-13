# Configuración para el entorno de desarrollo

module "vercel" {
  source = "../../modules/vercel"

  project_name = "${var.project_name}-dev"
  
  environment_variables = {
    NEXT_PUBLIC_SUPABASE_URL = {
      value  = var.supabase_url
      target = ["production", "preview", "development"]
    }
    NEXT_PUBLIC_SUPABASE_ANON_KEY = {
      value  = var.supabase_anon_key
      target = ["production", "preview", "development"]
    }
    SUPABASE_SERVICE_ROLE_KEY = {
      value  = var.supabase_service_role_key
      target = ["production", "preview", "development"]
    }
    JWT_SECRET = {
      value  = var.jwt_secret
      target = ["production", "preview", "development"]
    }
    JWT_REFRESH_SECRET = {
      value  = var.jwt_refresh_secret
      target = ["production", "preview", "development"]
    }
    KAFKA_BROKERS = {
      value  = join(",", var.kafka_brokers)
      target = ["production", "preview", "development"]
    }
    KAFKA_CLIENT_ID = {
      value  = var.kafka_client_id
      target = ["production", "preview", "development"]
    }
    RESEND_API_KEY = {
      value  = var.resend_api_key
      target = ["production", "preview", "development"]
    }
    EMAIL_FROM = {
      value  = var.email_from
      target = ["production", "preview", "development"]
    }
    EMAIL_FROM_NAME = {
      value  = var.email_from_name
      target = ["production", "preview", "development"]
    }
    NODE_ENV = {
      value  = "development"
      target = ["production", "preview", "development"]
    }
  }

  git_repository = var.git_repository
  deployment_ref = "main"
  production     = false
}

# Si necesitas Kafka en AWS para dev (descomenta si lo necesitas)
# module "kafka_aws" {
#   source = "../../modules/kafka/aws"
# 
#   project_name      = "${var.project_name}-dev"
#   availability_zones = ["us-east-1a", "us-east-1b"]
#   instance_type     = "kafka.t3.small"  # Más pequeño para dev
#   volume_size       = 50
# 
#   tags = merge(var.common_tags, {
#     Environment = "dev"
#   })
# }

