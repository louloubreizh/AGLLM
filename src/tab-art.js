const scenes = {
  Bonfire: ["#ebb466", `
    <path fill="#284838" d="M18 91 54 41l28 34 26-28 33 44h122v14H18z"/>
    <path fill="#4e7950" d="m151 93 25-37 18 28 24-42 31 51z"/>
    <path fill="#d19764" d="m84 98 58-18 35 14-61 12z"/>
    <path fill="#a76b49" d="m92 93 61-7 6 8-64 7z"/>
    <path fill="#e48242" d="M122 91c-22 0-20-19-9-29l2 9c-1-16 8-27 14-32-2 16 15 18 15 35 0 10-9 17-22 17z"/>
    <path fill="#ffcf79" d="M124 91c-11 0-14-9-6-19l3 5 7-14c0 8 7 12 7 20 0 5-6 8-11 8z"/>`],
  Village: ["#a6cb78", `
    <path fill="#355940" d="m21 97 67-34 87-11 88 39-44 15H49z"/>
    <path fill="#a16c4b" d="m45 87 30-32 29 30v15H45zm113 3 41-44 40 42v12h-81z"/>
    <path fill="#d3ae7a" d="M50 83h49v17H50zm112 4h73v13h-73z"/>
    <path fill="#765947" d="m43 86 32-34 32 34h-9L75 64 52 86zm109 3 47-46 46 46h-13l-33-32-33 32z"/>
    <path fill="#395447" d="M69 87h12v13H69zm120 3h16v10h-16z"/>
    <path fill="#73a971" d="m115 49 12-21 12 21h-7l12 18h-33l12-18z"/>`],
  Science: ["#7fcece", `
    <path fill="#335451" d="M35 92h218v10H35z"/>
    <path fill="#8cb5ae" d="M87 42h26v6l-7 6v16l15 19c3 5 0 9-6 9H83c-6 0-9-4-6-9l15-19V54l-5-6z"/>
    <path fill="#4f958a" d="M88 77q13-7 24 0l12 16-7 5H82l-7-5z"/>
    <path fill="#d0e8cf" d="M93 51h6v24l-8 10-6 2 8-14z"/>
    <path fill="#6893ad" d="m149 92 16-2V78h24a25 25 0 0 0 7-47l-4 8a16 16 0 0 1-4 31h-21v10h-18z"/>
    <path fill="#b3c8ca" d="m162 68 17-40 12 5-18 39zM179 29l3-7 12 5-3 7z"/>
    <path fill="#b4e7c9" d="M102 84h4v4h-4zm10-9h3v3h-3z"/>`],
  Workshop: ["#e1ad70", `
    <path fill="#634f43" d="M35 92h214v11H35z"/>
    <path fill="#77908b" d="M73 61h83l21-9-5 16-22 13-4 13H92l5-13-17-6z"/>
    <path fill="#b0bdb0" d="M73 61h83l21-9-22 16H81z"/>
    <path fill="#ab734a" d="m151 86 49-51 8 8-49 52z"/>
    <path fill="#d0a971" d="m182 43 13-15 25 21-13 15z"/>
    <path fill="#f1d596" d="m69 42 4 7-8-1zm37-10 8 2-5 6zm36 13 6-8 3 8z"/>`],
  Trade: ["#e7c482", `
    <path fill="#9d7453" d="M52 55h156v45H52z"/>
    <path fill="#665849" d="M68 65h124v25H68z"/>
    <path fill="#bb875f" d="m44 60 16-26h140l16 26z"/>
    <path fill="#e6bc83" d="m44 60 16-26h18l-10 26zm48 0 5-26h18l1 26zm48 0-4-26h19l9 26zm48 0-12-26h18l18 26z"/>
    <path fill="#e8bb65" d="M92 76h28v14H92zm43-9h26v23h-26z"/>`],
  Religion: ["#e4cb9d", `
    <path fill="#987f60" d="M51 91h177v10H51z"/>
    <path fill="#bead8a" d="M67 51h144v39H67z"/>
    <path fill="#ddc99c" d="m55 54 84-31 85 31z"/>
    <path fill="#736b59" d="M82 55h10v37H82zm33 0h10v37h-10zm34 0h10v37h-10zm34 0h10v37h-10z"/>
    <path fill="#efe0ad" d="M139 7l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/>`],
  Space: ["#a5bde6", `
    <path fill="#405779" d="M41 89q85-31 197 0v14H41z"/>
    <circle cx="206" cy="39" r="20" fill="#687bac"/>
    <path fill="none" stroke="#b1afdd" stroke-width="4" d="M177 47c12-18 61-27 64-17s-49 31-64 17z"/>
    <path fill="#a7bed5" d="M103 80c-9-23 3-50 26-64 20 22 26 43 12 64z"/>
    <path fill="#6e88b0" d="M108 66 88 88l24 2zm31 0 19 22-20 2z"/>
    <circle cx="126" cy="44" r="8" fill="#436187"/>
    <path fill="#f0bd76" d="m114 82 3 18 8-8 6 8 8-18z"/>`],
  Time: ["#c4b4e2", `
    <path fill="#595775" d="M90 20h98v9H90zm0 66h98v9H90z"/>
    <path fill="#8f8ab7" d="M102 29h74c-2 15-13 19-29 29 17 10 26 16 29 28h-74c1-12 13-18 29-28-16-12-26-16-29-29z"/>
    <path fill="#dfc18a" d="M111 39h55c-6 7-16 11-28 18zm7 42 20-17 22 17z"/>
    <path fill="#c6b5e1" d="m59 51 7-12 6 12-6 12zm150-9 8-15 7 15-7 16z"/>`],
  Challenges: ["#e6ad7f", `
    <path fill="#495448" d="m38 96 63-66 19 25 27-36 74 77z"/>
    <path fill="#7f8971" d="m65 96 54-66 18 16 15-25 51 75z"/>
    <path fill="#d6b18b" d="m108 45 11-15 18 16-7 7-11-6zm29-1 15-23 15 22-14-5-9 7z"/>
    <path fill="#df8d6c" d="M175 13h41l-9 10 9 10h-41z"/>
    <path stroke="#c8aa86" stroke-width="4" d="M176 12v51"/>`],
  Achievements: ["#f0cc7f", `
    <path fill="#a7794f" d="M111 75h42v15h-42zm-12 13h66v10H99z"/>
    <path fill="#e3aa5d" d="M94 24h77v18c0 23-16 38-39 38S94 65 94 42z"/>
    <path fill="none" stroke="#b38350" stroke-width="8" d="M94 35H75c0 22 10 31 29 32m67-32h19c0 22-10 31-29 32"/>
    <path fill="#ffe4a4" d="m133 33 6 11 13 2-10 9 2 13-11-6-12 6 2-13-9-9 13-2z"/>`],
  Stats: ["#8aceac", `
    <path fill="#4c6960" d="M63 14h149v85H63z"/>
    <path fill="#253c38" d="M72 23h130v66H72z"/>
    <path fill="#6cae91" d="M89 67h21v18H89zm35-15h21v33h-21zm35-22h21v55h-21z"/>
    <path fill="none" stroke="#c3dd9d" stroke-width="4" d="m88 60 42-18 34-17 17 3"/>`],
  Queue: ["#9bc9bb", `
    <path fill="#507366" d="M74 14h131v82H74z"/>
    <path fill="#b9d5bc" d="M89 29h94v12H89zm0 22h75v12H89zm0 22h55v12H89z"/>
    <path fill="#e0b77e" d="m167 66 21 13-21 13z"/>`],
  Settings: ["#9dbdc5", `
    <path fill="#547078" d="M61 21h145v10H61zm0 29h145v10H61zm0 29h145v10H61z"/>
    <path fill="#bdd2c5" d="M85 14h21v24H85zm62 29h21v24h-21zm-25 29h21v24h-21z"/>`],
};

export const tabArt = Object.fromEntries(Object.entries(scenes).map(([id, [accent, art]]) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 108"><circle cx="140" cy="53" r="48" fill="${accent}" opacity=".11"/><path d="m45 28 3 6-3 6-3-6zm180 4 3 6-3 6-3-6z" fill="${accent}" opacity=".5"/>${art}</svg>`;
  return [id, { accent, image: `data:image/svg+xml,${encodeURIComponent(svg)}` }];
}));
