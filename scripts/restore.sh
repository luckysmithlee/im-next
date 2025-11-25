#!/bin/bash

# 数据恢复脚本
# 用于从备份文件恢复PostgreSQL数据库和文件存储

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_prompt() {
    echo -e "${BLUE}[PROMPT]${NC} $1"
}

# 配置变量
BACKUP_DIR="/backups"
POSTGRES_HOST="postgres"
POSTGRES_DB="${POSTGRES_DB:-im_app}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"

# 检查参数
if [ $# -lt 1 ]; then
    echo "用法: $0 <备份文件路径> [选项]"
    echo "选项:"
    echo "  --postgres-only    仅恢复PostgreSQL数据库"
    echo "  --minio-only       仅恢复MinIO文件存储"
    echo "  --force            强制恢复，不询问确认"
    exit 1
fi

BACKUP_FILE="$1"
shift

# 解析参数
POSTGRES_ONLY=false
MINIO_ONLY=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --postgres-only)
            POSTGRES_ONLY=true
            shift
            ;;
        --minio-only)
            MINIO_ONLY=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            log_error "未知参数: $1"
            exit 1
            ;;
    esac
done

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 确认恢复
if [ "$FORCE" = false ]; then
    log_warn "警告：数据恢复将覆盖现有数据！"
    log_prompt "是否继续恢复？(yes/no): "
    read -r response
    if [[ ! "$response" =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "恢复操作已取消"
        exit 0
    fi
fi

# 创建临时目录
TEMP_DIR="/tmp/restore_$$"
mkdir -p "$TEMP_DIR"

# 解压备份文件
log_info "解压备份文件..."
cd "$TEMP_DIR"

if [[ "$BACKUP_FILE" == *.tar.gz ]]; then
    tar -xzf "$BACKUP_FILE"
elif [[ "$BACKUP_FILE" == *.sql.gz ]]; then
    cp "$BACKUP_FILE" .
    gunzip -f "$(basename "$BACKUP_FILE")"
elif [[ "$BACKUP_FILE" == *.sql ]]; then
    cp "$BACKUP_FILE" .
else
    log_error "不支持的备份文件格式"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 恢复PostgreSQL数据库
restore_postgres() {
    log_info "开始恢复PostgreSQL数据库..."
    
    if [ -z "$POSTGRES_PASSWORD" ]; then
        log_error "PostgreSQL密码未设置"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # 查找SQL备份文件
    SQL_FILE=$(find "$TEMP_DIR" -name "*.sql" -o -name "backup_*.sql.gz" | head -1)
    
    if [ -n "$SQL_FILE" ]; then
        if [[ "$SQL_FILE" == *.gz ]]; then
            log_info "解压SQL文件..."
            gunzip -f "$SQL_FILE"
            SQL_FILE="${SQL_FILE%.gz}"
        fi
        
        # 删除现有数据库并重新创建
        log_info "重置数据库..."
        psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\";"
        psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$POSTGRES_DB\";"
        
        # 恢复数据
        log_info "导入数据..."
        psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$SQL_FILE"
        
        log_info "PostgreSQL数据库恢复完成"
    else
        log_warn "未找到SQL备份文件，跳过数据库恢复"
    fi
}

# 恢复MinIO文件存储
restore_minio() {
    log_info "开始恢复MinIO文件存储..."
    
    # 查找MinIO备份文件
    MINIO_FILE=$(find "$TEMP_DIR" -name "minio_backup_*.tar.gz" | head -1)
    
    if [ -n "$MINIO_FILE" ]; then
        # 停止MinIO服务（如果在容器中运行）
        if docker ps | grep -q "im_minio"; then
            log_info "临时停止MinIO容器..."
            docker stop im_minio || true
        fi
        
        # 恢复MinIO数据
        log_info "恢复MinIO数据..."
        if [ -d "/data" ]; then
            # 备份现有数据
            if [ "$(ls -A /data)" ]; then
                mv /data /data_backup_$(date +%Y%m%d_%H%M%S)
            fi
            
            # 解压MinIO备份
            mkdir -p /data
            tar -xzf "$MINIO_FILE" -C /data
            
            log_info "MinIO文件存储恢复完成"
        else
            log_warn "MinIO数据目录不存在，跳过文件存储恢复"
        fi
        
        # 重新启动MinIO服务
        if docker ps -a | grep -q "im_minio"; then
            log_info "重新启动MinIO容器..."
            docker start im_minio || true
        fi
    else
        log_warn "未找到MinIO备份文件，跳过文件存储恢复"
    fi
}

# 验证恢复
verify_restore() {
    log_info "验证数据恢复..."
    
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # 检查数据库连接
    if pg_isready -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        log_info "PostgreSQL连接正常"
        
        # 检查数据库表
        TABLE_COUNT=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | xargs)
        log_info "数据库中共有 $TABLE_COUNT 张表"
        
        if [ "$TABLE_COUNT" -gt 0 ]; then
            log_info "数据库恢复验证通过"
        else
            log_warn "数据库中未找到表，请检查恢复结果"
        fi
    else
        log_error "PostgreSQL连接失败，恢复可能未成功"
        return 1
    fi
    
    return 0
}

# 主函数
main() {
    log_info "开始执行数据恢复任务"
    
    # 执行恢复
    if [ "$MINIO_ONLY" = false ]; then
        restore_postgres
    fi
    
    if [ "$POSTGRES_ONLY" = false ]; then
        restore_minio
    fi
    
    # 验证恢复
    if [ "$POSTGRES_ONLY" = false ] || [ "$MINIO_ONLY" = false ]; then
        verify_restore
    fi
    
    # 清理临时文件
    rm -rf "$TEMP_DIR"
    
    log_info "数据恢复任务完成"
}

# 执行主函数
main