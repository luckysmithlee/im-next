import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../services/secure_storage_service.dart';
import '../widgets/app_bar_widget.dart';
import '../widgets/loading_widget.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _isLoading = false;
  bool _notificationsEnabled = true;
  bool _soundEnabled = true;
  bool _vibrationEnabled = true;
  String _selectedLanguage = 'zh-CN';

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final secureStorage = SecureStorageService();
    
    setState(() {
      _isLoading = true;
    });

    try {
      final notifications = await secureStorage.getValue('notifications_enabled');
      final sound = await secureStorage.getValue('sound_enabled');
      final vibration = await secureStorage.getValue('vibration_enabled');
      final language = await secureStorage.getValue('selected_language');

      setState(() {
        _notificationsEnabled = notifications == 'true';
        _soundEnabled = sound == 'true';
        _vibrationEnabled = vibration == 'true';
        _selectedLanguage = language ?? 'zh-CN';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('加载设置失败: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _saveSetting(String key, String value) async {
    final secureStorage = SecureStorageService();
    try {
      await secureStorage.setValue(key, value);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('保存设置失败: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认退出'),
        content: const Text('确定要退出登录吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('确定'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() {
        _isLoading = true;
      });

      try {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        await authProvider.logout();
        
        if (mounted) {
          Navigator.of(context).pushReplacementNamed('/login');
        }
      } catch (e) {
        setState(() {
          _isLoading = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('退出登录失败: ${e.toString()}')),
          );
        }
      }
    }
  }

  Future<void> _handleChangePassword() async {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('修改密码'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: currentPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: '当前密码',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: newPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: '新密码',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: confirmPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: '确认新密码',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              if (newPasswordController.text != confirmPasswordController.text) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('新密码与确认密码不一致')),
                );
                return;
              }
              if (newPasswordController.text.length < 6) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('新密码长度至少为6位')),
                );
                return;
              }
              Navigator.of(context).pop(true);
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );

    if (result == true && mounted) {
      setState(() {
        _isLoading = true;
      });

      try {
        // TODO: Implement password change API call
        await Future.delayed(const Duration(seconds: 1)); // Simulate API call
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('密码修改成功')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('密码修改失败: ${e.toString()}')),
          );
        }
      } finally {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleClearCache() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('清除缓存'),
        content: const Text('确定要清除所有缓存数据吗？这将删除本地聊天记录和文件。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('确定'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() {
        _isLoading = true;
      });

      try {
        // TODO: Implement cache clearing
        await Future.delayed(const Duration(seconds: 1)); // Simulate cache clearing
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('缓存清除成功')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('清除缓存失败: ${e.toString()}')),
          );
        }
      } finally {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: LoadingWidget(),
      );
    }

    return Scaffold(
      appBar: const AppBarWidget(
        title: '设置',
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    '通知设置',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                SwitchListTile(
                  title: const Text('接收通知'),
                  subtitle: const Text('接收新消息通知'),
                  value: _notificationsEnabled,
                  onChanged: (value) {
                    setState(() {
                      _notificationsEnabled = value;
                    });
                    _saveSetting('notifications_enabled', value.toString());
                  },
                ),
                SwitchListTile(
                  title: const Text('声音提醒'),
                  subtitle: const Text('新消息时播放提示音'),
                  value: _soundEnabled,
                  onChanged: (value) {
                    setState(() {
                      _soundEnabled = value;
                    });
                    _saveSetting('sound_enabled', value.toString());
                  },
                ),
                SwitchListTile(
                  title: const Text('振动提醒'),
                  subtitle: const Text('新消息时振动提醒'),
                  value: _vibrationEnabled,
                  onChanged: (value) {
                    setState(() {
                      _vibrationEnabled = value;
                    });
                    _saveSetting('vibration_enabled', value.toString());
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    '外观设置',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Consumer<ThemeProvider>(
                  builder: (context, themeProvider, child) {
                    return ListTile(
                      title: const Text('主题模式'),
                      subtitle: Text(_getThemeDisplayName(themeProvider.themeMode)),
                      trailing: const Icon(Icons.arrow_forward_ios),
                      onTap: () => _showThemeDialog(themeProvider),
                    );
                  },
                ),
                ListTile(
                  title: const Text('语言设置'),
                  subtitle: Text(_getLanguageDisplayName(_selectedLanguage)),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () => _showLanguageDialog(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    '账户设置',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                ListTile(
                  title: const Text('修改密码'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: _handleChangePassword,
                ),
                ListTile(
                  title: const Text('清除缓存'),
                  subtitle: const Text('清除本地聊天记录和文件'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: _handleClearCache,
                ),
                ListTile(
                  title: const Text('退出登录'),
                  textColor: Colors.red,
                  trailing: const Icon(Icons.logout, color: Colors.red),
                  onTap: _handleLogout,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    '关于',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                ListTile(
                  title: const Text('版本信息'),
                  subtitle: const Text('v1.0.0'),
                  trailing: const Icon(Icons.info_outline),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('当前版本: v1.0.0')),
                    );
                  },
                ),
                ListTile(
                  title: const Text('帮助与反馈'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('帮助功能开发中...')),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getThemeDisplayName(ThemeMode themeMode) {
    switch (themeMode) {
      case ThemeMode.light:
        return '浅色模式';
      case ThemeMode.dark:
        return '深色模式';
      case ThemeMode.system:
        return '跟随系统';
    }
  }

  String _getLanguageDisplayName(String language) {
    switch (language) {
      case 'en-US':
        return 'English';
      case 'zh-CN':
      default:
        return '简体中文';
    }
  }

  void _showThemeDialog(ThemeProvider themeProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('选择主题模式'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<ThemeMode>(
              title: const Text('跟随系统'),
              value: ThemeMode.system,
              groupValue: themeProvider.themeMode,
              onChanged: (value) {
                themeProvider.setThemeMode(value!);
                Navigator.of(context).pop();
              },
            ),
            RadioListTile<ThemeMode>(
              title: const Text('浅色模式'),
              value: ThemeMode.light,
              groupValue: themeProvider.themeMode,
              onChanged: (value) {
                themeProvider.setThemeMode(value!);
                Navigator.of(context).pop();
              },
            ),
            RadioListTile<ThemeMode>(
              title: const Text('深色模式'),
              value: ThemeMode.dark,
              groupValue: themeProvider.themeMode,
              onChanged: (value) {
                themeProvider.setThemeMode(value!);
                Navigator.of(context).pop();
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
        ],
      ),
    );
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('选择语言'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<String>(
              title: const Text('简体中文'),
              value: 'zh-CN',
              groupValue: _selectedLanguage,
              onChanged: (value) {
                setState(() {
                  _selectedLanguage = value!;
                });
                _saveSetting('selected_language', value!);
                Navigator.of(context).pop();
              },
            ),
            RadioListTile<String>(
              title: const Text('English'),
              value: 'en-US',
              groupValue: _selectedLanguage,
              onChanged: (value) {
                setState(() {
                  _selectedLanguage = value!;
                });
                _saveSetting('selected_language', value!);
                Navigator.of(context).pop();
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    // Clean up controllers if needed
    super.dispose();
  }
}