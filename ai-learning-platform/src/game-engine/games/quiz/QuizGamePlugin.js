// クイズゲームプラグイン
import { createPlugin } from '../../core/GamePluginSystem';
import { QuizGame, QuizGameConfig } from './QuizGame';

export const QuizGamePlugin = createPlugin({
  id: 'quiz-game-plugin',
  name: 'Quiz Game Plugin',
  version: '1.0.0',
  gameTypes: ['quiz'],
  
  initialize: async (context) => {
    const { gameRegistry } = context;
    
    // クイズゲームタイプを登録
    gameRegistry.registerGameType('quiz', QuizGame, QuizGameConfig);
    
    // デフォルトテンプレートを登録
    gameRegistry.registerTemplate('basic-quiz', {
      name: '基本クイズ',
      typeId: 'quiz',
      description: '基本的な選択式クイズのテンプレート',
      defaultConfig: {
        title: '基本クイズ',
        difficulty: 1,
        config: {
          timeLimit: null,
          lives: 3,
          pointsPerCorrect: 10,
          pointsPerIncorrect: 0,
          showHints: true,
          allowSkip: false,
          randomizeQuestions: true,
          feedbackMode: 'immediate'
        }
      },
      defaultContent: {
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            question: 'サンプル質問1: 1 + 1 = ?',
            options: ['1', '2', '3', '4'],
            correctAnswer: '2',
            difficulty: 1,
            hint: '指を使って数えてみましょう',
            explanation: '1に1を足すと2になります'
          },
          {
            id: 'q2',
            type: 'true-false',
            question: 'サンプル質問2: 地球は平らである',
            correctAnswer: false,
            difficulty: 1,
            hint: '地球の形を思い出してみましょう',
            explanation: '地球は球体です'
          }
        ]
      }
    });
    
    // 算数クイズテンプレート
    gameRegistry.registerTemplate('math-quiz', {
      name: '算数クイズ',
      typeId: 'quiz',
      description: '算数の計算問題クイズ',
      defaultConfig: {
        title: '算数クイズ',
        subject: 'mathematics',
        difficulty: 2,
        config: {
          timeLimit: 300, // 5分
          pointsPerCorrect: 10,
          pointsPerIncorrect: -5,
          showHints: true,
          allowSkip: true,
          randomizeQuestions: true,
          feedbackMode: 'immediate'
        }
      }
    });
    
    console.log('Quiz Game Plugin initialized');
  },
  
  hooks: {
    'game:completed': async (event) => {
      if (event.data.gameId && event.data.score !== undefined) {
        console.log(`Quiz completed with score: ${event.data.score}`);
      }
    }
  },
  
  api: {
    // クイズ問題生成ヘルパー
    createQuestion: (type, data) => {
      const baseQuestion = {
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        difficulty: data.difficulty || 1
      };
      
      switch (type) {
        case 'multiple-choice':
          return {
            ...baseQuestion,
            question: data.question,
            options: data.options,
            correctAnswer: data.correctAnswer,
            hint: data.hint,
            explanation: data.explanation
          };
          
        case 'true-false':
          return {
            ...baseQuestion,
            question: data.question,
            correctAnswer: data.correctAnswer,
            hint: data.hint,
            explanation: data.explanation
          };
          
        case 'text':
          return {
            ...baseQuestion,
            question: data.question,
            correctAnswer: data.correctAnswer,
            hint: data.hint,
            explanation: data.explanation,
            acceptedAnswers: data.acceptedAnswers || []
          };
          
        default:
          throw new Error(`Unknown question type: ${type}`);
      }
    },
    
    // クイズ検証
    validateQuiz: (questions) => {
      const errors = [];
      
      if (!Array.isArray(questions) || questions.length === 0) {
        errors.push('質問が空です');
        return { isValid: false, errors };
      }
      
      questions.forEach((q, index) => {
        if (!q.id) {
          errors.push(`質問${index + 1}: IDが必要です`);
        }
        if (!q.type) {
          errors.push(`質問${index + 1}: タイプが必要です`);
        }
        if (!q.question) {
          errors.push(`質問${index + 1}: 質問文が必要です`);
        }
        if (q.type === 'multiple-choice' && (!q.options || q.options.length < 2)) {
          errors.push(`質問${index + 1}: 選択肢が2つ以上必要です`);
        }
        if (q.correctAnswer === undefined || q.correctAnswer === null) {
          errors.push(`質問${index + 1}: 正解が必要です`);
        }
      });
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  }
});