# Terraform Infrastructure as Code

Este directorio contiene la configuración de Terraform para gestionar la infraestructura del proyecto Usuarios App.

## Estructura

```
terraform/
├── main.tf                    # Configuración principal y providers
├── variables.tf               # Variables globales
├── outputs.tf                # Outputs globales
├── modules/                   # Módulos reutilizables
│   ├── vercel/               # Módulo para Vercel
│   └── kafka/                # Módulos para Kafka
│       ├── aws/              # Kafka en AWS MSK
│       └── gcp/              # Kafka en GCP
└── environments/             # Configuraciones por entorno
    ├── dev/                  # Desarrollo
    └── prod/                 # Producción
```

## Requisitos Previos

1. **Instalar Terraform**: [https://www.terraform.io/downloads](https://www.terraform.io/downloads)
   ```bash
   # macOS
   brew install terraform
   
   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **Configurar credenciales**:
   - **AWS**: Configura `aws configure` o variables de entorno `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`
   - **Vercel**: Obtén tu API token de [Vercel Settings](https://vercel.com/account/tokens)
   - **GCP**: Configura `gcloud auth application-default login`

## Uso Rápido

### 1. Configurar Variables

Copia el archivo de ejemplo y completa los valores:

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
# Edita terraform.tfvars con tus valores
```

### 2. Inicializar Terraform

```bash
terraform init
```

### 3. Planificar Cambios

```bash
terraform plan
```

### 4. Aplicar Cambios

```bash
terraform apply
```

### 5. Destruir Recursos (¡Cuidado!)

```bash
terraform destroy
```

## Configuración por Entorno

### Desarrollo

```bash
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

### Producción

```bash
cd terraform/environments/prod
terraform init
terraform plan
terraform apply
```

## Módulos Disponibles

### Módulo Vercel

Gestiona el proyecto y deployment en Vercel:

```hcl
module "vercel" {
  source = "../../modules/vercel"
  
  project_name = "usuarios-app"
  environment_variables = {
    NEXT_PUBLIC_SUPABASE_URL = {
      value  = "https://..."
      target = ["production"]
    }
  }
}
```

### Módulo Kafka AWS

Crea un cluster de Kafka usando AWS MSK:

```hcl
module "kafka_aws" {
  source = "../../modules/kafka/aws"
  
  project_name       = "usuarios-app"
  availability_zones = ["us-east-1a", "us-east-1b"]
  instance_type      = "kafka.m5.large"
}
```

### Módulo Kafka GCP

Crea instancias de Kafka en GCP:

```hcl
module "kafka_gcp" {
  source = "../../modules/kafka/gcp"
  
  project_name = "usuarios-app"
  broker_count = 3
}
```

## Backend de Estado

Para trabajar en equipo, configura un backend remoto. Descomenta y configura en `main.tf`:

### AWS S3 Backend

```hcl
backend "s3" {
  bucket         = "tu-terraform-state-bucket"
  key            = "usuarios-app/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-state-lock"
}
```

### GCP Backend

```hcl
backend "gcs" {
  bucket = "tu-terraform-state-bucket"
  prefix = "usuarios-app/terraform.tfstate"
}
```

## Variables de Entorno

Puedes usar variables de entorno en lugar de archivos `.tfvars`:

```bash
export TF_VAR_vercel_api_token="tu-token"
export TF_VAR_supabase_url="https://..."
```

## Comandos Útiles

```bash
# Validar configuración
terraform validate

# Formatear código
terraform fmt -recursive

# Ver outputs
terraform output

# Ver estado
terraform show

# Refrescar estado
terraform refresh
```

## Mejores Prácticas

1. **Nunca commitees `.tfvars`** con valores sensibles
2. **Usa backend remoto** para el estado de Terraform
3. **Revisa siempre el plan** antes de aplicar
4. **Usa workspaces** para múltiples entornos si prefieres
5. **Versiona tu código** de Terraform en Git
6. **Usa módulos** para código reutilizable
7. **Documenta** tus recursos y variables

## Troubleshooting

### Error: Provider not found
```bash
terraform init -upgrade
```

### Error: Backend configuration changed
```bash
terraform init -migrate-state
```

### Limpiar caché
```bash
rm -rf .terraform
terraform init
```

## Recursos Adicionales

- [Documentación de Terraform](https://www.terraform.io/docs)
- [Provider de Vercel](https://registry.terraform.io/providers/vercel/vercel/latest/docs)
- [Provider de AWS](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Provider de GCP](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

