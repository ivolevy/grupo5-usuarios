# Módulo de Kafka en AWS usando MSK (Managed Streaming for Apache Kafka)

# VPC para Kafka
resource "aws_vpc" "kafka" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-kafka-vpc"
  })
}

# Subnets para Kafka (MSK requiere al menos 2 AZs)
resource "aws_subnet" "kafka" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.kafka.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.project_name}-kafka-subnet-${count.index + 1}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "kafka" {
  vpc_id = aws_vpc.kafka.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-kafka-igw"
  })
}

# Route Table
resource "aws_route_table" "kafka" {
  vpc_id = aws_vpc.kafka.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.kafka.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-kafka-rt"
  })
}

# Route Table Associations
resource "aws_route_table_association" "kafka" {
  count          = length(aws_subnet.kafka)
  subnet_id      = aws_subnet.kafka[count.index].id
  route_table_id = aws_route_table.kafka.id
}

# Security Group para MSK
resource "aws_security_group" "kafka" {
  name        = "${var.project_name}-kafka-sg"
  description = "Security group para MSK Kafka"
  vpc_id      = aws_vpc.kafka.id

  ingress {
    description = "Kafka Broker"
    from_port   = 9092
    to_port     = 9098
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-kafka-sg"
  })
}

# MSK Cluster
resource "aws_msk_cluster" "kafka" {
  cluster_name           = "${var.project_name}-kafka-cluster"
  kafka_version          = var.kafka_version
  number_of_broker_nodes = length(var.availability_zones)

  broker_node_group_info {
    instance_type   = var.instance_type
    client_subnets  = aws_subnet.kafka[*].id
    security_groups = [aws_security_group.kafka.id]

    storage_info {
      ebs_storage_info {
        volume_size = var.volume_size
      }
    }
  }

  encryption_info {
    encryption_at_rest_kms_key_id = var.kms_key_id
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  tags = var.tags
}

