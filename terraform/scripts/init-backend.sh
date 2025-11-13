#!/bin/bash
# Script para inicializar el backend de Terraform en AWS S3

set -e

BUCKET_NAME=${1:-"terraform-state-bucket-usuarios-app"}
REGION=${2:-"us-east-1"}
DYNAMODB_TABLE=${3:-"terraform-state-lock"}

echo "🚀 Inicializando backend de Terraform en AWS S3..."

# Verificar que AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI no está instalado. Por favor instálalo primero."
    exit 1
fi

# Crear bucket S3 para el estado
echo "📦 Creando bucket S3: $BUCKET_NAME"
aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" || \
    echo "⚠️  El bucket ya existe o hay un error"

# Habilitar versionado
echo "🔄 Habilitando versionado en el bucket..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

# Habilitar encriptación
echo "🔐 Habilitando encriptación..."
aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'

# Bloquear acceso público
echo "🔒 Bloqueando acceso público..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Crear tabla DynamoDB para locking
echo "🔐 Creando tabla DynamoDB para locking: $DYNAMODB_TABLE"
aws dynamodb create-table \
    --table-name "$DYNAMODB_TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION" || \
    echo "⚠️  La tabla ya existe o hay un error"

echo "✅ Backend inicializado correctamente!"
echo ""
echo "📝 Configura tu backend.tf con:"
echo "backend \"s3\" {"
echo "  bucket         = \"$BUCKET_NAME\""
echo "  key            = \"usuarios-app/terraform.tfstate\""
echo "  region         = \"$REGION\""
echo "  encrypt        = true"
echo "  dynamodb_table = \"$DYNAMODB_TABLE\""
echo "}"

