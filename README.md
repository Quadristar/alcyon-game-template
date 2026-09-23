# alcyon-game-template

ブラウザで動作する 2D ゲームの**雛形(テンプレート)**です。
特定のゲームではなく、今後作る複数のゲームの共通基盤として使います。

- 技術: TypeScript(strict)/ Vite / PixiJS v8(WebGL 固定)/ Vitest / ESLint
- 対象: PC・スマートフォン・タブレット(縦画面・横画面の両対応)
- 公開: `main` にマージすると GitHub Actions で GitHub Pages に自動公開

設計は [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)、作業ルールは [`CLAUDE.md`](CLAUDE.md)、変更履歴は [`CHANGELOG.md`](CHANGELOG.md) を参照してください。

## 現在の状態

**Phase 2-1(レイアウト・シーン管理)**。起動するとデモシーンAが表示されます。

- デモシーンA: レイアウト定義の領域(黄色の枠)・基準点(桃色の点)・セーフエリア(緑の枠)と、レンダラ名・画面サイズ・devicePixelRatio・向きなどを表示
- デモシーンB: 別の色の画面。中央で四角が回る
- 画面をタップすると A と B がフェードで切り替わる
- URL に `?safearea=40,0,24,0`(上,右,下,左。CSS ピクセル)を付けると、セーフエリアを仮の値で確認できる

## 使い方

### 新しいゲームを始める

1. このリポジトリで「Use this template」を押し、ゲーム用のリポジトリを作成する
2. ゲーム側の Settings → Pages で Source を「GitHub Actions」にする
3. 以降の手順は `docs/ARCHITECTURE.md` の「新しいゲームを始める手順」を参照

### 動作確認(スマホ)

1. 作業ブランチで PR を作ると、CI(`npm run check`)が自動で実行される
2. CI が通ったら `main` にマージする
3. Actions の「Deploy to GitHub Pages」が完了したら、公開 URL(`https://<ユーザー名>.github.io/<リポジトリ名>/`)をスマホのブラウザで開く

起動に失敗した場合は、原因のエラーメッセージが画面に表示されます。

### ローカルで動かす(PC がある場合)

Node.js 22.13 以上が必要です。

```
npm ci
npm run dev
```

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバーを起動する |
| `npm run build` | 本番用にビルドする(出力先: `dist/`) |
| `npm run test` | テスト(Vitest)を実行する |
| `npm run lint` | lint(ESLint)を実行する。層の依存ルール違反もここでエラーになる |
| `npm run typecheck` | 型チェック(`tsc --noEmit`)を実行する |
| `npm run check` | typecheck → lint → test → build をまとめて実行する(CI と同じ) |

## ディレクトリ

```
src/
  main.ts                   エントリーポイント(起動のみ)
  app/                      起動処理・各層の接続(Game, SceneManager)
  core/                     汎用基盤(外部依存なし)。SeededRng など
  data/                     ゲームデータ(雛形では README のみ)
  systems/                  純粋なゲームロジック(雛形では README のみ)
  services/layout/          LayoutManager・配置計算・セーフエリアの取得
  presentation/scenes/      シーンの型(Scene.ts)
  presentation/scenes/demo/ デモ(ゲームを作るときはフォルダごと削除する)
tests/                      Vitest のテスト
.github/workflows/          CI(ci.yml)と公開(deploy.yml)
```

層の依存ルール(どの層が何を import してよいか)は `docs/ARCHITECTURE.md` の「レイヤー構造」を参照してください。
ルールは `eslint.config.js` で強制され、ルール自体が機能していることは `tests/eslint/dependencyRules.test.ts` で検証しています。
