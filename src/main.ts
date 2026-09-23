/**
 * エントリーポイント。起動処理を呼ぶだけで、処理は app/ に置く。
 */
import { bootstrap } from './app/bootstrap';
import { showBootError } from './app/showBootError';

const root = document.getElementById('app');

if (root === null) {
  throw new Error('#app 要素が見つかりません');
}

bootstrap(root).catch((error: unknown) => {
  showBootError(root, error);
});
