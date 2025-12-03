import 'package:flutter/material.dart';
import 'package:logging/logging.dart';
import '../services/service_locator.dart';
import '../services/http_client_service.dart';
import '../services/socket_service.dart';
import '../constants/api_constants.dart';

class DiagnosticsPage extends StatefulWidget {
  const DiagnosticsPage({super.key});

  @override
  State<DiagnosticsPage> createState() => _DiagnosticsPageState();
}

class _DiagnosticsPageState extends State<DiagnosticsPage> {
  final Logger _logger = Logger('Diagnostics');
  final HttpClientService _http = httpClient;
  final SocketService _socket = socketService;

  final List<_DiagItem> _items = [
    _DiagItem('GET /api/me'),
    _DiagItem('GET /api/conversations'),
    _DiagItem('POST /api/messages/:peer'),
    _DiagItem('Socket connect'),
  ];

  String _peer = 'user2';

  @override
  void initState() {
    super.initState();
    _runAll();
  }

  Future<void> _runAll() async {
    await _http.init();
    await _run(() async {
      final r = await _http.get<Map<String, dynamic>>(ApiConstants.me);
      return r.data != null;
    }, 0);
    await _run(() async {
      final r = await _http.get<Map<String, dynamic>>(ApiConstants.conversations);
      return r.data != null && r.data!['conversations'] is List;
    }, 1);
    await _run(() async {
      final r = await _http.post<Map<String, dynamic>>("${ApiConstants.messages}/$_peer", data: {"content": "diag hello"});
      return r.data != null && r.data!['ok'] == true;
    }, 2);
    await _run(() async {
      await _socket.connect();
      return _socket.isConnected;
    }, 3);
    setState(() {});
  }

  Future<void> _run(Future<bool> Function() fn, int index) async {
    try {
      final ok = await fn();
      _items[index] = _items[index].copyWith(passed: ok, details: ok ? 'ok' : 'failed');
    } catch (e) {
      _logger.severe('diag failed: $e');
      _items[index] = _items[index].copyWith(passed: false, details: e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Diagnostics')),
      body: ListView.builder(
        itemCount: _items.length,
        itemBuilder: (context, i) {
          final it = _items[i];
          return ListTile(
            leading: Icon(it.passed == true ? Icons.check_circle : it.passed == false ? Icons.error_outline : Icons.hourglass_bottom,
                color: it.passed == true ? Colors.green : it.passed == false ? Colors.red : null),
            title: Text(it.name),
            subtitle: it.details != null ? Text(it.details!) : null,
          );
        },
      ),
    );
  }
}

class _DiagItem {
  final String name;
  final bool? passed;
  final String? details;
  const _DiagItem(this.name, {this.passed, this.details});
  _DiagItem copyWith({bool? passed, String? details}) => _DiagItem(name, passed: passed ?? this.passed, details: details ?? this.details);
}

