variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "usuarios-app"
}

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

variable "kafka_brokers" {
  description = "Lista de brokers de Kafka"
  type        = list(string)
}

variable "kafka_client_id" {
  description = "Client ID de Kafka"
  type        = string
  default     = "grupo5-usuarios-app"
}

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

variable "git_repository" {
  description = "Repositorio Git"
  type = object({
    type = string
    repo = string
  })
  default = null
}

variable "common_tags" {
  description = "Tags comunes"
  type        = map(string)
  default     = {}
}

