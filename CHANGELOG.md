# CHANGELOG

この雛形の変更履歴です。雛形から作ったゲームのリポジトリは自動では更新されないため、
必要な変更をここから確認して各ゲームへ手動で取り込んでください。

形式: 新しい変更を上に追記する。区分は「追加」「変更」「修正」「削除」。

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
