// ==========================================================================
// Content Lab: js/smoke.js
// Subtiele WebGL2 rook-animatie achter de homepage-hero.
// Vertaald uit de aangeleverde React/TSX-component naar vanilla JS.
// De shader zelf is ongewijzigd; alleen de React-wrapper is vervangen.
// Progressive enhancement: faalt WebGL, dan gebeurt er niets en blijft
// de crème hero-achtergrond gewoon staan (tekst altijd zichtbaar).
// ==========================================================================

(function () {
  const canvas = document.getElementById('hero-smoke');
  if (!canvas) return;

  // Respecteer prefers-reduced-motion: geen animatie voor wie dat wil.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const gl = canvas.getContext('webgl2');
  if (!gl) return; // Geen WebGL2 → stil terugvallen, hero blijft crème.

  const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;
uniform vec3 u_base;
#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)
float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}
void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);
  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);
  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);
  col=mix(col, u_color, dot(col,vec3(.21,.71,.07)));
  col=mix(vec3(.08),col,min(time*.1,1.));
  col=clamp(col,.08,1.);
  col = 1.0 - col;
  col = mix(u_base, col, 0.35);
  O=vec4(col,1);
}`;

  const vertexSrc = "#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}";
  const vertices = [-1, 1, -1, -1, 1, 1, 1, -1];

  const color = [0.55, 0.50, 0.47];   // gedempte grijs-taupe rookslierten
  const base = [0.945, 0.913, 0.89];  // #F1E9E3 site-achtergrond

  function compile(src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vs = compile(vertexSrc, gl.VERTEX_SHADER);
  const fs = compile(fragmentShaderSource, gl.FRAGMENT_SHADER);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(program, 'time');
  const uResolution = gl.getUniformLocation(program, 'resolution');
  const uColor = gl.getUniformLocation(program, 'u_color');
  const uBase = gl.getUniformLocation(program, 'u_base');

  function resize() {
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize);
  resize();

  const start = performance.now();
  let running = true;
  let rafId;

  // Pauzeer als de hero uit beeld is (bespaart accu/CPU).
  const hero = canvas.closest('.hero');
  if (hero && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      running = entries[0].isIntersecting;
      if (running) loop();
    }, { threshold: 0 });
    io.observe(hero);
  }

  function loop() {
    if (!running) return;
    const t = (performance.now() - start) / 1000;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform3fv(uColor, color);
    gl.uniform3fv(uBase, base);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(loop);
  }

  loop();
})();
