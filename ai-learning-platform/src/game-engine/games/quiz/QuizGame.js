// サンプルゲーム実装 - クイズゲーム
import React, { useState, useEffect } from 'react';
import { BaseGame } from '../../core/BaseGame';

// クイズゲームクラス
export class QuizGame extends BaseGame {
  constructor(gameData) {
    super(gameData);
    
    // クイズ固有の状態
    this.questions = this.content.questions || [];
    this.currentQuestionIndex = 0;
    this.answers = [];
    this.score = 0;
    this.startTime = null;
  }

  // ゲーム初期化
  async onInitialize() {
    // 質問をシャッフル（設定で有効な場合）
    if (this.config.randomizeQuestions) {
      this.shuffleQuestions();
    }
    
    // 初期進捗を設定
    this.updateProgress({
      totalQuestions: this.questions.length,
      currentQuestion: 0,
      score: 0
    });
  }

  // ゲーム開始
  async onStart() {
    this.startTime = new Date();
    this.showNextQuestion();
  }

  // 質問シャッフル
  shuffleQuestions() {
    for (let i = this.questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
    }
  }

  // 次の質問を表示
  showNextQuestion() {
    if (this.currentQuestionIndex < this.questions.length) {
      const question = this.questions[this.currentQuestionIndex];
      
      this.emitEvent('quiz:question-shown', {
        questionIndex: this.currentQuestionIndex,
        questionId: question.id,
        questionType: question.type
      });
      
      this.updateProgress({
        currentQuestion: this.currentQuestionIndex + 1
      });
    }
  }

  // 回答処理
  async submitAnswer(answer) {
    const question = this.questions[this.currentQuestionIndex];
    const responseTime = new Date() - this.startTime;
    
    // 正解判定
    const isCorrect = this.checkAnswer(question, answer);
    
    // 回答を記録
    const result = this.recordAnswer(
      question.id,
      answer,
      isCorrect,
      responseTime
    );
    
    this.answers.push(result);
    
    // スコア更新
    if (isCorrect) {
      this.score += this.config.pointsPerCorrect;
    } else if (this.config.pointsPerIncorrect) {
      this.score += this.config.pointsPerIncorrect;
    }
    
    // 進捗更新
    this.updateProgress({
      score: this.score,
      answeredQuestions: this.answers.length
    });
    
    // 次の質問へ
    this.currentQuestionIndex++;
    
    if (this.currentQuestionIndex < this.questions.length) {
      this.showNextQuestion();
    } else {
      // ゲーム完了
      await this.complete({
        score: this.score,
        answers: this.answers,
        accuracy: this.calculateAccuracy()
      });
    }
  }

  // 正解チェック
  checkAnswer(question, answer) {
    switch (question.type) {
      case 'multiple-choice':
        return answer === question.correctAnswer;
      case 'true-false':
        return answer === question.correctAnswer;
      case 'text':
        return this.checkTextAnswer(answer, question.correctAnswer);
      default:
        return false;
    }
  }

  // テキスト回答チェック（大文字小文字を無視）
  checkTextAnswer(answer, correctAnswer) {
    return answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  }

  // 正答率計算
  calculateAccuracy() {
    if (this.answers.length === 0) return 0;
    
    const correctCount = this.answers.filter(a => a.isCorrect).length;
    return correctCount / this.answers.length;
  }

  // 難易度適応
  async onAdaptDifficulty(recommendation) {
    // 正答率に基づいて次の質問の難易度を調整
    const accuracy = this.calculateAccuracy();
    
    if (recommendation.newDifficulty > this.difficulty && accuracy < 0.5) {
      // 難易度を上げるべきでない場合はキャンセル
      return;
    }
    
    // 残りの質問を難易度でフィルタリング
    if (this.currentQuestionIndex < this.questions.length - 1) {
      const remainingQuestions = this.questions.slice(this.currentQuestionIndex + 1);
      const filteredQuestions = remainingQuestions.filter(q => 
        q.difficulty === recommendation.newDifficulty
      );
      
      if (filteredQuestions.length > 0) {
        // 難易度に合った質問に差し替え
        this.questions = [
          ...this.questions.slice(0, this.currentQuestionIndex + 1),
          ...filteredQuestions
        ];
      }
    }
  }

  // Reactコンポーネントをレンダリング
  render() {
    return <QuizGameComponent game={this} />;
  }
}

// クイズゲームUIコンポーネント
const QuizGameComponent = ({ game }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    // ゲームイベントリスナー
    const handleQuestionShown = (event) => {
      const question = game.questions[event.data.questionIndex];
      setCurrentQuestion(question);
      setSelectedAnswer('');
      setShowFeedback(false);
    };

    game.eventBus.on('quiz:question-shown', handleQuestionShown);

    // 初期質問を設定
    if (game.questions.length > 0) {
      setCurrentQuestion(game.questions[0]);
    }

    return () => {
      game.eventBus.removeListener('quiz:question-shown', handleQuestionShown);
    };
  }, [game]);

  const handleSubmit = async () => {
    if (!selectedAnswer) return;

    // フィードバックモードがimmediateの場合
    if (game.config.feedbackMode === 'immediate') {
      const correct = game.checkAnswer(currentQuestion, selectedAnswer);
      setIsCorrect(correct);
      setShowFeedback(true);
      
      // 2秒後に次の質問へ
      setTimeout(() => {
        game.submitAnswer(selectedAnswer);
      }, 2000);
    } else {
      // 即座に次へ
      await game.submitAnswer(selectedAnswer);
    }
  };

  const handleSkip = () => {
    if (game.config.allowSkip) {
      game.submitAnswer(null);
    }
  };

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="quiz-game-container p-6 max-w-2xl mx-auto">
      <div className="progress mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>質問 {game.currentQuestionIndex + 1} / {game.questions.length}</span>
          <span>スコア: {game.score}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((game.currentQuestionIndex + 1) / game.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="question-area mb-6">
        <h3 className="text-xl font-semibold mb-4">{currentQuestion.question}</h3>
        
        {currentQuestion.type === 'multiple-choice' && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedAnswer(option)}
                className={`w-full p-4 text-left rounded-lg border transition-all ${
                  selectedAnswer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${
                  showFeedback && option === currentQuestion.correctAnswer
                    ? 'bg-green-50 border-green-500'
                    : ''
                } ${
                  showFeedback && selectedAnswer === option && !isCorrect
                    ? 'bg-red-50 border-red-500'
                    : ''
                }`}
                disabled={showFeedback}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.type === 'true-false' && (
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedAnswer(true)}
              className={`flex-1 p-4 rounded-lg border transition-all ${
                selectedAnswer === true
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              disabled={showFeedback}
            >
              正しい
            </button>
            <button
              onClick={() => setSelectedAnswer(false)}
              className={`flex-1 p-4 rounded-lg border transition-all ${
                selectedAnswer === false
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              disabled={showFeedback}
            >
              間違い
            </button>
          </div>
        )}

        {currentQuestion.type === 'text' && (
          <input
            type="text"
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="回答を入力してください"
            disabled={showFeedback}
          />
        )}
      </div>

      {showFeedback && (
        <div className={`mb-4 p-4 rounded-lg ${
          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isCorrect ? '正解です！' : '不正解です。'}
          {!isCorrect && currentQuestion.explanation && (
            <p className="mt-2 text-sm">{currentQuestion.explanation}</p>
          )}
        </div>
      )}

      <div className="actions flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer || showFeedback}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          回答する
        </button>
        
        {game.config.allowSkip && !showFeedback && (
          <button
            onClick={handleSkip}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            スキップ
          </button>
        )}
      </div>

      {game.config.showHints && currentQuestion.hint && !showFeedback && (
        <button
          onClick={() => {
            alert(currentQuestion.hint);
            game.recordHintUsed('text', { questionId: currentQuestion.id });
          }}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          ヒントを見る
        </button>
      )}
    </div>
  );
};

// ゲームタイプ設定
export const QuizGameConfig = {
  typeId: 'quiz',
  name: 'クイズゲーム',
  description: '選択式や記述式の問題に答えるゲーム',
  category: 'knowledge',
  subjects: ['*'], // 全科目対応
  gradeRange: [1, 12],
  features: ['adaptive-difficulty', 'hints', 'feedback'],
  validator: (config) => {
    const errors = [];
    
    if (!config.content || !config.content.questions || config.content.questions.length === 0) {
      errors.push('質問データが必要です');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};