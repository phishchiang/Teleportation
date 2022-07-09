float PI = 3.141592653589793238;

uniform float time;
uniform float progress;
uniform sampler2D u_scene_01;
uniform sampler2D u_scene_02;
uniform vec4 resolution;

varying vec2 vUv;
varying vec3 vPosition;

vec2 distord ( vec2 uv, float progress_val, float zoom ) {
	vec2 normalized_uv = 2.0 * uv - 1.0; // 0~1 > -1~1
	vec2 distorted_uv = normalized_uv/(1.0 - progress_val * length(normalized_uv) * zoom);
	/*
	if progress = 0, everything will be the same
	if progress = 1, 
		the further away from the center, the bigger of the value will be
	*/
	return (distorted_uv + 1.0) * 0.5;
}

void main()	{
	// from original to distorted
	vec2 distorted_uv_01 = distord(vUv, -10.0 * progress, 4.0 * progress);
	// from distorted to original
	vec2 distorted_uv_02 = distord(vUv, -10.0 * (1.0 - progress), 4.0 * progress);

	vec4 t1 = texture2D(u_scene_01, distorted_uv_01);
	vec4 t2 = texture2D(u_scene_02, distorted_uv_02);

	// General fade in transition
	float progress_lerp = smoothstep(0.75, 1.0, progress);
	vec4 t3 = mix(t1, t2, progress_lerp);

	gl_FragColor = vec4(progress_lerp, 0.0,0.0,1.);
	gl_FragColor = t3;
}