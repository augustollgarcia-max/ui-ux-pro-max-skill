"""Run only against a disposable preview Redis. Reads config path, never prints credentials."""
import concurrent.futures, hashlib, hmac, json, pathlib, subprocess, sys, time, urllib.request, uuid
cfg=json.loads(pathlib.Path(sys.argv[1]).read_text())
lua=subprocess.check_output(['node','-e',"process.stdout.write(require('./site-hair/api/hara-public').LUA)"],text=True)
def command(args):
 req=urllib.request.Request(cfg['HARA_RATE_REST_URL'],data=json.dumps(args).encode(),headers={'Authorization':'Bearer '+cfg['HARA_RATE_REST_TOKEN'],'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=20) as response:
  value=json.load(response)
 if 'error' in value: raise RuntimeError('Redis command failed')
 return value['result']
prefix='hara:validation:'+uuid.uuid4().hex
keys=[prefix+':minute',prefix+':day',prefix+':global']
args=['EVAL',lua,'3',*keys,'6','30','1000','120','86400','86400']
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
 results=list(pool.map(lambda _:command(args),range(20)))
assert results.count(1)==6 and results.count(0)==14,results
print('PASS real Redis concurrency: 20 requests, 6 allowed, 14 rejected')
ttls=[command(['TTL',k]) for k in keys]
assert 0<ttls[0]<=120 and all(0<t<=86400 for t in ttls[1:]),ttls
print('PASS actual counter expiration <= 120s / 24h / 24h')
for i,cap in [(1,30),(2,1000)]:
 testkeys=[prefix+f':cap{i}:{j}' for j in range(3)]
 command(['SET',testkeys[i],str(cap),'EX','120'])
 assert command(['EVAL',lua,'3',*testkeys,'6','30','1000','120','86400','86400'])==0
 print('PASS actual '+('daily per-IP' if i==1 else 'global daily')+' cap')
expiry=prefix+':expiry'
command(['SET',expiry,'1','EX','1']);time.sleep(1.1)
assert command(['GET',expiry]) is None
print('PASS actual Redis expiry')
# Test-only counters have TTL; no production keys or visitor data are read or deleted.
