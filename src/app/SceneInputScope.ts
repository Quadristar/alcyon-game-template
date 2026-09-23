/**
 * シーンごとの入力の窓口。
 * シーンが登録した入力の受け取りと一時停止を覚えておき、dispose() でまとめて解除する
 * (SceneManager がシーンの exit の後に呼ぶため、解除漏れが起きない)。
 */
import type { SceneInput } from '../presentation/scenes/Scene';
import type { InputListener } from '../services/input/inputTypes';

/** 入力の受け取りと一時停止(InputManager が満たす) */
export interface InputController {
  on(listener: InputListener): () => void;
  pause(): () => void;
}

export class SceneInputScope implements SceneInput {
  private readonly releases = new Set<() => void>();
  private disposed = false;

  constructor(private readonly input: InputController) {}

  on(listener: InputListener): () => void {
    return this.track(() => this.input.on(listener));
  }

  pause(): () => void {
    return this.track(() => this.input.pause());
  }

  /** 登録をすべて解除する。以降の on / pause は何もしない */
  dispose(): void {
    this.disposed = true;
    for (const release of [...this.releases]) {
      release();
    }
    this.releases.clear();
  }

  /** 登録し、解除の関数を覚えておく。返す関数は何度呼んでも1回だけ解除する */
  private track(register: () => () => void): () => void {
    if (this.disposed) {
      return () => {};
    }
    const unregister = register();
    const release = (): void => {
      if (this.releases.delete(release)) {
        unregister();
      }
    };
    this.releases.add(release);
    return release;
  }
}
