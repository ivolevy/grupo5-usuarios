variable "project_name" {
  description = "Nombre del proyecto en Vercel"
  type        = string
}

variable "environment_variables" {
  description = "Variables de entorno para Vercel"
  type = map(object({
    value  = string
    target = list(string)
  }))
  default = {}
}

variable "git_repository" {
  description = "Repositorio Git asociado"
  type = object({
    type = string
    repo = string
  })
  default = null
}

variable "deployment_ref" {
  description = "Referencia de Git para el deployment"
  type        = string
  default     = "main"
}

variable "production" {
  description = "Si es un deployment de producción"
  type        = bool
  default     = true
}

