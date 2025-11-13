variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block para la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones para los brokers"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "kafka_version" {
  description = "Versión de Kafka"
  type        = string
  default     = "3.5.1"
}

variable "instance_type" {
  description = "Tipo de instancia para los brokers"
  type        = string
  default     = "kafka.m5.large"
}

variable "volume_size" {
  description = "Tamaño del volumen EBS en GB"
  type        = number
  default     = 100
}

variable "kms_key_id" {
  description = "KMS Key ID para encriptación (opcional)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}

