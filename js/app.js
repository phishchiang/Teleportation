import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import sphere_fs from "./shader/sphere_fs.glsl";
import sphere_vs from "./shader/sphere_vs.glsl";
import plane_fs from "./shader/plane_fs.glsl";
import plane_vs from "./shader/plane_vs.glsl";
import render_target_fs from "./shader/render_target_fs.glsl";
import render_target_vs from "./shader/render_target_vs.glsl";
import map_mountain from "../mountain.jpg";
import map_uv from "../uv.jpg";
import * as dat from "dat.gui";
import gsap from "gsap";

export default class Sketch {
  constructor(options) {
    this.scene_01 = new THREE.Scene();
    this.scene_02 = new THREE.Scene();
    this.scene_03 = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x111111, 1); 
    this.renderer.physicallyCorrectLights = true;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.gltf_loader = new GLTFLoader();
    this.draco_loader = new DRACOLoader();
    this.draco_loader.setDecoderConfig({ type: 'js' });
    this.draco_loader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'); // use a full url path
    this.gltf_loader.setDRACOLoader(this.draco_loader);

    this.count = 0;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );


    let frustumSize = 1;
    let aspect = window.innerWidth / window.innerHeight;
    this.camera_03 = new THREE.OrthographicCamera( frustumSize / - 2, frustumSize / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    
    this.camera.position.set(0, 0, 3);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.addObjects_scene_01();
    this.addObjects_scene_02();
    this.addObjects_scene_03();
    this.resize();
    this.render();
    this.setupResize();
    this.settings();
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0.5,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    


    this.camera.updateProjectionMatrix();
  }

  addObjects_scene_01() {
    let that = this;
    this.mat_sphere = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.BackSide,
      uniforms: {
        time: { value: 0 },
        progress: { value: 0.6 },
        resolution: { value: new THREE.Vector4() },
        u_texture_map : { value: new THREE.TextureLoader().load(map_mountain) },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: sphere_vs,
      fragmentShader: sphere_fs
    });

    
    this.geo_sphere = new THREE.SphereBufferGeometry(10, 64, 32);

    this.msh_sphere = new THREE.Mesh(this.geo_sphere,this.mat_sphere)
    this.scene_01.add(this.msh_sphere)

  }

  addObjects_scene_02() {
    let that = this;

    this.mat_plane = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        progress: { value: 0.6 },
        resolution: { value: new THREE.Vector4() },
        u_texture_map : { value: new THREE.TextureLoader().load(map_uv) },
      },
      vertexShader: plane_vs,
      fragmentShader: plane_fs
    });

    this.geo_plane = new THREE.PlaneBufferGeometry(2, 2, 32, 32);
    this.msh_plane = new THREE.Mesh(this.geo_plane,this.mat_plane)
    this.scene_02.add(this.msh_plane)
  }

  addObjects_scene_03() {
    this.render_target_scene_01 = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    })

    this.render_target_scene_02 = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    })

    this.mat_render_target = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        progress: { value: 0.6 },
        resolution: { value: new THREE.Vector4() },
        u_scene_01 : { value: null },
        u_scene_02 : { value: null },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: render_target_vs,
      fragmentShader: render_target_fs
    });

    this.geo_render_plane = new THREE.PlaneBufferGeometry(1, 1);
    this.msh_render_plane = new THREE.Mesh(this.geo_render_plane, this.mat_render_target);
    this.scene_03.add(this.msh_render_plane);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.mat_sphere.uniforms.time.value = this.time;
    this.mat_render_target.uniforms.progress.value = this.settings.progress;
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene_01, this.camera);
    // this.renderer.render(this.scene_02, this.camera);
    // this.renderer.render(this.scene_03, this.camera_03);

    // 1st Render
    this.renderer.setRenderTarget(this.render_target_scene_01);
    this.renderer.render(this.scene_01, this.camera);
    this.mat_render_target.uniforms.u_scene_01.value = this.render_target_scene_01.texture;

    // 2nd Render
    this.renderer.setRenderTarget(this.render_target_scene_02);
    this.renderer.render(this.scene_02, this.camera);
    this.mat_render_target.uniforms.u_scene_02.value = this.render_target_scene_02.texture;

    // 3rd Render
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene_03, this.camera_03);
    // this.mat_render_target.uniforms.u_scene_02.value = this.render_target_scene_02.texture;
      

  }
}

new Sketch({
  dom: document.getElementById("container")
});
