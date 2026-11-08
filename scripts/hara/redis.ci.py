"""Real Lua integration against the disposable Redis service of the CI runner.
Always connects to 127.0.0.1:6379. No production/Upstash credentials are used.
"""
import concurrent.futures
import json
import pathlib
import socket
import subprocess
import time
import uuid

lua = subprocess.check_output(['node', '-e', "process.stdout.write(require('./site-hair/api/hara-public').LUA)"], text=True)

def read_resp(stream):
    kind = stream.read(1)
    line = stream.readline().removesuffix(b'\r\n')
    if kind == b'+': return line.decode()
    if kind == b'-': raise RuntimeError('Redis test command failed: ' + line.decode())
    if kind == b':': return int(line)
    if kind == b'$':
        size = int(line)
        if size == -1: return None
        data = stream.read(size)
        assert stream.read(2) == b'\r\n'
        return data.decode()
    if kind == b'*': return [read_resp(stream) for _ in range(int(line))]
    raise RuntimeError('Invalid Redis response')

def command(args):
    parts = [str(a).encode() for a in args]
    data = b'*' + str(len(parts)).encode() + b'\r\n'
    for part in parts:
        data += b'$' + str(len(part)).encode() + b'\r\n' + part + b'\r\n'
    with socket.create_connection(('127.0.0.1', 6379), timeout=5) as sock:
        sock.settimeout(5)
        sock.sendall(data)
        with sock.makefile('rb') as stream:
            return read_resp(stream)

assert command(['PING']) == 'PONG'
prefix = 'hara:ci:' + uuid.uuid4().hex
keys = [prefix + ':minute', prefix + ':day', prefix + ':global']
args = ['EVAL', lua, 3, *keys, 6, 30, 1000, 120, 86400, 86400]
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
    values = list(pool.map(lambda _: command(args), range(20)))
assert values.count(1) == 6 and values.count(0) == 14, values
assert [int(command(['GET', k])) for k in keys] == [6, 6, 6]
ttls = [command(['TTL', k]) for k in keys]
assert 0 < ttls[0] <= 120 and all(0 < t <= 86400 for t in ttls[1:]), ttls
for dimension, cap in [(1, 30), (2, 1000)]:
    isolated = [prefix + f':cap:{dimension}:{i}' for i in range(3)]
    command(['SET', isolated[dimension], cap, 'EX', 120])
    assert command(['EVAL', lua, 3, *isolated, 6, 30, 1000, 120, 86400, 86400]) == 0
    assert command(['GET', isolated[0]]) is None
expiry = prefix + ':expiry'
command(['SET', expiry, 1, 'EX', 1])
time.sleep(1.1)
assert command(['GET', expiry]) is None
result = {'environment': 'ephemeral local Redis service in CI', 'concurrentRequests': 20, 'allowed': 6, 'blocked': 14, 'dailyIpCap': 30, 'globalCap': 1000, 'ttls': ttls, 'blockedRequestsDoNotConsumeOtherCounters': True, 'expirationObserved': True}
output = pathlib.Path('output/hara-redis')
output.mkdir(parents=True, exist_ok=True)
(output / 'results.json').write_text(json.dumps(result, indent=2) + '\n')
print('PASS real Redis/Lua: concurrency, quotas, TTL and expiration; no external service or visitor data')
