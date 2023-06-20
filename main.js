import * as THREE from './three.module.js';
import { GUI } from './lil-gui.module.min.js';
import { OrbitControls } from './OrbitControls.js';
import { RGBELoader } from './RGBELoader.js';

const params = {
    color: 0xffffff,
    transmission: 1,
    opacity: 1,
    metalness: 0,
    roughness: 0,
    ior: 1.5,
    thickness: 0.01,
    specularIntensity: 1,
    specularColor: 0xffffff,
    envMapIntensity: 1,
    lightIntensity: 1,

    exposure: 1
};

params.useTransmissionMap = true;
params.useAlphaMap = true;
params.opacity = 1.0; 

let camera, scene, renderer;

const hdrEquirect = new RGBELoader()
    .setPath( 'textures/equirectangular/' )
    .load( 'san_giuseppe_bridge_2k.hdr', function () {
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        init();
        render();
    } );

function init() {

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    document.body.appendChild( renderer.domElement );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = params.exposure;
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.set( 0, 0, 1200 );

    scene.background = hdrEquirect;
    const texture = new THREE.CanvasTexture( generateTexture() );
    texture.magFilter = THREE.NearestFilter;
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set( 1, 3.5 );

    const material = new THREE.MeshPhysicalMaterial( {
        color: params.color,
        metalness: params.metalness,
        roughness: params.roughness,
        ior: params.ior,
        alphaMap: texture,
        envMap: hdrEquirect,
        envMapIntensity: params.envMapIntensity,
        transmission: params.transmission, // for glass materials
        specularIntensity: params.specularIntensity,
        specularColor: params.specularColor,
        opacity: params.opacity,
        side: THREE.DoubleSide,
        transparent: true
    } );
    
    const torusGeometry = new THREE.TorusGeometry( 25, 10, 32, 64 );
    const torusMesh_03 = new THREE.Mesh( torusGeometry, material );
    torusMesh_03.scale.set(10, 10, 10);
    torusMesh_03.position.set(0, 0, 0);
    scene.add( torusMesh_03 );

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); 
    controls.minDistance = 10;
    controls.maxDistance = 9999;

    window.addEventListener( 'resize', onWindowResize );

    const gui = new GUI();
    gui.add( params, 'envMap', [ 'EXR', 'PNG' ] );
    gui.open();

    gui.addColor( params, 'color' )
        .onChange( function () {
            material.color.set( params.color );
            render();
        } );

    gui.add( params, 'transmission', 0, 1, 0.01 )
        .onChange( function () {
            material.transmission = params.transmission;
            render();
        } );

    gui.add( params, 'opacity', 0, 1, 0.01 )
        .onChange( function () {
            material.opacity = params.opacity;
            render();
        } );

    new THREE.TextureLoader().load('./black_white_03.png', function (texture) {
        texture.mapping = THREE.UVMapping;
        [torusMesh_03].forEach(function (mesh) {
            mesh.material.metalnessMap = texture;
            mesh.material.needsUpdate = true;
            });
        });

    params.useMetalnessMap = true;

    gui.add( params, 'metalness', 0, 1, 0.01 )
        .onChange( function () {
            if (!params.useMetalnessMap) {
                [torusMesh_03].forEach(function (meshItem) {
                    meshItem.material.metalness = params.metalness;
                    meshItem.material.needsUpdate = true;
                });
                render();
            }
        } );

    gui.add(params, 'useMetalnessMap')
        .name('Use Metalness Map')
        .onChange( function () {
            if (params.useMetalnessMap) {
                new THREE.TextureLoader().load('./black_white_03.png', function (texture) {
                    texture.mapping = THREE.UVMapping;
                    mesh.material.metalnessMap = texture;
                    mesh.material.needsUpdate = true;
                    render();
                });
            } 
        });

}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize( width, height );
    render();
}

function generateTexture() {
    const canvas = document.createElement( 'canvas' );
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext( '2d' );
    context.fillStyle = 'white';
    context.fillRect( 0, 0, 2, 8 );
    return canvas;
}

function render() {
    renderer.render( scene, camera );
}