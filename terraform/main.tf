terraform {
  required_version = ">= 1.0"

  required_providers {
    # AWS Provider (para recursos de AWS si los necesitas)
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    # Vercel Provider (para gestionar recursos de Vercel)
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    # Google Cloud Provider (si usas GCP para Kafka u otros servicios)
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    # Azure Provider (si usas Azure)
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  # Backend configuration - descomenta y configura según tu necesidad
  # backend "s3" {
  #   bucket         = "tu-terraform-state-bucket"
  #   key            = "usuarios-app/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }

  # backend "gcs" {
  #   bucket = "tu-terraform-state-bucket"
  #   prefix = "usuarios-app/terraform.tfstate"
  # }
}

# Configuración del provider AWS
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "usuarios-app"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Configuración del provider Vercel
provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}

# Configuración del provider Google Cloud (si lo necesitas)
provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Configuración del provider Azure (si lo necesitas)
# provider "azurerm" {
#   features {}
#   subscription_id = var.azure_subscription_id
#   tenant_id       = var.azure_tenant_id
# }

