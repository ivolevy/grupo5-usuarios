# Guía Rápida de Inicio - Terraform

Esta guía te ayudará a empezar rápidamente con Terraform en este proyecto.

## Paso 1: Instalar Terraform

### macOS
```bash
brew install terraform
```

### Linux
```bash
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### Windows
Descarga desde: https://www.terraform.io/downloads

## Paso 2: Configurar Credenciales

### Vercel
1. Ve a https://vercel.com/account/tokens
2. Crea un nuevo token
3. Guárdalo para usarlo en el siguiente paso

### AWS (si usas recursos de AWS)
```bash
aws configure
# O configura variables de entorno:
export AWS_ACCESS_KEY_ID="tu-access-key"
export AWS_SECRET_ACCESS_KEY="tu-secret-key"
```

### GCP (si usas recursos de GCP)
```bash
gcloud auth application-default login
```

## Paso 3: Configurar Variables

### Para Desarrollo
```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
# Edita terraform.tfvars con tus valores reales
```

### Para Producción
```bash
cd terraform/environments/prod
cp terraform.tfvars.example terraform.tfvars
# Edita terraform.tfvars con tus valores reales
```

## Paso 4: Inicializar Terraform

```bash
# Desde el directorio del entorno
cd terraform/environments/dev
terraform init
```

## Paso 5: Ver el Plan

```bash
terraform plan
```

Esto te mostrará qué recursos se crearán sin aplicarlos realmente.

## Paso 6: Aplicar Cambios

```bash
terraform apply
```

Terraform te pedirá confirmación. Escribe `yes` para proceder.

## Paso 7: Ver Outputs

```bash
terraform output
```

## Comandos Útiles con Make

Si tienes `make` instalado, puedes usar:

```bash
# Desarrollo
make dev-init    # Inicializar
make dev-plan    # Ver plan
make dev-apply   # Aplicar cambios

# Producción
make prod-init   # Inicializar
make prod-plan   # Ver plan
make prod-apply  # Aplicar cambios

# Utilidades
make validate    # Validar configuración
make fmt         # Formatear código
```

## Configurar Backend Remoto (Recomendado)

Para trabajar en equipo, configura un backend remoto:

### AWS S3
```bash
# Crear bucket y tabla DynamoDB
make init-backend BUCKET_NAME=mi-terraform-state REGION=us-east-1

# Luego edita backend.tf con los valores generados
```

### GCP
```bash
# Crear bucket manualmente
gsutil mb -p tu-proyecto gs://terraform-state-bucket

# Luego configura backend.tf
```

## Estructura de Archivos

```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf              # Configuración principal
│   │   ├── variables.tf         # Variables del entorno
│   │   └── terraform.tfvars     # Valores (no commiteado)
│   └── prod/
│       └── ...
├── modules/                      # Módulos reutilizables
│   ├── vercel/
│   └── kafka/
└── README.md                     # Documentación completa
```

## Troubleshooting

### Error: Provider not found
```bash
terraform init -upgrade
```

### Error: Backend configuration changed
```bash
terraform init -migrate-state
```

### Limpiar todo y empezar de nuevo
```bash
make clean
terraform init
```

## Próximos Pasos

1. Lee el [README.md](./README.md) completo para más detalles
2. Revisa los módulos disponibles en `modules/`
3. Personaliza la configuración según tus necesidades
4. Configura CI/CD para aplicar Terraform automáticamente

## Recursos

- [Documentación de Terraform](https://www.terraform.io/docs)
- [Provider de Vercel](https://registry.terraform.io/providers/vercel/vercel/latest/docs)
- [Provider de AWS](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

