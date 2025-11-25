#!/bin/bash

# 数据备份脚本
# 用于备份PostgreSQL数据库和文件存储

set -e

# 配置变量
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
POSTGRES_HOST="postgres"
POSTGRES_DB="${POSTGRES_DB:-im_app}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 创建备份目录
mkdir -p "$BACKUP_DIR"/{postgres,minio,full}

# PostgreSQL数据库备份
backup_postgres() {
    log_info "开始备份PostgreSQL数据库..."
    
    if [ -z "$POSTGRES_PASSWORD" ]; then
        log_error "PostgreSQL密码未设置"
        exit 1
    fi
    
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # 创建数据库备份
    pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" --verbose --file="$BACKUP_DIR/postgres/backup_${DATE}.sql"
    
    # 压缩备份文件
    gzip "$BACKUP_DIR/postgres/backup_${DATE}.sql"
    
    log_info "PostgreSQL数据库备份完成: backup_${DATE}.sql.gz"
}

# MinIO文件存储备份
backup_minio() {
    log_info "开始备份MinIO文件存储..."
    
    # 创建MinIO数据备份（假设MinIO数据在/minio_data目录）
    if [ -d "/data" ]; then
        tar -czf "$BACKUP_DIR/minio/minio_backup_${DATE}.tar.gz" -C /data .
        log_info "MinIO文件存储备份完成: minio_backup_${DATE}.tar.gz"
    else
        log_warn "MinIO数据目录不存在，跳过文件存储备份"
    fi
}

# 完整系统备份
backup_full() {
    log_info "开始创建完整系统备份..."
    
    # 创建完整备份目录
    FULL_BACKUP_DIR="$BACKUP_DIR/full/backup_${DATE}"
    mkdir -p "$FULL_BACKUP_DIR"
    
    # 备份PostgreSQL
    if [ -f "$BACKUP_DIR/postgres/backup_${DATE}.sql.gz" ]; then
        cp "$BACKUP_DIR/postgres/backup_${DATE}.sql.gz" "$FULL_BACKUP_DIR/"
    fi
    
    # 备份MinIO
    if [ -f "$BACKUP_DIR/minio/minio_backup_${DATE}.tar.gz" ]; then
        cp "$BACKUP_DIR/minio/minio_backup_${DATE}.tar.gz" "$FULL_BACKUP_DIR/"
    fi
    
    # 备份环境配置
    cp /app/.env "$FULL_BACKUP_DIR/env_backup" 2>/dev/null || log_warn "环境配置文件不存在"
    
    # 创建完整备份压缩包
    tar -czf "$FULL_BACKUP_DIR.tar.gz" -C "$BACKUP_DIR/full" "backup_${DATE}"
    rm -rf "$FULL_BACKUP_DIR"
    
    log_info "完整系统备份完成: backup_${DATE}.tar.gz"
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理${RETENTION_DAYS}天前的旧备份..."
    
    # 清理PostgreSQL备份
    find "$BACKUP_DIR/postgres" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # 清理MinIO备份
    find "$BACKUP_DIR/minio" -name "minio_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # 清理完整备份
    find "$BACKUP_DIR/full" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    log_info "旧备份清理完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查PostgreSQL连接
    if pg_isready -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        log_info "PostgreSQL连接正常"
    else
        log_error "PostgreSQL连接失败"
        return 1
    fi
    
    # 检查磁盘空间
    DISK_USAGE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        log_error "磁盘空间不足: ${DISK_USAGE}% 已使用"
        return 1
    else
        log_info "磁盘空间充足: ${DISK_USAGE}% 已使用"
    fi
    
    return 0
}

# 主函数
main() {
    log_info "开始执行数据备份任务"
    
    # 健康检查
    if ! health_check; then
        log_error "健康检查失败，终止备份任务"
        exit 1
    fi
    
    # 执行备份
    backup_postgres
    backup_minio
    backup_full
    
    # 清理旧备份
    cleanup_old_backups
    
    log_info "数据备份任务完成"
}

# 根据参数执行不同功能
case "${1:-backup}" in
    "backup")
        main
        ;;
    "postgres")
        backup_postgres
        ;;
    "minio")
        backup_minio
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "health")
        health_check
        ;;
    *)
        echo "用法: $0 {backup|postgres|minio|cleanup|health}"
        exit 1
        ;;
esac