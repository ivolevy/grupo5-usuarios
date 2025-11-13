.PHONY: help init plan apply destroy validate fmt clean dev-init dev-plan dev-apply dev-destroy prod-init prod-plan prod-apply prod-destroy

help: ## Mostrar esta ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Comandos generales
init: ## Inicializar Terraform
	terraform init

plan: ## Planificar cambios
	terraform plan

apply: ## Aplicar cambios
	terraform apply

destroy: ## Destruir infraestructura
	terraform destroy

validate: ## Validar configuración
	terraform validate

fmt: ## Formatear código Terraform
	terraform fmt -recursive

clean: ## Limpiar archivos de Terraform
	rm -rf .terraform .terraform.lock.hcl terraform.tfstate* .terraform.tfstate*

# Comandos para desarrollo
dev-init: ## Inicializar entorno de desarrollo
	cd environments/dev && terraform init

dev-plan: ## Planificar cambios en desarrollo
	cd environments/dev && terraform plan

dev-apply: ## Aplicar cambios en desarrollo
	cd environments/dev && terraform apply

dev-destroy: ## Destruir entorno de desarrollo
	cd environments/dev && terraform destroy

# Comandos para producción
prod-init: ## Inicializar entorno de producción
	cd environments/prod && terraform init

prod-plan: ## Planificar cambios en producción
	cd environments/prod && terraform plan

prod-apply: ## Aplicar cambios en producción
	cd environments/prod && terraform apply

prod-destroy: ## Destruir entorno de producción
	cd environments/prod && terraform destroy

# Backend
init-backend: ## Inicializar backend S3 (requiere BUCKET_NAME, REGION, DYNAMODB_TABLE)
	@if [ -z "$(BUCKET_NAME)" ]; then \
		echo "❌ BUCKET_NAME es requerido. Uso: make init-backend BUCKET_NAME=mi-bucket"; \
		exit 1; \
	fi
	./scripts/init-backend.sh $(BUCKET_NAME) $(REGION) $(DYNAMODB_TABLE)

