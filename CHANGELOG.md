# CHANGELOG

この雛形の変更履歴です。雛形から作ったゲームのリポジトリは自動では更新されないため、
必要な変更をここから確認して各ゲームへ手動で取り込んでください。

形式: 新しい変更を上に追記する。区分は「追加」「変更」「修正」「削除」。

## [0.2.0] - 2026-09-23 — Phase 2-1: レイアウト・シーン管理

### 追加

- `src/services/layout/`: LayoutManager とレイアウト定義の仕組み
  - `computeLayout.ts`: 画面サイズとセーフエリアから、向き・拡大率・余白・論理座標のセーフエリア・領域・基準点を求める純粋な関数
  - `LayoutManager.ts`: 現在のレイアウトを持ち、向き・サイズ・セーフエリアの変化を通知する
  - `SafeAreaProbe.ts`: CSS の `env(safe-area-inset-*)` からセーフエリアを読み取る
  - `safeAreaOverride.ts`: URL の `?safearea=上,右,下,左` でセーフエリアを上書きする(動作確認用・仮仕様)
  - 論理解像度は仮仕様で縦 720×1280、横 1280×720(`src/app/gameConfig.ts`)
- `src/presentation/scenes/Scene.ts`: シーンの型(`Scene` / `SceneContext` / `SceneFactory` / `SceneRegistry`)
- `src/app/SceneManager.ts`: シーンの遅延生成、enter / exit / update / resize のライフサイクル、ticker によるフェード、exit 時の表示物の破棄、回転時のフェード即時完了
- `src/app/Game.ts`: Pixi Application・LayoutManager・SceneManager を初期化し、最初のシーンを開始する。描画を背景レイヤー・ゲーム用ルート・フェード用の覆いに分ける
- `src/app/gameConfig.ts`: 論理解像度とフェード時間
- `src/presentation/scenes/demo/`: デモシーンA(レイアウト定義・セーフエリア・環境情報の表示)とデモシーンB。タップで切り替え
- テスト: `tests/services/layout/`(配置計算・LayoutManager・URL パラメータ)、`tests/app/SceneManager.test.ts`

### 変更

- `src/main.ts`: `Game.start` でデモを起動する形に変更
- `eslint.config.js`: `main.ts` 以外からデモ(`demo` フォルダ)を import するとエラーにする。`app` にもこの規則を適用
- `CLAUDE.md`: 現在のフェーズを Phase 2 に更新。Claude Code のセッションで指定されたブランチ名を使ってよいことを追記
- `docs/ARCHITECTURE.md`: シーンの型の置き場所、描画の構成、切り替え要求の扱い、`?safearea` を追記

### 削除

- `src/app/bootstrap.ts`(`Game.ts` に置き換え)
- `src/presentation/debug/BootCheckView.ts`(デモシーンAに統合)

## [0.1.0] - 2026-09-23 — Phase 1: プロジェクト初期構築

### 追加

- Vite 8 + TypeScript 6.0(`strict`)のプロジェクト。Vite の `base` は相対パス(`./`)
- PixiJS 8.21。レンダラは `preference: ['webgl']` で WebGL に固定し、描画解像度は `devicePixelRatio` に上限 2 をかける
- `src/core/SeededRng.ts`: シード付き乱数(sfc32 + splitmix32)。`next` / `nextUint32` / `nextFloat` / `nextInt` / `chance` / `pick` / `shuffle` / `getState` / `setState`
- Vitest とテスト(`tests/core/SeededRng.test.ts`、`tests/eslint/dependencyRules.test.ts`)
- ESLint 10 + typescript-eslint(`strict`)。`docs/ARCHITECTURE.md` の依存ルールを `no-restricted-imports` で強制し、`systems` での `Math.random()` / `Date.now()` を `no-restricted-properties` で禁止
- `src/data/README.md`、`src/systems/README.md`(役割と依存ルールの説明)
- npm スクリプト: `dev` / `build` / `test` / `lint` / `typecheck` / `check`
- GitHub Actions: `ci.yml`(PR 時に `npm run check`)、`deploy.yml`(`main` への push 時に GitHub Pages へ公開、手動実行も可)
- 起動確認画面(`src/presentation/debug/BootCheckView.ts`): 「Phase 1 OK」と、レンダラ名・画面サイズ・devicePixelRatio・画面の向きを表示。リサイズと回転に追従
- 起動失敗時にエラー内容を画面に表示する処理(`src/app/showBootError.ts`)
- `.gitignore`、`README.md`、`CHANGELOG.md`
