const scenes = {
  camp: ["#ebb466", `
    <path fill="#284838" d="M18 91 54 41l28 34 26-28 33 44h122v14H18z"/>
    <path fill="#4e7950" d="m151 93 25-37 18 28 24-42 31 51z"/>
    <path fill="#d19764" d="m84 98 58-18 35 14-61 12z"/>
    <path fill="#a76b49" d="m92 93 61-7 6 8-64 7z"/>
    <path fill="#e48242" d="M122 91c-22 0-20-19-9-29l2 9c-1-16 8-27 14-32-2 16 15 18 15 35 0 10-9 17-22 17z"/>
    <path fill="#ffcf79" d="M124 91c-11 0-14-9-6-19l3 5 7-14c0 8 7 12 7 20 0 5-6 8-11 8z"/>`],
  village: ["#a6cb78", `
    <path fill="#355940" d="m21 97 67-34 87-11 88 39-44 15H49z"/>
    <path fill="#a16c4b" d="m45 87 30-32 29 30v15H45zm113 3 41-44 40 42v12h-81z"/>
    <path fill="#d3ae7a" d="M50 83h49v17H50zm112 4h73v13h-73z"/>
    <path fill="#765947" d="m43 86 32-34 32 34h-9L75 64 52 86zm109 3 47-46 46 46h-13l-33-32-33 32z"/>
    <path fill="#395447" d="M69 87h12v13H69zm120 3h16v10h-16z"/>
    <path fill="#73a971" d="m115 49 12-21 12 21h-7l12 18h-33l12-18z"/>`],
  research: ["#7fcece", `
    <path fill="#335451" d="M35 92h218v10H35z"/>
    <path fill="#8cb5ae" d="M87 42h26v6l-7 6v16l15 19c3 5 0 9-6 9H83c-6 0-9-4-6-9l15-19V54l-5-6z"/>
    <path fill="#4f958a" d="M88 77q13-7 24 0l12 16-7 5H82l-7-5z"/>
    <path fill="#d0e8cf" d="M93 51h6v24l-8 10-6 2 8-14z"/>
    <path fill="#6893ad" d="m149 92 16-2V78h24a25 25 0 0 0 7-47l-4 8a16 16 0 0 1-4 31h-21v10h-18z"/>
    <path fill="#b3c8ca" d="m162 68 17-40 12 5-18 39zM179 29l3-7 12 5-3 7z"/>
    <path fill="#b4e7c9" d="M102 84h4v4h-4zm10-9h3v3h-3z"/>`],
  workshop: ["#e1ad70", `
    <path fill="#634f43" d="M35 92h214v11H35z"/>
    <path fill="#77908b" d="M73 61h83l21-9-5 16-22 13-4 13H92l5-13-17-6z"/>
    <path fill="#b0bdb0" d="M73 61h83l21-9-22 16H81z"/>
    <path fill="#ab734a" d="m151 86 49-51 8 8-49 52z"/>
    <path fill="#d0a971" d="m182 43 13-15 25 21-13 15z"/>
    <path fill="#f1d596" d="m69 42 4 7-8-1zm37-10 8 2-5 6zm36 13 6-8 3 8z"/>`],
  market: ["#e7c482", `
    <path fill="#9d7453" d="M52 55h156v45H52z"/>
    <path fill="#665849" d="M68 65h124v25H68z"/>
    <path fill="#bb875f" d="m44 60 16-26h140l16 26z"/>
    <path fill="#e6bc83" d="m44 60 16-26h18l-10 26zm48 0 5-26h18l1 26zm48 0-4-26h19l9 26zm48 0-12-26h18l18 26z"/>
    <path fill="#e8bb65" d="M92 76h28v14H92zm43-9h26v23h-26z"/>`],
  trails: ["#e6ad7f", `
    <path fill="#495448" d="m38 96 63-66 19 25 27-36 74 77z"/>
    <path fill="#7f8971" d="m65 96 54-66 18 16 15-25 51 75z"/>
    <path fill="#d6b18b" d="m108 45 11-15 18 16-7 7-11-6zm29-1 15-23 15 22-14-5-9 7z"/>
    <path fill="#df8d6c" d="M175 13h41l-9 10 9 10h-41z"/>
    <path stroke="#c8aa86" stroke-width="4" d="M176 12v51"/>`],
};

export const tabArt = Object.fromEntries(Object.entries(scenes).map(([id, [accent, art]]) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 108"><circle cx="140" cy="53" r="48" fill="${accent}" opacity=".11"/><path d="m45 28 3 6-3 6-3-6zm180 4 3 6-3 6-3-6z" fill="${accent}" opacity=".5"/>${art}</svg>`;
  return [id, `data:image/svg+xml,${encodeURIComponent(svg)}`];
}));
