import { Color, MeshStandardMaterial } from "three";

export function createWaterMaterial(color, time, { river = false, background } = {}) {
  const material = new MeshStandardMaterial({ color, roughness: 0.31, metalness: 0.08, fog: river });
  material.name = river ? "Flowing water" : "Lake water";
  material.customProgramCacheKey = () => river ? "river" : "lake";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.waterTime = time;
    if (!river) shader.uniforms.waterHorizon = { value: new Color(background) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>
        varying vec2 vWaterPosition;
        varying vec2 vWaterUv;
      `)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vWaterPosition = (modelMatrix * vec4(transformed, 1.0)).xz;
        vWaterUv = uv;
      `);

    const shallows = river
      ? "smoothstep(0.57, 1.0, abs(vWaterUv.x * 2.0 - 1.0))"
      : "(1.0 - smoothstep(0.2, 3.5, vWaterUv.x))";
    const openWaterDistortion = river ? "" : `
      flow += 0.95 * sin(flow.yx * vec2(0.23, 0.18) + sin(flow * 0.14));
    `;
    const horizonUniform = river ? "" : "uniform vec3 waterHorizon;";
    const horizonBlend = river ? "" : `
      outgoingLight = mix(outgoingLight, waterHorizon, smoothstep(190.0, 355.0, length(vWaterPosition)));
    `;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        uniform float waterTime;
        ${horizonUniform}
        varying vec2 vWaterPosition;
        varying vec2 vWaterUv;
      `)
      .replace("#include <color_fragment>", `#include <color_fragment>
        vec2 flow = vWaterPosition + vec2(0.11, -waterTime * 1.2);
        ${openWaterDistortion}
        float footprint = max(length(dFdx(vWaterPosition)), length(dFdy(vWaterPosition)));
        float waveDetail = 1.0 - smoothstep(0.12, 0.65, footprint);
        float rippleDetail = 1.0 - smoothstep(0.045, 0.23, footprint);
        float swell = sin(dot(flow, vec2(2.1, 2.9)) + sin(flow.x * 0.85) * 1.4);
        float wave = sin(dot(flow, vec2(-4.7, 6.4)) + sin(flow.y * 1.6) * 1.2);
        float ripple = sin(dot(flow, vec2(12.0, 8.5)) + swell * 1.35);
        float shallow = ${shallows};
        diffuseColor.rgb *= mix(vec3(0.67, 0.78, 0.88), vec3(1.55, 1.39, 1.06), shallow);
        diffuseColor.rgb *= 1.0 + (swell * 0.075 + wave * 0.045) * waveDetail;
      `)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        vec3 waveNormal = normalize(vec3(swell * 0.054 * waveDetail + ripple * 0.027 * rippleDetail,
          1.0, (wave * 0.065 + swell * 0.025) * waveDetail));
        normal = normalize(mat3(viewMatrix) * waveNormal);
      `)
      .replace("#include <opaque_fragment>", `
        float reflection = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
        float driftPhase = 1.3 * sin(flow.x * 1.3 - flow.y * 0.77) + 0.36 * wave;
        float crest = smoothstep(0.76, 0.99, sin(dot(flow, vec2(2.6, 5.3)) + driftPhase));
        float lightPatch = sin(flow.x * 1.13 - flow.y * 0.82 + swell * 0.4)
          + 0.46 * sin(flow.x * 2.4 + flow.y * 1.37);
        float brokenLight = smoothstep(-0.44, 0.86, lightPatch);
        outgoingLight = mix(outgoingLight, vec3(0.40, 0.66, 0.73), reflection * 0.52);
        outgoingLight += vec3(0.065, 0.11, 0.12) * crest * brokenLight * (0.55 + shallow * 0.45) * rippleDetail;
        ${horizonBlend}
        #include <opaque_fragment>
      `);
  };
  return material;
}
