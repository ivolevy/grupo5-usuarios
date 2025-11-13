variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
}

variable "broker_count" {
  description = "Número de brokers de Kafka"
  type        = number
  default     = 3
}

variable "machine_type" {
  description = "Tipo de máquina para los brokers"
  type        = string
  default     = "e2-standard-4"
}

variable "zones" {
  description = "Zonas de GCP para los brokers"
  type        = list(string)
  default     = ["us-central1-a", "us-central1-b", "us-central1-c"]
}

variable "image" {
  description = "Imagen de sistema operativo"
  type        = string
  default     = "ubuntu-os-cloud/ubuntu-2204-lts"
}

variable "disk_size" {
  description = "Tamaño del disco en GB"
  type        = number
  default     = 100
}

variable "subnet_cidr" {
  description = "CIDR de la subnet"
  type        = string
  default     = "10.0.0.0/24"
}

variable "region" {
  description = "Región de GCP"
  type        = string
  default     = "us-central1"
}

variable "labels" {
  description = "Labels para los recursos"
  type        = map(string)
  default     = {}
}

