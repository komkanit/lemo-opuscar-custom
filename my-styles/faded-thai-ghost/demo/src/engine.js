// Faded Thai Ghost Film: one WebGL2 pass that composites a shot and prints it on faded colour film.
// Layers (plate, up to two keyed figures, a lettering canvas), breathing practical light with a code flame,
// fog behind and in front of the figures, then the print: cyan-dye fade, crushed brown blacks, halation,
// colour grain, weave, flicker, scratches, dust, vignette. Print-pass ideas from Silent Film's engine/film.js.
export const W = 1080, H = 1920;

const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FS = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;
uniform sampler2D uPlate, uFig0, uFig1, uText;
uniform vec2 uPlateSize;
uniform vec3 uCam;                 // plate camera: centre x, y (plate px), zoom (screen px per plate px)
uniform vec3 uCamF0, uCamF1;       // per-figure camera (parallax)
uniform vec4 uFigR0, uFigR1;       // figure rect in plate px: x, y, w, h
uniform vec3 uBreath0, uBreath1;   // breath scale, pivot x, pivot y (plate px)
uniform vec4 uShadow0, uShadow1;   // contact shadow: cx, cy, rx, ry (plate px)
uniform float uFigOn0, uFigOn1, uShadowA0, uShadowA1;
uniform vec4 uFig0Tint, uFig1Tint; // rgb multiply, a = opacity
uniform vec3 uLamp;                // lamp x, y (plate px), on (0..1)
uniform float uFlick, uFlame, uLampR;
uniform float uFogBack, uFogFront, uT, uFrame, uDmg, uExpo, uTextOn, uDark;
uniform vec2 uWeave;
uniform sampler2D uPlateB, uMaskB; // same shot twice: the edited plate, used only inside its change mask
uniform float uB, uGhostPale;
uniform vec4 uSwayR;               // a cloth that sways (plate px x0, y0, x1, y1), hung from its top edge
uniform float uSway;

float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a*vn(p); p = p*2.03 + 17.1; a *= .5; } return s; }

vec2 toPlate(vec2 sp, vec3 cam){ return cam.xy + (sp - uRes*.5) / cam.z; }
vec2 toScreen(vec2 pp, vec3 cam){ return (pp - cam.xy)*cam.z + uRes*.5; }

vec4 fig(sampler2D tex, vec2 sp, vec3 cam, vec4 r, vec3 br){
  vec2 pp = toPlate(sp, cam);
  pp = br.yz + (pp - br.yz) / br.x;                       // breathe around the feet
  vec2 uv = (pp - r.xy) / r.zw;
  if (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) return vec4(0);
  return texture(tex, uv);
}

void main(){
  vec2 sp = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) - uWeave;
  vec2 pp = toPlate(sp, uCam);
  vec2 ps = pp;
  if (uSway > 0.) {                                         // cloth sway: more at the hem, nothing at the hanging point
    float hang = clamp((pp.y - uSwayR.y) / (uSwayR.w - uSwayR.y), 0., 1.);
    float inX = smoothstep(uSwayR.x, uSwayR.x + 90., pp.x) * smoothstep(uSwayR.z + 40., uSwayR.z - 40., pp.x);
    float inY = smoothstep(uSwayR.y, uSwayR.y + 60., pp.y) * smoothstep(uSwayR.w + 30., uSwayR.w - 30., pp.y);
    float w = sin(pp.y*.011 - uT*1.9) + .6*sin(pp.y*.023 + pp.x*.004 - uT*3.1);
    ps.x += w * uSway * hang * inX * inY;
  }
  vec3 c = texture(uPlate, ps / uPlateSize).rgb;
  if (uB > 0.) {
    float mk = texture(uMaskB, pp / uPlateSize).r * uB;
    vec3 cb = texture(uPlateB, ps / uPlateSize).rgb;
    float lb = dot(cb, vec3(.3, .59, .11));
    float chg = smoothstep(.02, .10, length(cb - c));
    cb = mix(cb, (vec3(lb) * 1.7 + .025) * vec3(.92, .97, .95), uGhostPale * chg);   // what changed is drained of colour and lifted, a pale shape
    c = mix(c, cb, mk);
  }
  c = pow(c, vec3(2.2));                                    // work in linear light

  // practical light: the flame breathes and relights everything near it
  vec2 ls = toScreen(uLamp.xy, uCam);
  float d = length(sp - ls);
  float fall = exp(-d / (uLampR*uCam.z));
  float lampK = mix(1., uFlick, .35 + .65*fall);
  float on = uLamp.z;
  float dark = .008;                                        // with the lamp out only the print's black (and its grain) remains
  c *= mix(dark, lampK, on);

  // fog behind the figures
  vec2 fq = pp*.0026 + vec2(uT*.035, -uT*.012);
  float fogB = smoothstep(.45, .85, fbm(fq)) * uFogBack;
  vec3 fogC = vec3(.30, .25, .19) * (.06 + 1.1*fall*on*uFlick);
  c = mix(c, fogC, fogB*.45);

  // figures: contact shadow first, then the keyed layer
  if (uFigOn0 > 0.) {
    vec2 q = (toPlate(sp, uCamF0) - uShadow0.xy) / uShadow0.zw;
    c *= 1. - uShadowA0 * smoothstep(1., .15, length(q));
    vec4 f = fig(uFig0, sp, uCamF0, uFigR0, uBreath0);
    vec3 fc = pow(f.rgb, vec3(2.2)) * uFig0Tint.rgb * mix(dark, lampK, on);
    c = mix(c, fc, f.a * uFig0Tint.a * uFigOn0);
  }
  if (uFigOn1 > 0.) {
    vec2 q = (toPlate(sp, uCamF1) - uShadow1.xy) / uShadow1.zw;
    c *= 1. - uShadowA1 * smoothstep(1., .15, length(q));
    vec4 f = fig(uFig1, sp, uCamF1, uFigR1, uBreath1);
    vec3 fc = pow(f.rgb, vec3(2.2)) * uFig1Tint.rgb * mix(dark, lampK, on);
    c = mix(c, fc, f.a * uFig1Tint.a * uFigOn1);
  }

  // the code flame over the painted one: a wobbling teardrop with an orange core and a yellow tip
  if (on > 0.) {
    float sz = 30. * uCam.z * uFlame;
    vec2 fp = (sp - ls) / sz;
    fp.x += .18*sin(uT*9.1 + fp.y*2.)*(-fp.y)*.6;
    float tear = length(vec2(fp.x*(1.7 + max(-fp.y, 0.)*1.1), fp.y*.9 + .15));
    float core = smoothstep(.95, .2, tear) * on;
    vec3 flameC = mix(vec3(1., .45, .10), vec3(1., .86, .55), smoothstep(.6, .0, tear));
    c += flameC * core * 1.6 * uFlick;
    c += vec3(1., .5, .16) * exp(-d / (55.*uCam.z)) * .55 * on * uFlick;   // glow
  }

  // fog in front, thinner
  float fogF = smoothstep(.55, .95, fbm(fq*1.6 + vec2(3.1, uT*.02))) * uFogFront;
  c = mix(c, fogC*1.2, fogF*.22);

  c = pow(max(c, 0.), vec3(1./2.2));


  // ---- print: faded colour stock ----
  c *= uExpo * (1. - uDark);
  float l = dot(c, vec3(.299, .587, .114));
  c = vec3(c.r*1.02 + .03, c.g*.95, c.b*.74);              // cyan dye gone: red/yellow lift, blue sinks
  float warm = smoothstep(.30, .75, l) * clamp((c.r - c.b)*2.2, 0., 1.);
  c = mix(vec3(l), c, .60 + .55*warm);                     // faded, except warm light
  c = mix(c, smoothstep(.0, 1., c), .75);                  // print contrast
  vec3 SH = vec3(.078, .047, .031), CR = vec3(.941, .878, .745);
  c = SH + (CR - SH) * c;
  c += vec3(.85, .30, .08) * exp(-d / (140.*uCam.z)) * .22 * on * uFlick;   // halation
  vec2 uv = sp / uRes;
  c *= 1. - .55*pow(length((uv - .5)*vec2(1.05, .82))*1.3, 2.4);           // vignette

  // the title: on the print (weave, grain, scratches) but not faded, so its white stays white
  if (uTextOn > 0.) { vec4 tx = texture(uText, sp / uRes); c = mix(c, tx.rgb * uExpo * (1. - uDark), tx.a*uTextOn); l = mix(l, dot(tx.rgb, vec3(.3,.59,.11)), tx.a*uTextOn); }
  // grain (colour, stronger in the mids), scratches and dust
  float fr = uFrame;
  float mid = .35 + 2.6*l*(1. - l);
  vec3 g3 = vec3(h21(sp + fr*1.31), h21(sp*1.07 + fr*2.17 + 3.), h21(sp*.93 + fr*.73 + 7.)) - .5;
  float gc = vn(sp*.45 + fr*5.3) - .5;
  c += (g3*.05 + gc*.06) * mid * (.6 + uDmg);
  for (int i = 0; i < 3; i++) {
    float fi = float(i), life = floor((fr + fi*17.) / (6. + fi*3.));
    float on2 = step(.80 - .25*uDmg, h21(vec2(life, fi*7.1)));
    float x = h21(vec2(life*1.7, fi)) * uRes.x;
    float y0 = h21(vec2(life, fi + 2.)) * uRes.y, len = 200. + 900.*h21(vec2(life, fi + 5.));
    float line = smoothstep(1.4, .3, abs(sp.x - x - sin(sp.y*.01 + fi)*2.)) * step(y0, sp.y) * step(sp.y, y0 + len);
    c += (h21(vec2(life, 9.)) > .5 ? .10 : -.07) * line * on2 * uDmg;
  }
  vec2 cell = floor(sp / 6.);
  float dust = step(.99985 - .0002*uDmg, h21(cell + floor(fr)*3.7));
  c = mix(c, vec3(.06, .04, .03), dust * .7);
  o = vec4(clamp(c, 0., 1.), 1.);
}`;

export class Film {
  constructor(canvas) {
    canvas.width = W; canvas.height = H;
    const gl = this.gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x);
      if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const pr = this.pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr); gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.U = new Proxy({}, { get: (_, k) => gl.getUniformLocation(pr, k) });
    this.tex = {}; this.size = {};
    this.empty = this.makeTex(Object.assign(document.createElement('canvas'), { width: 2, height: 2 }));
  }
  makeTex(src) {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  async load(name, url) {
    const im = new Image(); im.src = url; await im.decode();
    this.tex[name] = this.makeTex(im); this.size[name] = [im.width, im.height];
  }
  updateText(canvas) {
    const gl = this.gl;
    if (!this.textTex) this.textTex = this.makeTex(canvas);
    gl.bindTexture(gl.TEXTURE_2D, this.textTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }
  // s = { plate, cam:[cx,cy,z], cam0:[cx,cy,z], figs:[{tex, rect:[x,y,w,h], k, breath, pivot:[x,y], shadow:[cx,cy,rx,ry,a], tint:[r,g,b,a]}],
  //       lamp:{x,y,on,flick,flame,r}, fogBack, fogFront, t, frame, dmg, expo, weave:[x,y], text:0..1, dark:0..1 }
  draw(s) {
    const gl = this.gl, U = this.U, f1 = (k, v) => gl.uniform1f(U[k], v);
    const bind = (unit, name, tex) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U[name], unit); };
    gl.viewport(0, 0, W, H);
    gl.uniform2f(U.uRes, W, H);
    bind(0, 'uPlate', this.tex[s.plate]); gl.uniform2f(U.uPlateSize, ...this.size[s.plate]);
    const [cx, cy, z] = s.cam, [cx0, cy0, z0] = s.cam0 || s.cam;
    gl.uniform3f(U.uCam, cx, cy, z);
    for (let i = 0; i < 2; i++) {
      const fg = (s.figs || [])[i];
      f1('uFigOn' + i, fg ? (fg.on ?? 1) : 0);
      bind(1 + i, 'uFig' + i, fg ? this.tex[fg.tex] : this.empty);
      if (!fg) continue;
      const k = fg.k ?? 1;
      gl.uniform3f(U['uCamF' + i], cx0 + (cx - cx0) * k, cy0 + (cy - cy0) * k, z * (1 + (k - 1) * (z / z0 - 1)));
      gl.uniform4f(U['uFigR' + i], ...fg.rect);
      gl.uniform3f(U['uBreath' + i], fg.breath ?? 1, ...(fg.pivot || [0, 0]));
      const sd = fg.shadow || [0, 0, 1, 1, 0];
      gl.uniform4f(U['uShadow' + i], sd[0], sd[1], sd[2], sd[3]); f1('uShadowA' + i, sd[4]);
      gl.uniform4f(U['uFig' + i + 'Tint'], ...(fg.tint || [1, 1, 1, 1]));
    }
    bind(3, 'uText', this.textTex || this.empty); f1('uTextOn', s.text ?? 0);
    const B = s.plateB;   // { tex, mask, on, pale }
    bind(4, 'uPlateB', B ? this.tex[B.tex] : this.empty); bind(5, 'uMaskB', B ? this.tex[B.mask] : this.empty);
    f1('uB', B ? (B.on ?? 1) : 0); f1('uGhostPale', B ? (B.pale ?? .7) : 0);
    gl.uniform4f(U.uSwayR, ...(s.sway?.rect || [0, 0, 1, 1])); f1('uSway', s.sway?.amp ?? 0);
    const L = s.lamp || { x: -9999, y: -9999, on: 0 };
    gl.uniform3f(U.uLamp, L.x, L.y, L.on ?? 1);
    f1('uFlick', L.flick ?? 1); f1('uFlame', L.flame ?? 1); f1('uLampR', L.r ?? 600);
    f1('uFogBack', s.fogBack ?? 0); f1('uFogFront', s.fogFront ?? 0);
    f1('uT', s.t); f1('uFrame', s.frame); f1('uDmg', s.dmg ?? .3); f1('uExpo', s.expo ?? 1); f1('uDark', s.dark ?? 0);
    gl.uniform2f(U.uWeave, ...(s.weave || [0, 0]));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

// deterministic helpers
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; };
// the flame's breath: two octaves plus rare dips; `ragged` 0 = calm, 1 = frightened
export function flicker(t, ragged = 0) {
  const a = noise1(t * 1.3) - .5, b = noise1(t * 5.7 + 40) - .5, c = noise1(t * 13 + 90) - .5;
  const dip = Math.max(0, noise1(t * .7 + 200) - (.82 - .25 * ragged)) * 3.5;
  return 1 + a * .16 + b * (.07 + .10 * ragged) + c * .05 * ragged - dip * .35;
}
export function weave(frame, dmg) {
  const k = .6 + 1.4 * dmg;
  return [(noise1(frame * .21) - .5) * 1.4 * k, (noise1(frame * .17 + 50) - .5) * 1.8 * k];
}
