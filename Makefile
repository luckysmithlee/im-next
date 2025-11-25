# Makefile for IM Application Docker Deployment

.PHONY: help install build start stop restart logs health backup restore clean update

# 默认目标
.DEFAULT_GOAL := help

# 颜色定义
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m # No Color

# 帮助信息
help: ## 显示帮助信息
	@echo "$(GREEN)IM应用Docker部署管理$(NC)"
	@echo "========================"
	@echo ""
	@echo "$(YELLOW)安装和部署:$(NC)"
	@echo "  make install    - 安装依赖并初始化环境"
	@echo "  make build      - 构建所有Docker镜像"
	@echo "  make start      - 启动所有服务"
	@echo "  make stop       - 停止所有服务"
	@echo "  make restart    - 重启所有服务"
	@echo ""
	@echo "$(YELLOW)运维管理:$(NC)"
	@echo "  make logs       - 查看服务日志"
	@echo "  make health     - 执行健康检查"
	@echo "  make status     - 显示服务状态"
	@echo ""
	@echo "$(YELLOW)数据管理:$(NC)"
	@echo "  make backup     - 执行数据备份"
	@echo "  make restore    - 恢复数据备份"
	@echo ""
	@echo "$(YELLOW)维护操作:$(NC)"
	@echo "  make clean      - 清理容器和数据卷"
	@echo "  make update     - 更新应用版本"
	@echo "  make upgrade    - 升级Docker镜像"
	@echo ""
	@echo "$(YELLOW)开发环境:$(NC)"
	@echo "  make dev        - 启动开发环境"
	@echo "  make dev-logs   - 查看开发环境日志"
	@echo "  make test       - 运行测试"

# 安装和初始化
install: ## 安装依赖并初始化环境
	@echo "$(GREEN)开始安装和初始化...$(NC)"
	@chmod +x scripts/*.sh
	@if [ ! -f .env ]; then cp .env.example .env; echo "$(YELLOW)已创建.env文件，请根据需要修改配置$(NC)"; fi
	@mkdir -p {database/init,database/backups,nginx/ssl,logs/{backend,frontend,nextjs,nginx}}
	@echo "$(GREEN)安装完成！$(NC)"

# 构建镜像
build: ## 构建所有Docker镜像
	@echo "$(GREEN)开始构建Docker镜像...$(NC)"
	@docker-compose -f docker-compose.prod.yml build --no-cache
	@echo "$(GREEN)镜像构建完成！$(NC)"

# 启动服务
start: ## 启动所有服务
	@echo "$(GREEN)启动所有服务...$(NC)"
	@docker-compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)服务启动完成！$(NC)"
	@echo "$(YELLOW)等待服务初始化...$(NC)"
	@sleep 10
	@make health

# 停止服务
stop: ## 停止所有服务
	@echo "$(YELLOW)停止所有服务...$(NC)"
	@docker-compose -f docker-compose.prod.yml stop
	@echo "$(GREEN)服务已停止！$(NC)"

# 重启服务
restart: ## 重启所有服务
	@echo "$(GREEN)重启所有服务...$(NC)"
	@docker-compose -f docker-compose.prod.yml restart
	@echo "$(GREEN)服务重启完成！$(NC)"
	@sleep 5
	@make health

# 查看日志
logs: ## 查看服务日志
	@echo "$(GREEN)服务日志：$(NC)"
	@docker-compose -f docker-compose.prod.yml logs -f --tail=100

# 查看特定服务日志
logs-%: ## 查看特定服务日志，如: make logs-backend
	@echo "$(GREEN)查看 $* 服务日志：$(NC)"
	@docker-compose -f docker-compose.prod.yml logs -f --tail=100 $*

# 健康检查
health: ## 执行健康检查
	@echo "$(GREEN)执行健康检查...$(NC)"
	@./scripts/deploy.sh health

# 服务状态
status: ## 显示服务状态
	@echo "$(GREEN)服务状态：$(NC)"
	@docker-compose -f docker-compose.prod.yml ps

# 数据备份
backup: ## 执行数据备份
	@echo "$(GREEN)执行数据备份...$(NC)"
	@./scripts/backup.sh

# 数据恢复
restore: ## 恢复数据备份
	@echo "$(YELLOW)恢复数据备份...$(NC)"
	@echo "$(RED)警告：此操作将覆盖现有数据！$(NC)"
	@read -p "是否继续？(yes/no): " confirm && [ "$$confirm" = "yes" ] || (echo "操作已取消" && exit 1)
	@ls -la database/backups/
	@read -p "请输入备份文件名: " backup_file
	@./scripts/restore.sh database/backups/$$backup_file --force

# 清理环境
clean: ## 清理容器和数据卷
	@echo "$(RED)警告：此操作将删除所有容器和数据卷！$(NC)"
	@read -p "是否继续？(yes/no): " confirm && [ "$$confirm" = "yes" ] || (echo "操作已取消" && exit 1)
	@docker-compose -f docker-compose.prod.yml down -v --remove-orphans
	@echo "$(GREEN)清理完成！$(NC)"

# 更新应用
update: ## 更新应用版本
	@echo "$(GREEN)更新应用版本...$(NC)"
	@git pull
	@docker-compose -f docker-compose.prod.yml pull
	@docker-compose -f docker-compose.prod.yml build --no-cache
	@docker-compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)更新完成！$(NC)"

# 升级镜像
upgrade: ## 升级Docker镜像
	@echo "$(GREEN)升级Docker镜像...$(NC)"
	@docker-compose -f docker-compose.prod.yml pull
	@docker-compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)镜像升级完成！$(NC)"

# 开发环境
dev: ## 启动开发环境
	@echo "$(GREEN)启动开发环境...$(NC)"
	@docker-compose -f docker-compose.yml up -d
	@echo "$(GREEN)开发环境已启动！$(NC)"
	@echo "$(YELLOW)等待服务初始化...$(NC)"
	@sleep 5
	@make health

# 开发环境日志
dev-logs: ## 查看开发环境日志
	@echo "$(GREEN)开发环境日志：$(NC)"
	@docker-compose -f docker-compose.yml logs -f --tail=100

# 停止开发环境
dev-stop: ## 停止开发环境
	@echo "$(YELLOW)停止开发环境...$(NC)"
	@docker-compose -f docker-compose.yml stop
	@echo "$(GREEN)开发环境已停止！$(NC)"

# 运行测试
test: ## 运行测试
	@echo "$(GREEN)运行测试...$(NC)"
	@npm test

# 数据库操作
db-backup: ## 备份数据库
	@echo "$(GREEN)备份数据库...$(NC)"
	@./scripts/backup.sh postgres

db-restore: ## 恢复数据库
	@echo "$(YELLOW)恢复数据库...$(NC)"
	@ls -la database/backups/
	@read -p "请输入数据库备份文件名: " backup_file
	@./scripts/restore.sh database/backups/$$backup_file --postgres-only --force

db-shell: ## 进入数据库命令行
	@echo "$(GREEN)进入PostgreSQL命令行...$(NC)"
	@docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d im_app

db-migrate: ## 执行数据库迁移
	@echo "$(GREEN)执行数据库迁移...$(NC)"
	@docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d im_app -f /docker-entrypoint-initdb.d/01-init.sql

# 系统监控
monitor: ## 监控系统资源
	@echo "$(GREEN)系统资源监控：$(NC)"
	@docker stats --no-stream

disk-usage: ## 查看磁盘使用情况
	@echo "$(GREEN)磁盘使用情况：$(NC)"
	@df -h
	@echo ""
	@echo "$(YELLOW)Docker卷使用情况：$(NC)"
	@docker system df

# 快速部署
quick-deploy: install build start ## 快速部署（安装+构建+启动）
	@echo "$(GREEN)快速部署完成！$(NC)"

# 完全重装
reinstall: clean install build start ## 完全重装（清理+安装+构建+启动）
	@echo "$(GREEN)完全重装完成！$(NC)"

# 紧急恢复
emergency-restore: ## 紧急恢复（从最新备份）
	@echo "$(RED)执行紧急恢复...$(NC)"
	@latest_backup=$$(ls -t database/backups/full/backup_*.tar.gz 2>/dev/null | head -1); \
	if [ -n "$$latest_backup" ]; then \
		echo "$(GREEN)找到最新备份: $$latest_backup$(NC)"; \
		./scripts/restore.sh "$$latest_backup" --force; \
	else \
		echo "$(RED)未找到备份文件！$(NC)"; \
		exit 1; \
	fi