# 数据库初始化脚本
# 创建必要的数据表和索引

-- 用户表（使用Supabase Auth，不需要单独创建）
-- 聊天室表
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    file_url TEXT,
    file_name VARCHAR(255),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户聊天室关联表
CREATE TABLE IF NOT EXISTS user_chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, room_id)
);

-- 文件上传记录表
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_chat_rooms_user_id ON user_chat_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_rooms_room_id ON user_chat_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('max_file_size', '10485760', '最大文件上传大小（字节）'),
('allowed_file_types', 'jpg,jpeg,png,gif,pdf,doc,docx,txt', '允许上传的文件类型'),
('message_retention_days', '30', '消息保留天数'),
('enable_registration', 'true', '是否允许用户注册'),
('enable_file_upload', 'true', '是否允许文件上传')
ON CONFLICT (config_key) DO NOTHING;

-- 创建默认聊天室
INSERT INTO chat_rooms (name, description, is_private, created_by) VALUES
('General', 'General discussion room', FALSE, NULL),
('Help', 'Get help and support', FALSE, NULL)
ON CONFLICT DO NOTHING;

-- 启用行级安全（RLS）
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- 创建策略
-- 聊天室策略
CREATE POLICY "Public rooms are viewable by everyone" ON chat_rooms
    FOR SELECT USING (is_private = FALSE OR created_by = auth.uid());

CREATE POLICY "Users can create rooms" ON chat_rooms
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Room creators can update their rooms" ON chat_rooms
    FOR UPDATE USING (created_by = auth.uid());

-- 聊天消息策略
CREATE POLICY "Messages are viewable by room members" ON chat_messages
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM user_chat_rooms WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to rooms they belong to" ON chat_messages
    FOR INSERT WITH CHECK (
        room_id IN (
            SELECT room_id FROM user_chat_rooms WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (user_id = auth.uid());

-- 用户聊天室关联策略
CREATE POLICY "Users can view their own room memberships" ON user_chat_rooms
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join public rooms" ON user_chat_rooms
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        room_id IN (
            SELECT id FROM chat_rooms WHERE is_private = FALSE
        )
    );

-- 文件上传策略
CREATE POLICY "Users can view their own uploads" ON file_uploads
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upload files" ON file_uploads
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 系统配置策略
CREATE POLICY "System configs are viewable by everyone" ON system_configs
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can view all configs" ON system_configs
    FOR SELECT USING (auth.uid() IS NOT NULL);