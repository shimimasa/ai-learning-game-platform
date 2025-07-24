// ゲームプラグインのエクスポート
export { QuizGamePlugin } from './quiz/QuizGamePlugin';

// 全ゲームプラグインを登録する関数
export const registerAllGamePlugins = async (gameEngine) => {
  const { QuizGamePlugin } = await import('./quiz/QuizGamePlugin');
  
  // プラグインを登録
  gameEngine.gameRegistry.registerGamePlugin(QuizGamePlugin);
  
  // 今後追加されるゲームプラグインもここに追加
  // gameEngine.gameRegistry.registerGamePlugin(MathGamePlugin);
  // gameEngine.gameRegistry.registerGamePlugin(LanguageGamePlugin);
  // gameEngine.gameRegistry.registerGamePlugin(ScienceGamePlugin);
  
  console.log('All game plugins registered');
};