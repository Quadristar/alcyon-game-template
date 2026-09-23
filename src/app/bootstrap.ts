/**
 * 起動処理(Phase 1 版)。
 *
 * Pixi Application を WebGL 固定で生成し、起動確認画面を表示する。
 * 画面サイズの変更と回転に追従して、表示を更新する。
 *
 * 仮仕様: Phase 2 で Game / SceneManager / LayoutManager を作る際に、
 * このファイルはそれらを使う形に置き換える。
 */
import { Application, WebGLRenderer } from 'pixi.js';
import { BootCheckView, type BootCheckInfo } from '../presentation/debug/BootCheckView';
import { RENDER_CONFIG } from './renderConfig';

export async function bootstrap(root: HTMLElement): Promise<void> {
  const app = new Application();
  await app.init({
    // WebGL に固定する(配列指定にすると、列挙したレンダラ以外は使われない)。
    // WebGL が使えない端末では例外になり、main.ts でエラー表示する
    preference: ['webgl'],
    resizeTo: window,
    background: RENDER_CONFIG.backgroundColor,
    resolution: Math.min(window.devicePixelRatio || 1, RENDER_CONFIG.maxResolution),
    autoDensity: true,
    antialias: RENDER_CONFIG.antialias,
  });

  const renderer = app.renderer;
  if (!(renderer instanceof WebGLRenderer)) {
    throw new Error(`WebGL 以外のレンダラが選ばれました: ${renderer.name}`);
  }
  const rendererName = `WebGL ${renderer.context.webGLVersion}`;

  root.appendChild(app.canvas);

  const view = new BootCheckView();
  app.stage.addChild(view);

  const refresh = (): void => {
    const { width, height } = app.screen;
    const info: BootCheckInfo = {
      rendererName,
      screenWidth: width,
      screenHeight: height,
      devicePixelRatio: window.devicePixelRatio,
      resolution: renderer.resolution,
      orientation: height >= width ? 'portrait' : 'landscape',
    };
    view.layout(width, height);
    view.setInfo(info);
  };

  // Pixi は window の resize を検知してキャンバスを合わせ、その後 renderer の resize を発行する
  renderer.on('resize', refresh);
  // 端末によっては回転時に window の resize が遅れる・来ないことがあるため、
  // 画面の向きの変更でもサイズの再計算を依頼する
  const requestResize = (): void => {
    app.queueResize();
  };
  screen.orientation?.addEventListener('change', requestResize);
  window.addEventListener('orientationchange', requestResize);

  refresh();
}
