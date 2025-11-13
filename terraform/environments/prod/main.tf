# Configuración para el entorno de producción

module "vercel" {
  source = "../../modules/vercel"

  project_name = var.project_name
  
  environment_variables = {
    NEXT_PUBLIC_SUPABASE_URL = {
      value  = var.supabase_url
      target = ["production"]
    }
    NEXT_PUBLIC_SUPABASE_ANON_KEY = {
      value  = var.supabase_anon_key
      target = ["production"]
    }
    SUPABASE_SERVICE_ROLE_KEY = {
      value  = var.supabase_service_role_key
      target = ["production"]
    }
    JWT_SECRET = {
      value  = var.jwt_secret
      target = ["production"]
    }
    JWT_REFRESH_SECRET = {
      value  = var.jwt_refresh_secret
      target = ["production"]
    }
    KAFKA_BROKERS = {
      value  = join(",", var.kafka_brokers)
      target = ["production"]
    }
    KAFKA_CLIENT_ID = {
      value  = var.kafka_client_id
      target = ["production"]
    }
    RESEND_API_KEY = {
      value  = var.resend_api_key
      target = ["production"]
    }
    EMAIL_FROM = {
      value  = var.email_from
      target = ["production"]
    }
    EMAIL_FROM_NAME = {
      value  = var.email_from_name
      target = ["production"]
    }
    GMAIL_USER = {
      value  = var.gmail_user
      target = ["production"]
    }
    GMAIL_APP_PASSWORD = {
      value  = var.gmail_app_password
      target = ["production"]
    }
    EMAIL_HOST = {
      value  = var.email_host
      target = ["production"]
    }
    EMAIL_PORT = {
      value  = tostring(var.email_port)
      target = ["production"]
    }
    EMAIL_USER = {
      value  = var.email_user
      target = ["production"]
    }
    MAIL_PASSWORD = {
      value  = var.mail_password
      target = ["production"]
    }
    BCRYPT_SALT_ROUNDS = {
      value  = tostring(var.bcrypt_salt_rounds)
      target = ["production"]
    }
    NODE_ENV = {
      value  = "production"
      target = ["production"]
    }
  }

  git_repository = var.git_repository
  deployment_ref = "main"
  production     = true
}

# Kafka en AWS para producción (descomenta si lo necesitas)
# module "kafka_aws" {
#   source = "../../modules/kafka/aws"
# 
#   project_name       = var.project_name
#   availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
#   instance_type      = "kafka.m5.large"
#   volume_size        = 500
# 
#   tags = merge(var.common_tags, {
#     Environment = "prod"
#   })
# }

