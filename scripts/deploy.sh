#!/bin/bash

# NextNest Deployment Script
# This script handles deployment to production environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DEPLOY_BRANCH=${2:-main}

echo -e "${GREEN}🚀 NextNest Deployment Script${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Branch: ${YELLOW}$DEPLOY_BRANCH${NC}"

# Function to check prerequisites
check_prerequisites() {
    echo -e "\n${YELLOW}Checking prerequisites...${NC}"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check if .env.local exists
    if [ ! -f .env.local ]; then
        echo -e "${RED}❌ .env.local file not found${NC}"
        echo "Please copy .env.local.example to .env.local and configure it"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Function to run health checks
run_health_checks() {
    echo -e "\n${YELLOW}Running health checks...${NC}"
    
    # Check application health
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health/chat-integration)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Application health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Application health check returned status: $response${NC}"
    fi
}

# Function to backup database
backup_database() {
    echo -e "\n${YELLOW}Backing up database...${NC}"
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_${timestamp}.sql"
    
    docker-compose exec -T postgres pg_dump -U nextnest nextnest_production > "./backups/${backup_file}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database backed up to backups/${backup_file}${NC}"
    else
        echo -e "${RED}❌ Database backup failed${NC}"
        exit 1
    fi
}

# Function to deploy application
deploy_application() {
    echo -e "\n${YELLOW}Deploying application...${NC}"
    
    # Pull latest changes
    echo "Pulling latest changes from ${DEPLOY_BRANCH}..."
    git pull origin ${DEPLOY_BRANCH}
    
    # Build and start containers
    echo "Building Docker images..."
    docker-compose build --no-cache
    
    echo "Starting containers..."
    docker-compose up -d
    
    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    sleep 10
    
    # Run database migrations if needed
    echo "Running database migrations..."
    docker-compose exec nextnest npm run migrate:deploy || true
    
    echo -e "${GREEN}✅ Application deployed successfully${NC}"
}

# Function to cleanup old images
cleanup_old_images() {
    echo -e "\n${YELLOW}Cleaning up old Docker images...${NC}"
    docker image prune -f
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to show deployment status
show_status() {
    echo -e "\n${GREEN}📊 Deployment Status${NC}"
    echo "=============================="
    docker-compose ps
    echo "=============================="
}

# Function to rollback deployment
rollback() {
    echo -e "\n${RED}Rolling back deployment...${NC}"
    
    # Stop current containers
    docker-compose down
    
    # Checkout previous version
    git checkout HEAD~1
    
    # Rebuild and start
    docker-compose build
    docker-compose up -d
    
    echo -e "${YELLOW}⚠️  Rollback completed${NC}"
}

# Main deployment flow
main() {
    case "$1" in
        production|staging)
            check_prerequisites
            backup_database
            deploy_application
            run_health_checks
            cleanup_old_images
            show_status
            ;;
        rollback)
            rollback
            ;;
        status)
            show_status
            ;;
        health)
            run_health_checks
            ;;
        *)
            echo "Usage: $0 {production|staging|rollback|status|health}"
            exit 1
            ;;
    esac
}

# Create necessary directories
mkdir -p backups
mkdir -p logs

# Run main function
main $@

echo -e "\n${GREEN}🎉 Deployment process completed!${NC}"