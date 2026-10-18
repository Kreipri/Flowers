import React from 'react';

// Both SVG menus and Canvas sprites trace these exact silhouettes. A rounded,
// nearly level fringe makes the guy's bowl cut distinct; the girl's asymmetric
// swept fringe and scalloped back create a side part and shoulder-length waves.
export const CHARACTER_HAIR = {
  boy: 'M-30-11Q-33-48 0-48Q33-48 30-11L30-4Q25-1 22-9L22-17Q0-9-22-17L-22-9Q-25-1-30-4Z',
  girlBack: 'M-29-22Q-40 0-32 14Q-41 31-25 43Q-19 48-13 40L19 43Q38 39 32 22Q43 6 31-9Q33-43 4-47Q-23-50-29-22Z',
  girlFront: 'M-29-11Q-37-47-2-49Q31-51 30-10L24-16Q13-22 7-37Q-2-18-29-11Z',
};

// Shared, outline-free artwork keeps the intro, HUD, and ending in one visual family.
export function Heart({ x = 0, y = 0, size = 1, color = '#dc8c9c' }) {
  return <path transform={`translate(${x} ${y}) scale(${size})`} d="M0 12C-30-6-15-27 0-13C15-27 30-6 0 12Z" fill={color}/>;
}

export function Flower({ x = 0, y = 0, size = 1, rose = false }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    {Array.from({ length: rose ? 6 : 10 }, (_, i) => <ellipse key={i} cy={rose ? -12 : -23} rx={rose ? 21 : 10} ry={rose ? 20 : 18} fill={rose ? '#d9828e' : '#f5cb79'} transform={`rotate(${i * (rose ? 60 : 36)})`}/>)}
    <circle r={rose ? 22 : 21} fill={rose ? '#c66b7b' : '#b88761'}/>
    {rose ? <path d="M-12 0Q-12-14 2-11Q16-9 10 3Q7 11-3 6" fill="none" stroke="#e9a0a5" strokeWidth="6" strokeLinecap="round"/> : <g fill="#745b50"><circle cx="-6" cy="-2" r="2"/><circle cx="6" cy="-2" r="2"/><path d="M-4 5Q0 9 4 5" fill="none" stroke="#745b50" strokeWidth="2" strokeLinecap="round"/></g>}
  </g>;
}

export function Filler({ x, y, size = 1 }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>{[0, 72, 144, 216, 288].map(a => <ellipse key={a} cy="-8" rx="6" ry="8" fill="#fffaf0" transform={`rotate(${a})`}/>)}<circle r="5" fill="#e9be72"/></g>;
}

export function Leaf({ x, y, rotate = 0, size = 1 }) {
  return <path transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size})`} d="M0 0C-39-4-46-40-27-57C4-49 20-18 0 0Z" fill="#94b69b"/>;
}

export function Bouquet({ front = false }) {
  return <svg viewBox="0 0 420 460" aria-hidden="true">
    {front ? <>
      <Leaf x={87} y={292} rotate={-65}/><Leaf x={333} y={293} rotate={100}/>
      <Flower x={101} y={244} size={.88} rose/><Flower x={305} y={253} size={.9} rose/>
      <Flower x={153} y={288} size={.95}/><Flower x={249} y={291} size={1.1} rose/>
      <Filler x={73} y={288}/><Filler x={335} y={306}/><Filler x={211} y={272}/>
      <path d="M82 310Q210 352 339 310L245 432Q210 453 176 432Z" fill="#c4d9bd"/>
      <path d="M210 342Q280 337 339 310L245 432Q223 442 210 442Z" fill="#a7c7a9"/>
      <path d="M186 400Q151 370 149 395Q148 419 199 409M228 401Q263 372 269 396Q273 418 221 410" fill="#e5a0a5"/>
      <path d="M199 409L182 441M221 409L240 441" stroke="#dc929d" strokeWidth="11" strokeLinecap="round"/>
      <rect x="194" y="396" width="32" height="22" rx="10" fill="#cf8191"/>
    </> : <>
      <path d="M210 423L49 189Q50 167 73 177L210 225L347 177Q373 169 369 193Z" fill="#e2e8cf"/>
      {[[76,212,-40],[110,157,-20],[190,139,0],[278,155,65],[346,219,100],[64,280,-75],[352,283,115]].map(([x,y,r],i) => <Leaf key={i} x={x} y={y} rotate={r} size={1.15}/>)}
      <path d="M210 410L105 164M210 410L203 137M210 410L310 176" stroke="#94b69b" strokeWidth="8" strokeLinecap="round"/>
      <Flower x={107} y={188}/><Flower x={212} y={145} size={1.08}/><Flower x={310} y={196} size={.9}/>
      <Flower x={161} y={216} size={1.05} rose/><Flower x={263} y={223} size={1.12} rose/>
      <Filler x={57} y={220}/><Filler x={153} y={137}/><Filler x={275} y={136}/><Filler x={356} y={239}/>
      <Filler x={197} y={236} size={.8}/><Filler x={124} y={287} size={.7}/>
    </>}
  </svg>;
}

export function Character({ girl = false, x = 0, y = 0, size = 1 }) {
  const hoodie = girl ? '#93465a' : '#a6a9b1';
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    {girl && <path d={CHARACTER_HAIR.girlBack} fill="#393840"/>}
    <rect x="-20" y="40" width="16" height="25" rx="7" fill="#777888"/><rect x="4" y="40" width="16" height="25" rx="7" fill="#777888"/>
    <rect x="-27" y="9" width="54" height="42" rx="19" fill={hoodie}/>
    <path d="M-19 22L-30 38M19 22L30 38" stroke={hoodie} strokeWidth="15" strokeLinecap="round"/>
    <circle cy="-14" r="29" fill="#f2cfb8"/>
    <path d={girl ? CHARACTER_HAIR.girlFront : CHARACTER_HAIR.boy} fill="#393840"/>
    {girl && <path d="M7-40Q-5-27-23-23" fill="none" stroke="#53505b" strokeWidth="2" strokeLinecap="round"/>}
    <ellipse cx="-17" cy="-5" rx="6" ry="3.5" fill="#e8a8a7"/><ellipse cx="17" cy="-5" rx="6" ry="3.5" fill="#e8a8a7"/>
    <path d="M-12-9q4-6 8 0M5-9q4-6 8 0M-4 0q4 5 8 0" fill="none" stroke="#745c59" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M-5 21L-5 31M5 21L5 31" stroke="#eee4dc" strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="-12" y="35" width="24" height="10" rx="5" fill={girl ? '#854154' : '#9599a3'}/>
  </g>;
}

export function Icon({ name, size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'heart' ? <path fill="currentColor" stroke="none" d="M12 21C-5 10 3-3 12 5C21-3 29 10 12 21Z"/> : name === 'pause' ? <><path d="M8 5v14M16 5v14"/></> : name === 'play' ? <path d="m8 5 11 7-11 7Z" fill="currentColor"/> : name === 'home' ? <><rect x="3" y="5" width="18" height="14" rx="4"/><path d="m4 7 8 6 8-6"/></> : name === 'muted' ? <><path d="M11 4 5 9H2v6h3l6 5ZM16 9l6 6m0-6-6 6"/></> : <><path d="M11 4 5 9H2v6h3l6 5ZM16 8q5 4 0 8M19 4q9 8 0 16"/></>}
  </svg>;
}
