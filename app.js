
/* ═══ 星空 Canvas ═══ */
(function(){
  var c=document.getElementById('starsCanvas'),ctx=c.getContext('2d');
  c.width=window.innerWidth;c.height=window.innerHeight;
  var stars=[];
  for(var i=0;i<500;i++){
    stars.push({x:Math.random()*c.width,y:Math.random()*c.height,r:0.5+Math.random()*2,a:Math.random(),da:(0.3+Math.random()*1.5)*0.02,d:Math.random()*Math.PI*2});
  }
  function drawStars(){
    ctx.clearRect(0,0,c.width,c.height);
    stars.forEach(function(s){s.d+=s.da;var alpha=0.08+Math.sin(s.d)*0.5+0.5;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,'+alpha+')';ctx.fill();});
    requestAnimationFrame(drawStars);
  }
  drawStars();
})();

/* ═══ 地球 Canvas ═══ */
var gc=document.getElementById('globeCanvas'),gctx=gc.getContext('2d');
function resizeGlobe(){var sz=Math.min(window.innerWidth*0.7,window.innerHeight*0.6,500);gc.width=gc.height=sz*devicePixelRatio;gc.style.width=gc.style.height=sz+'px';}
resizeGlobe();
window.addEventListener('resize',function(){resizeGlobe();});

var continents=[
  [[65,-170],[62,-140],[55,-130],[48,-125],[32,-118],[25,-110],[20,-100],[25,-90],[30,-82],[45,-65],[50,-55],[60,-60],[65,-80],[70,-95],[72,-120],[70,-150]],
  [[10,-75],[5,-60],[0,-50],[-5,-35],[-15,-40],[-25,-45],[-35,-55],[-40,-60],[-50,-70],[-45,-75],[-30,-70],[-15,-70],[-5,-75],[0,-50]],
  [[35,-10],[38,-8],[43,-10],[48,-5],[48,0],[50,2],[52,5],[55,8],[55,12],[52,15],[48,15],[45,12],[42,15],[38,25],[35,25],[37,20]],
  [[35,-5],[15,-17],[5,-10],[0,-10],[-5,-15],[-10,-15],[-15,-10],[-25,-15],[-35,-20],[-35,-25],[-25,-30],[-15,-30],[-10,-35],[0,-40],[5,-40],[10,-45],[15,-40],[20,-30],[30,-25],[35,-5]],
  [[40,25],[42,28],[45,30],[50,35],[52,40],[50,50],[55,55],[60,60],[65,70],[70,80],[72,100],[70,120],[65,130],[60,135],[55,140],[50,135],[45,140],[40,135],[35,130],[30,125],[25,120],[20,115],[15,110],[10,105],[10,100],[15,95],[20,90],[25,80],[30,75],[35,65],[35,55],[35,40],[35,30]],
  [[30,35],[28,38],[25,40],[22,45],[18,48],[15,50],[12,48],[12,42],[15,40],[18,38],[22,34],[25,32]],
  [[32,75],[28,78],[20,80],[15,78],[10,78],[8,77],[8,75],[10,73],[12,70],[15,68],[20,65],[25,70],[30,72]],
  [[20,100],[18,105],[15,108],[10,106],[5,105],[0,104],[-5,105],[-8,110],[-5,115],[5,115],[10,110],[15,105],[20,100]],
  [[-10,115],[-15,120],[-20,125],[-25,130],[-30,135],[-35,140],[-40,145],[-38,150],[-35,155],[-30,155],[-25,150],[-20,145],[-15,135],[-12,125]],
  [[82,-55],[80,-40],[75,-30],[72,-25],[70,-20],[68,-25],[65,-35],[62,-45],[60,-55],[62,-65],[65,-70],[70,-75],[75,-70],[80,-60]]
];
// Glow effect
var gradientColors=['rgba(40,100,220,0)','rgba(40,80,200,.04)','rgba(40,60,180,.02)'];
var earthColors=['#1a3a5a','#0c1f35','#061018','#020408'];
var highlightColors=['rgba(60,140,220,.12)','rgba(40,100,200,.06)','rgba(40,60,120,0)'];

function drawGlobe(){
  var w=gc.width,h=gc.height,r=w*0.42,cx=w/2,cy=h/2;
  gctx.clearRect(0,0,w,h);
  // Atmosphere glow
  var grd=gctx.createRadialGradient(cx,cy,r*0.2,r*0.4,r*1.3);
  grd.addColorStop(0,gradientColors[0]);grd.addColorStop(0.7,gradientColors[1]);grd.addColorStop(1,gradientColors[2]);
  gctx.fillStyle=grd;gctx.fillRect(0,0,w,h);
  // Sphere
  var grad=gctx.createRadialGradient(cx-r*0.3,cy-r*0.3,0,cx,cy,r);
  grad.addColorStop(0,earthColors[0]);grad.addColorStop(0.4,earthColors[1]);grad.addColorStop(0.7,earthColors[2]);grad.addColorStop(1,earthColors[3]);
  gctx.beginPath();gctx.arc(cx,cy,r,0,Math.PI*2);gctx.fillStyle=grad;gctx.fill();
  // Highlight
  var hl=gctx.createRadialGradient(cx-r*0.25,cy-r*0.25,0,cx,cy,r*0.5);
  hl.addColorStop(0,highlightColors[0]);hl.addColorStop(0.5,highlightColors[1]);hl.addColorStop(1,highlightColors[2]);
  gctx.beginPath();gctx.arc(cx,cy,r,0,Math.PI*2);gctx.fillStyle=hl;gctx.fill();
  // Continents
  gctx.save();gctx.beginPath();gctx.arc(cx,cy,r,0,Math.PI*2);gctx.clip();
  continents.forEach(function(pts){
    gctx.beginPath();var first=true;
    for(var i=0;i<pts.length;i++){
      var p=pts[i],lat=p[0],lng=p[1];
      var phi=(90-lat)*Math.PI/180,theta=(lng+180)*Math.PI/180;
      var px=cx+r*Math.sin(phi)*Math.cos(theta),py=cy-r*Math.cos(phi);
      if(first){gctx.moveTo(px,py);first=false;}else{gctx.lineTo(px,py);}
    }
    gctx.closePath();gctx.fillStyle='rgba(30,75,50,.3)';gctx.fill();gctx.strokeStyle='rgba(40,100,60,.2)';gctx.lineWidth=1;gctx.stroke();
  });
  gctx.restore();
  requestAnimationFrame(drawGlobe);
}
drawGlobe();

// Region mapping
var regionCoords={'美国':{lat:38,lng:-97},'中国':{lat:35,lng:105},'俄罗斯':{lat:60,lng:40},'欧洲':{lat:50,lng:10},'中东':{lat:28,lng:44},'非洲':{lat:0,lng:20},'日本':{lat:36,lng:138},'韩国':{lat:36,lng:128},'印度':{lat:20,lng:78},'澳洲':{lat:-25,lng:135},'南美':{lat:-15,lng:-60},'英国':{lat:52,lng:-2},'法国':{lat:47,lng:2},'德国':{lat:51,lng:9},'东南亚':{lat:10,lng:105}};
var allData={};

function load(){
  document.getElementById('uptime').textContent='加载中...';
  var x=new XMLHttpRequest();
  x.open('GET','data/news.json?_='+Date.now(),true);
  x.onload=function(){
    if(x.status!==200){document.getElementById('uptime').textContent='ERR:'+x.status;return;}
    try{
      var d=JSON.parse(x.responseText);
      allData=d.categories||{};
      document.getElementById('uptime').textContent='更新于 '+d.updated;
      buildPage();
    }catch(e){document.getElementById('uptime').textContent='解析错误';console.error(e);}
  };
  x.onerror=function(){document.getElementById('uptime').textContent='网络错误';};
  x.send();
}

function buildPage(){
  // Hotspots
  var sz=Math.min(window.innerWidth*0.7,window.innerHeight*0.6,500);
  var r=sz*0.42,cx=sz/2,cy=sz/2;
  var totalItems=[];
  for(var cat in allData){if(allData[cat])totalItems=totalItems.concat(allData[cat]);}
  var regionCount={};
  totalItems.forEach(function(item){
    var text=(item.title+' '+(item.summary||'')).toLowerCase();
    for(var reg in regionCoords){if(text.indexOf(reg.toLowerCase())>=0)regionCount[reg]=(regionCount[reg]||0)+1;}
  });
  var maxCount=Math.max(1,Math.max.apply(null,Object.values(regionCount)));
  var container=document.createElement('div');
  container.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:8;width:'+sz+'px;height:'+sz+'px;pointer-events:none';
  for(var reg in regionCount){
    var count=regionCount[reg];if(count<2)continue;
    var coord=regionCoords[reg];
    var phi=(90-coord.lat)*Math.PI/180,theta=(coord.lng+180)*Math.PI/180;
    var px=cx+r*Math.sin(phi)*Math.cos(theta),py=cy-r*Math.cos(phi);
    var ratio=count/maxCount;
    var clr=ratio>0.66?'#ff2222':ratio>0.33?'#ff5533':'#ff8844';
    var glow=ratio>0.66?'25px':ratio>0.33?'16px':'10px';
    var sz2=6+ratio*10;
    var hs=document.createElement('div');
    hs.style.cssText='position:absolute;left:'+px+'px;top:'+py+'px;transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto';
    hs.innerHTML='<div style="width:'+sz2+'px;height:'+sz2+'px;border-radius:50%;background:'+clr+';box-shadow:0 0 '+glow+' '+clr+';animation:pulse 2s ease-in-out infinite"></div><div style="position:absolute;left:'+(sz2+6)+'px;top:50%;transform:translateY(-50%);white-space:nowrap;font-size:9px;color:rgba(255,255,255,.5);text-shadow:0 0 8px #000;opacity:0;transition:opacity .3s;pointer-events:none">'+reg+'</div>';
    hs.onmouseenter=function(){this.lastChild.style.opacity='1';};
    hs.onmouseleave=function(){this.lastChild.style.opacity='0';};
    (function(r,count){
      hs.onclick=function(){
        var items=[];
        var l=r.toLowerCase();
        for(var cat in allData)allData[cat].forEach(function(it){if(it.title.toLowerCase().indexOf(l)>=0||(it.summary||'').toLowerCase().indexOf(l)>=0)items.push(it);});
        showNews(r+' ('+items.length+'条)',items);
      };
    })(reg,count);
    container.appendChild(hs);
  }
  document.body.appendChild(container);

  // Category chips
  var scroll=document.getElementById('catScroll');scroll.innerHTML='';
  for(var cat in allData){
    var items=allData[cat];if(!items||!items.length)continue;
    var chip=document.createElement('div');chip.className='cat-chip';
    chip.textContent=cat+' ('+items.length+')';
    (function(c,its){chip.onclick=function(){showNews(c+' ('+its.length+'条)',its);};})(cat,items);
    scroll.appendChild(chip);
  }
}

function showNews(title,items){
  var panel=document.getElementById('newsPanel');
  document.getElementById('npTitle').textContent=title;
  var list=document.getElementById('npList');list.innerHTML='';
  items.slice(0,15).forEach(function(item){
    var d=document.createElement('div');d.className='news-item';
    d.innerHTML='<a href="'+(item.url||'#')+'" target="_blank">'+esc(item.title)+'</a><div class="nsrc">'+esc(item.source||'')+'</div>';
    list.appendChild(d);
  });
  panel.classList.add('show');
}

document.addEventListener('click',function(e){
  var panel=document.getElementById('newsPanel');
  if(panel.classList.contains('show')&&!e.target.closest('.news-panel')&&!e.target.closest('.cat-chip')&&!e.target.closest('[style*="position:absolute"]'))panel.classList.remove('show');
});

document.head.insertAdjacentHTML('beforeend','<style>@keyframes pulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.25);opacity:1}}</style>');

function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML}

console.log('SCRIPT START');
try{
  // Direct call instead of setTimeout
load();
}catch(e){console.error('SETTIMEOUT ERROR:',e);}
console.log('SCRIPT END');