#!/bin/bash

# 一键部署脚本
# 用于快速部署整个IM应用到Docker环境

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

# 检查Docker和Docker Compose
check_dependencies() {
    log_info "检查依赖环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查Docker服务状态
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行，请启动Docker服务"
        exit 1
    fi
    
    log_info "依赖环境检查通过"
}

# 检查环境配置
check_environment() {
    log_info "检查环境配置..."
    
    if [ ! -f ".env" ]; then
        log_warn "未找到.env文件，将使用.env.example作为模板"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_info "已创建.env文件，请根据需要修改配置"
            log_warn "重要：请修改数据库密码和其他敏感配置"
        else
            log_error "未找到.env.example文件"
            exit 1
        fi
    fi
    
    # 检查必要的目录
    mkdir -p {database/init,database/backups,nginx/ssl,logs/{backend,frontend,nextjs,nginx},scripts}
    
    # 设置脚本权限
    chmod +x scripts/*.sh
    
    log_info "环境配置检查完成"
}

# 构建和启动服务
deploy_services() {
    log_info "开始构建和启动服务..."
    
    # 拉取镜像
    log_info "拉取Docker镜像..."
    docker-compose -f docker-compose.prod.yml pull
    
    # 构建自定义镜像
    log_info "构建应用镜像..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker-compose -f docker-compose.prod.yml up -d
    
    log_info "服务启动命令执行完成"
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    
    # 等待PostgreSQL
    log_info "等待PostgreSQL数据库启动..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres -d im_app &> /dev/null; then
            log_info "PostgreSQL数据库已就绪"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "PostgreSQL数据库启动超时"
        return 1
    fi
    
    # 等待Redis
    log_info "等待Redis缓存服务启动..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping &> /dev/null; then
            log_info "Redis缓存服务已就绪"
            break
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "Redis缓存服务启动超时"
        return 1
    fi
    
    # 等待后端服务
    log_info "等待后端API服务启动..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:4000/health &> /dev/null; then
            log_info "后端API服务已就绪"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "后端API服务启动超时"
        return 1
    fi
    
    log_info "所有核心服务已启动完成"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    # 检查是否有初始化脚本
    if [ -d "database/init" ] && [ "$(ls -A database/init)" ]; then
        log_info "执行数据库初始化脚本..."
        for script in database/init/*.sql; do
            if [ -f "$script" ]; then
                log_info "执行脚本: $(basename "$script")"
                docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d im_app -f "/docker-entrypoint-initdb.d/$(basename "$script")"
            fi
        done
    else
        log_info "未找到数据库初始化脚本，跳过初始化"
    fi
    
    log_info "数据库初始化完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查服务状态
    services=$(docker-compose -f docker-compose.prod.yml ps --services --filter "status=running" | wc -l)
    total_services=$(docker-compose -f docker-compose.prod.yml config --services | wc -l)
    
    log_info "运行中的服务: $services/$total_services"
    
    # 检查关键端口
    declare -a ports=("5432" "6379" "4000" "3000" "3001" "5173")
    for port in "${ports[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            log_info "端口 $port 已监听"
        else
            log_warn "端口 $port 未监听"
        fi
    done
    
    # 检查服务响应
    declare -a health_urls=("http://localhost:4000/health" "http://localhost:3000" "http://localhost:3001")
    for url in "${health_urls[@]}"; do
        if curl -f -s -m 5 "$url" &> /dev/null; then
            log_info "服务响应正常: $url"
        else
            log_warn "服务响应异常: $url"
        fi
    done
}

# 显示服务状态
show_status() {
    log_info "服务状态:"
    docker-compose -f docker-compose.prod.yml ps
    
    log_info ""
    log_info "访问地址:"
    log_info "  Next.js前端: http://localhost:3000"
    log_info "  Vite前端: http://localhost:5173"
    log_info "  后端API: http://localhost:4000"
    log_info "  数据库管理: http://localhost:3001"
    log_info "  MinIO控制台: http://localhost:9001"
    log_info ""
    log_info "API端点:"
    log_info "  健康检查: http://localhost:4000/health"
    log_info "  WebSocket: ws://localhost:4000"
}

# 清理函数
cleanup() {
    log_info "正在清理..."
    docker-compose -f docker-compose.prod.yml down -v --remove-orphans
    log_info "清理完成"
}

# 主函数
main() {
    case "${1:-deploy}" in
        "deploy")
            log_info "开始一键部署IM应用..."
            check_dependencies
            check_environment
            deploy_services
            wait_for_services
            init_database
            health_check
            show_status
            log_info "部署完成！"
            ;;
        "start")
            log_info "启动服务..."
            docker-compose -f docker-compose.prod.yml start
            wait_for_services
            show_status
            ;;
        "stop")
            log_info "停止服务..."
            docker-compose -f docker-compose.prod.yml stop
            ;;
        "restart")
            log_info "重启服务..."
            docker-compose -f docker-compose.prod.yml restart
            wait_for_services
            show_status
            ;;
        "status")
            show_status
            ;;
        "health")
            health_check
            ;;
        "logs")
            service="${2:-}"
            if [ -n "$service" ]; then
                docker-compose -f docker-compose.prod.yml logs -f "$service"
            else
                docker-compose -f docker-compose.prod.yml logs -f
            fi
            ;;
        "cleanup")
            cleanup
            ;;
        "update")
            log_info "更新应用..."
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml build --no-cache
            docker-compose -f docker-compose.prod.yml up -d
            wait_for_services
            show_status
            log_info "更新完成！"
            ;;
        *)
            echo "用法: $0 {deploy|start|stop|restart|status|health|logs|cleanup|update}"
            echo ""
            echo "命令:"
            echo "  deploy  - 一键部署整个应用"
            echo "  start   - 启动服务"
            echo "  stop    - 停止服务"
            echo "  restart - 重启服务"
            echo "  status  - 显示服务状态"
            echo "  health  - 执行健康检查"
            echo "  logs    - 查看日志 [服务名]"
            echo "  cleanup - 清理所有容器和数据卷"
            echo "  update  - 更新应用到最新版本"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"