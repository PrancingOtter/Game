const http=require('http');
const fs=require('fs');
const path=require('path');
const {WebSocketServer}=require('ws');
const crypto=require('crypto');
const PORT=process.env.PORT||3000;
const puzzles=[['ANIMALS','SNEAKY RACCOON'],['FUN PHRASES','YOU ARE TOO FUNNY'],['FOOD','CHEESY POTATOES'],['GAMES','LEVEL UP TOGETHER'],['NATURE','PURPLE BUTTERFLY'],['FUN PHRASES','TEAMWORK MAKES DREAMS WORK'],['ANIMALS','FLUFFY LITTLE OTTER'],['GAMES','ONE MORE ROUND']];
const rooms=new Map();
const publicDir=path.join(__dirname,'public');
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return res.writeHead(400).end()}
 if(pathname==='/')pathname='/index.html';
 const file=path.resolve(publicDir,'.'+pathname);
 if(!file.startsWith(publicDir+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end('Not found');res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':'text/plain; charset=utf-8','Cache-Control':'no-store'}).end(data)})
});
const wss=new WebSocketServer({server});
function code(){let c;do{c=crypto.randomBytes(4).toString('hex').slice(0,6).toUpperCase()}while(rooms.has(c));return c}
function pick(room){const choices=puzzles.filter((_,i)=>i!==room.lastIndex);const chosen=choices[Math.floor(Math.random()*choices.length)];room.lastIndex=puzzles.indexOf(chosen);room.category=chosen[0];room.answer=chosen[1];room.guesses=[];room.misses=0;room.status='playing'}
function state(room){return {type:'state',code:room.code,category:room.category,masked:[...room.answer].map(c=>/[A-Z]/.test(c)&&!room.guesses.includes(c)?'_':c).join(''),guesses:room.guesses,misses:room.misses,maxMisses:6,status:room.status,answer:room.status==='playing'?null:room.answer,players:[...room.players.values()].map(p=>({name:p.name,id:p.id,online:!!p.ws&&p.ws.readyState===1})),events:room.events.slice(-5)}}
function broadcast(room){const msg=JSON.stringify(state(room));for(const p of room.players.values())if(p.ws?.readyState===1)p.ws.send(msg)}
function send(ws,obj){if(ws.readyState===1)ws.send(JSON.stringify(obj))}
function event(room,message){room.events.push(message);room.events=room.events.slice(-12)}
function join(ws,room,name,token){if(room.players.size>=3&&!room.players.has(token))return send(ws,{type:'error',message:'This room already has three players.'});let p=room.players.get(token);if(!p){p={id:token,name,ws:null};room.players.set(token,p);event(room,`${name} joined the team!`)}else{p.name=name;if(p.ws&&p.ws!==ws)p.ws.close()};p.ws=ws;ws.room=room;ws.token=token;send(ws,{type:'joined',token,code:room.code});broadcast(room)}
wss.on('connection',ws=>{ws.on('message',raw=>{try{if(raw.length>2048)return;const m=JSON.parse(raw);if(m.type==='create'||m.type==='join'){if(ws.room)return;const name=String(m.name||'').trim().slice(0,20);if(!name)return send(ws,{type:'error',message:'Enter a player name.'});const token=/^[a-f0-9]{32}$/.test(m.token||'')?m.token:crypto.randomBytes(16).toString('hex');let room;if(m.type==='create'){room={code:code(),players:new Map(),events:[],lastIndex:-1};pick(room);rooms.set(room.code,room)}else{room=rooms.get(String(m.code||'').trim().toUpperCase());if(!room)return send(ws,{type:'error',message:'Room not found. Check the code.'})}join(ws,room,name,token);return}const room=ws.room;if(!room)return;if(m.type==='guess'){if(room.status!=='playing')return;const letter=String(m.letter||'').toUpperCase();if(!/^[A-Z]$/.test(letter)||room.guesses.includes(letter))return;room.guesses.push(letter);const p=room.players.get(ws.token);if(!room.answer.includes(letter))room.misses++;event(room,`${p.name} guessed ${letter} ${room.answer.includes(letter)?'✓':'✗'}`);if([...room.answer].every(c=>!/^[A-Z]$/.test(c)||room.guesses.includes(c))){room.status='won';event(room,'🎉 Team solved the puzzle!')}else if(room.misses>=6){room.status='lost';event(room,'The team ran out of guesses.')}broadcast(room)}else if(m.type==='next'&&room.status!=='playing'){pick(room);event(room,'New puzzle started!');broadcast(room)}}catch(e){send(ws,{type:'error',message:'Invalid request.'})}});ws.on('close',()=>{const room=ws.room;if(!room)return;const p=room.players.get(ws.token);if(p?.ws===ws){p.ws=null;broadcast(room)}})});
setInterval(()=>{for(const [c,r] of rooms){if([...r.players.values()].every(p=>!p.ws||p.ws.readyState!==1)) {if(!r.emptySince)r.emptySince=Date.now();if(Date.now()-r.emptySince>3600000)rooms.delete(c)}else r.emptySince=null}},60000).unref();
server.listen(PORT,()=>console.log(`Hangout Hangman listening on ${PORT}`));
