export default { apps: [{ name:'dl-creator-web', script:'src/server.js', cwd:'./server', env:{ NODE_ENV:'production' }, instances:1, autorestart:true, max_memory_restart:'512M' }] };
