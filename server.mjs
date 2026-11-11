import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const backend=new URL(process.env.API_ORIGIN||'http://127.0.0.1:3000');
const files={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/core.js':['core.js','text/javascript; charset=utf-8'],'/academy.js':['academy.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/academy.css':['academy.css','text/css; charset=utf-8'],'/admin.js':['admin.js','text/javascript; charset=utf-8'],'/admin.css':['admin.css','text/css; charset=utf-8']};
export function createServer(){return http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
 if(req.url.startsWith('/api/')){
  if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin && req.headers.origin!==`http://${req.headers.host}` && req.headers.origin!==`https://${req.headers.host}`){res.writeHead(403);return res.end();}
  const upstream=http.request({hostname:backend.hostname,port:backend.port||80,path:req.url.slice(4),method:req.method,headers:{...req.headers,host:backend.host}},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
  upstream.setTimeout(120000,()=>upstream.destroy());upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'Không kết nối được backend. Vui lòng thử lại.'}}));});req.on('aborted',()=>upstream.destroy());req.pipe(upstream);return;
 }
 const path=req.url.split('?')[0];
 const asset=/^\/assets\/[a-z0-9-]+\.(jpg|ttf)$/.exec(path);
 const file=files[path]||(asset?[path.slice(1),asset[1]==='jpg'?'image/jpeg':'font/ttf']:null);
 if(!file||!['GET','HEAD'].includes(req.method)){res.writeHead(404);return res.end('Not found');}
 try{const data=await readFile(new URL('./public/'+file[0],import.meta.url));res.writeHead(200,{'Content-Type':file[1]});res.end(req.method==='HEAD'?undefined:data);}catch(error){res.writeHead(error.code==='ENOENT'?404:500);res.end('Unable to load application');}
});}
if(process.argv[1]===fileURLToPath(import.meta.url))createServer().listen(Number(process.env.PORT||5173),process.env.HOST||'127.0.0.1',()=>console.log('English Academy: http://localhost:'+(process.env.PORT||5173)));
