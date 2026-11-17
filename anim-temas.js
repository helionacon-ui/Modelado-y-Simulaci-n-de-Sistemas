/* Modelado y Simulación de Sistemas: una animación por bloque de temas */
(function(){var M=window.MANIM;if(!M)return;var U=M.util,C=M.C,nf=U.nf,lerp=U.lerp,ease=U.ease,seg=U.seg,clamp=U.clamp,RG=U.RG,W=640;
var rs=11;function rn(){rs=(rs*16807)%2147483647;return rs/2147483647-0.5;}

/* T1-2 masa-muelle-amortiguador */
function xm(t,z){var wn=2,wd=wn*Math.sqrt(1-z*z);return Math.exp(-z*wn*t)*(Math.cos(wd*t)+z*wn/wd*Math.sin(wd*t));}
M.reg('ms-mod',M.base({title:'Modelo de un sistema masa-muelle-amortiguador',H:580,dur:18,caps:[[6,'Aplicando la segunda ley de Newton a la masa: <i>m·ẍ + c·ẋ + k·x = F(t)</i>. Es una ecuación diferencial de 2.º orden.'],[12,'Se suelta la masa desplazada sin fuerza exterior: el muelle la devuelve y el amortiguador disipa energía en cada oscilación.'],[99,'Con estados x₁ = x y x₂ = ẋ el modelo queda en espacio de estados: <i>ẋ₁ = x₂</i>, <i>ẋ₂ = (F − kx₁ − cx₂)/m</i>, listo para simular.']]},
 function(D,t){var z=0.15,tt=t*0.8%14,x=xm(tt,z),cx=170+x*70,y=170;D.line(40,y-50,40,y+50,C.ax,4);
  var p=[[40,y-20]];for(var i=1;i<12;i++)p.push([40+(cx-70-40)*i/12,y-20+(i%2?-12:12)]);p.push([cx-30,y-20]);D.path(p,C.f,2);
  D.line(40,y+22,lerp(40,cx-30,0.5),y+22,C.hl,2);D.rect(lerp(40,cx-30,0.5)-14,y+12,28,20,C.hl,null,2);D.line(lerp(40,cx-30,0.5)+14,y+22,cx-30,y+22,C.hl,2);
  D.rect(cx-30,y-40,60,80,C.m,RG(C.m,.2),2.4);D.text('m',cx,y+7,{s:20,a:'center',c:C.m,bold:true});D.line(30,y+44,320,y+44,C.ax,1.4);D.text('k',90,y-40,{s:16,c:C.f});D.text('c',90,y+54,{s:16,c:C.hl});
  var A=U.axes(D,{xr:[0,14],yr:[-1.2,1.2],xt:[5,10],yt:[-1,1],xd:0,yd:0,xl:'t',yl:'x'},{x:80,y:270,w:480,h:180,grid:true});U.plotf(D,A,function(s){return s>tt?NaN:xm(s,z);},C.m,2.6);U.plotf(D,A,function(s){return Math.exp(-z*2*s);},C.mut,1,0.6);U.plotf(D,A,function(s){return -Math.exp(-z*2*s);},C.mut,1,0.6);D.dot(A.X(tt),A.Y(x),5,C.m);
  U.readout(D,['m = 1 kg   k = 4 N/m   c = 0,6 N·s/m    ζ = c/(2√(km)) = 0,15'],520);}));

/* T3-5 identificación de un primer orden */
var ID=[];for(var i3=0;i3<=60;i3++){var tt3=i3*0.25;ID.push([tt3,tt3<1?0:2.5*(1-Math.exp(-(tt3-1)/2.2))+rn()*0.18]);}
M.reg('ms-id',M.base({title:'Identificación: ajustar un modelo a un ensayo',H:560,dur:18,caps:[[6,'Se aplica un escalón de amplitud 1 y se mide la salida (puntos, con ruido). Se busca un modelo <i>K·e<sup>−θs</sup>/(τs + 1)</i>.'],[12,'Ganancia: <i>K = Δy/Δu</i>, el valor final. Retardo θ: lo que tarda en empezar a moverse. Constante τ: tiempo hasta el 63 % del cambio.'],[99,'Se superpone el modelo a los datos y se comprueba el error. Si los residuos tienen forma, el modelo no captura toda la dinámica.']]},
 function(D,t){var A=U.axes(D,{xr:[0,15],yr:[0,3],xt:[5,10,15],yt:[1,2,2.5],xd:0,yd:1,xl:'t (s)',yl:'y'},{x:80,y:96,w:480,h:300,grid:true}),n=Math.floor(seg(t,0.5,5)*61);
  for(var i=0;i<n;i++)D.dot(A.X(ID[i][0]),A.Y(ID[i][1]),3.4,C.f,0.85);
  var a=ease(seg(t,6,8));if(a>0){D.line(A.X(0),A.Y(2.5),A.X(15),A.Y(2.5),C.hl,1.4,[5,4],a);D.text('K = 2,5',A.X(14.8),A.Y(2.5)-8,{s:15,c:C.hl,a:'right',al:a});}
  var b=ease(seg(t,9,11));if(b>0){D.line(A.X(1),A.Y(0),A.X(1),A.Y(3),C.g,1.2,[3,3],b);D.text('θ = 1 s',A.X(1)+4,A.Y(2.85),{s:14,c:C.g,al:b});var y63=0.632*2.5;D.line(A.X(0),A.Y(y63),A.X(3.2),A.Y(y63),C.ok,1.2,[3,3],b);D.line(A.X(3.2),A.Y(0),A.X(3.2),A.Y(y63),C.ok,1.2,[3,3],b);D.text('63 %  →  τ = 2,2 s',A.X(3.4),A.Y(y63)+18,{s:14,c:C.ok,al:b});}
  var c=seg(t,12,16);if(c>0){U.plotf(D,A,function(s){return s>15*c?NaN:(s<1?0:2.5*(1-Math.exp(-(s-1)/2.2)));},C.m,3);}
  U.readout(D,['modelo: G(s) = 2,5·e^{−s}/(2,2s + 1)'],468);}));

/* T6-8 el bucle de un simulador */
var SIM=['x = x0;  t = 0;','while (t < tf) {','   u = entrada(t);','   dx = f(x, u);','   x = x + h*dx;','   t = t + h;  guardar(t, x);','}'];
M.reg('ms-sim',M.base({title:'Programar el simulador: el bucle de integración',H:600,dur:20,caps:[[6,'El simulador repite un bucle: lee la entrada, evalúa las ecuaciones del modelo y avanza el estado un paso h.'],[13,'Cada vuelta del bucle añade un punto a la gráfica. Aquí el modelo es un depósito: <i>ẋ = (u − x)/τ</i>, con τ = 2 s y paso h = 0,25 s.'],[99,'Separar modelo, entrada e integrador permite cambiar uno sin tocar los otros (por ejemplo, Euler por RK4).']]},
 function(D,t){var sp=0.22,N=Math.floor(t/ (sp*4)),ln=2+Math.floor((t/sp)%4),h=0.25,x=0,pts=[];for(var i=0;i<=Math.min(N,40);i++){pts.push([i*h,x]);var u=i*h<1?0:1;x=x+h*(u-x)/2;}
  SIM.forEach(function(l,i){var y=100+i*28,on=i===ln||(i===5&&ln===5);if(on)D.rect(30,y-20,290,26,null,RG(C.y,.14));D.text(l,40,y,{s:13,c:on?C.y:C.w,mono:true,bold:on});});
  var A=U.axes(D,{xr:[0,10.5],yr:[0,1.15],xt:[2,4,6,8,10],yt:[0.5,1],xd:0,yd:1,xl:'t (s)',yl:'x'},{x:350,y:110,w:250,h:200,grid:true});U.plotf(D,A,function(s){return s<1?0:1-Math.exp(-(s-1)/2);},C.mut,1.2,0.6);
  D.path(pts.map(function(p){return [A.X(p[0]),A.Y(p[1])];}),C.m,1.6);pts.forEach(function(p){D.dot(A.X(p[0]),A.Y(p[1]),3,C.m);});
  var L=pts[pts.length-1];U.readout(D,['vuelta '+(pts.length-1)+':  t = '+nf(L[0],2)+' s    x = '+nf(L[1],3),'entrada u: escalón en t = 1 s'],440);}));


/* T9-11 Euler frente a RK4 en un oscilador */
function orbit(h,rk,n){var x=1,v=0,o=[[x,v]];for(var i=0;i<n;i++){if(!rk){var x2=x+h*v,v2=v-h*x;x=x2;v=v2;}else{var f=function(a,b){return [b,-a];},k1=f(x,v),k2=f(x+h/2*k1[0],v+h/2*k1[1]),k3=f(x+h/2*k2[0],v+h/2*k2[1]),k4=f(x+h*k3[0],v+h*k3[1]);x+=h/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);v+=h/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);}o.push([x,v]);}return o;}
var EU=orbit(0.1,false,190),RK=orbit(0.1,true,190);
M.reg('ms-num',M.base({title:'Métodos numéricos: Euler frente a Runge-Kutta 4',H:580,dur:18,caps:[[6,'El oscilador ẍ = −x conserva la energía: su trayectoria en el plano de fase (x, ẋ) es una circunferencia.'],[12,'Euler explícito con h = 0,1 multiplica la energía en cada paso por (1 + h²): la trayectoria se abre en espiral.'],[99,'RK4 evalúa la pendiente cuatro veces por paso (error del orden de h⁴) y sigue la circunferencia casi exactamente.']]},
 function(D,t){var n=Math.floor(seg(t,0.5,16)*190),A=U.axes(D,{xr:[-3,3],yr:[-2.5,2.5],xt:[-2,-1,1,2],yt:[-2,-1,1,2],xd:0,yd:0,xl:'x',yl:'ẋ'},{x:120,y:90,w:400,h:340,grid:true});
  D.ring(A.X(0),A.Y(0),A.X(1)-A.X(0),C.mut,1);var pe=EU.slice(0,n+1).map(function(q){return [A.X(q[0]),A.Y(q[1])];}),pr=RK.slice(0,n+1).map(function(q){return [A.X(q[0]),A.Y(q[1])];});
  U.clipA(D,A,function(){D.path(pe,C.g,2.2);D.path(pr,C.m,3);});var e=EU[n],r=RK[n];D.dot(A.X(e[0]),A.Y(e[1]),5,C.g);D.dot(A.X(r[0]),A.Y(r[1]),5,C.m);
  D.text('Euler',A.X(2.1),A.Y(2.1),{s:16,c:C.g});D.text('RK4',A.X(0.6),A.Y(0.4),{s:16,c:C.m});
  U.readout(D,['t = '+nf(n*0.1,1)+'    energía Euler: '+nf((e[0]*e[0]+e[1]*e[1])/2,3)+'    RK4: '+nf((r[0]*r[0]+r[1]*r[1])/2,4)+'    (exacta 0,5)'],490);}));

/* T12-13 predicción y residuos */
var PD=[];for(var i12=0;i12<=80;i12++){var x12=i12*0.125;PD.push([x12,Math.sin(x12)+0.3*Math.sin(3*x12)+rn()*0.25]);}
M.reg('ms-err',M.base({title:'Análisis del error: residuos del modelo',H:600,dur:18,caps:[[6,'Se compara la salida medida (puntos) con la predicción del modelo. El residuo es la diferencia en cada instante.'],[12,'Con el modelo incompleto (solo la componente lenta) los residuos tienen forma: una oscilación que el modelo no explica.'],[99,'Al añadir la dinámica que faltaba, los residuos se vuelven ruido blanco y el error cuadrático medio baja. Un buen modelo deja solo ruido.']]},
 function(D,t){var full=t>9,mf=function(x){return Math.sin(x)+(full?0.3*Math.sin(3*x):0);},A=U.axes(D,{xr:[0,10],yr:[-1.7,1.7],xt:[],yt:[-1,1],yd:0,xl:'t',yl:'y'},{x:80,y:90,w:480,h:210,grid:true}),B=U.axes(D,{xr:[0,10],yr:[-0.8,0.8],xt:[],yt:[-0.5,0.5],yd:1,xl:'t',yl:'e'},{x:80,y:350,w:480,h:110,grid:true});
  var n=Math.floor(seg(t%9,0.5,7)*81),se=0;U.plotf(D,A,mf,C.m,2.6);for(var i=0;i<81;i++){D.dot(A.X(PD[i][0]),A.Y(PD[i][1]),2.8,C.f,0.8);}
  for(var j=0;j<n;j++){var e=PD[j][1]-mf(PD[j][0]);se+=e*e;D.line(B.X(PD[j][0]),B.Y(0),B.X(PD[j][0]),B.Y(e),C.hl,2);}
  U.readout(D,[(full?'modelo completo':'modelo incompleto')+'    RMSE = '+(n?nf(Math.sqrt(se/n),3):'…')],540);}));
})();
