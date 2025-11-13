# Variables generales
variable "environment" {
  description = "Entorno de despliegue (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "usuarios-app"
}

# Variables de AWS
variable "aws_region" {
  description = "Región de AWS"
  type        = string
  default     = "us-east-1"
}

# Variables de Vercel
variable "vercel_api_token" {
  description = "Token de API de Vercel"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "ID del equipo de Vercel"
  type        = string
  default     = ""
}

# Variables de GCP
variable "gcp_project_id" {
  description = "ID del proyecto de GCP"
  type        = string
  default     = ""
}

variable "gcp_region" {
  description = "Región de GCP"
  type        = string
  default     = "us-central1"
}

# Variables de Azure
variable "azure_subscription_id" {
  description = "ID de suscripción de Azure"
  type        = string
  default     = ""
  sensitive   = true
}

variable "azure_tenant_id" {
  description = "ID del tenant de Azure"
  type        = string
  default     = ""
  sensitive   = true
}

# Variables de Kafka
variable "kafka_brokers" {
  description = "Lista de brokers de Kafka"
  type        = list(string)
  default     = ["34.172.179.60:9094"]
}

variable "kafka_client_id" {
  description = "Client ID de Kafka"
  type        = string
  default     = "grupo5-usuarios-app"
}

# Variables de Supabase
variable "supabase_url" {
  description = "URL de Supabase"
  type        = string
  sensitive   = true
}

variable "supabase_anon_key" {
  description = "Anon key de Supabase"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Service role key de Supabase"
  type        = string
  sensitive   = true
}

# Variables de Email
variable "resend_api_key" {
  description = "API Key de Resend"
  type        = string
  sensitive   = true
  default     = ""
}

variable "gmail_user" {
  description = "Usuario de Gmail"
  type        = string
  sensitive   = true
  default     = ""
}

variable "gmail_app_password" {
  description = "App password de Gmail"
  type        = string
  sensitive   = true
  default     = ""
}

# Variables de JWT
variable "jwt_secret" {
  description = "Secret para JWT"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "Secret para JWT Refresh"
  type        = string
  sensitive   = true
}

# Variables de Email Configuration
variable "email_from" {
  description = "Email remitente"
  type        = string
  default     = "noreply@sky-track.com"
}

variable "email_from_name" {
  description = "Nombre del remitente"
  type        = string
  default     = "SkyTrack"
}

variable "email_host" {
  description = "Host del servidor de email"
  type        = string
  default     = ""
}

variable "email_port" {
  description = "Puerto del servidor de email"
  type        = number
  default     = 587
}

variable "email_user" {
  description = "Usuario del servidor de email"
  type        = string
  sensitive   = true
  default     = ""
}

variable "mail_password" {
  description = "Contraseña del servidor de email"
  type        = string
  sensitive   = true
  default     = ""
}

variable "bcrypt_salt_rounds" {
  description = "Rondas de salt para bcrypt"
  type        = number
  default     = 10
}

# Variables de tags comunes
variable "common_tags" {
  description = "Tags comunes para todos los recursos"
  type        = map(string)
  default = {
    Project     = "usuarios-app"
    ManagedBy   = "terraform"
    Environment = "dev"
  }
}

