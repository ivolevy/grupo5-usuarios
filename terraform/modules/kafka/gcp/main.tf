# Módulo de Kafka en GCP usando Confluent Cloud o Compute Engine

# Opción 1: Usando Confluent Cloud (recomendado)
# Nota: Confluent Cloud requiere configuración manual o usar el provider de Confluent

# Opción 2: Instancias de Compute Engine para Kafka
resource "google_compute_instance" "kafka" {
  count        = var.broker_count
  name         = "${var.project_name}-kafka-${count.index + 1}"
  machine_type = var.machine_type
  zone         = var.zones[count.index % length(var.zones)]

  boot_disk {
    initialize_params {
      image = var.image
      size  = var.disk_size
    }
  }

  network_interface {
    network = google_compute_network.kafka.name
    access_config {
      // Ephemeral public IP
    }
  }

  metadata = {
    startup-script = templatefile("${path.module}/startup-script.sh", {
      broker_id = count.index + 1
    })
  }

  tags = ["kafka-broker"]

  labels = var.labels
}

# VPC Network
resource "google_compute_network" "kafka" {
  name                    = "${var.project_name}-kafka-network"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "kafka" {
  name          = "${var.project_name}-kafka-subnet"
  ip_cidr_range = var.subnet_cidr
  region        = var.region
  network       = google_compute_network.kafka.id
}

# Firewall Rules
resource "google_compute_firewall" "kafka" {
  name    = "${var.project_name}-kafka-firewall"
  network = google_compute_network.kafka.name

  allow {
    protocol = "tcp"
    ports    = ["9092", "9093", "9094"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["kafka-broker"]
}

