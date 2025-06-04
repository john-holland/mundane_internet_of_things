declare module 'ml-knn' {
  export default class KNN {
    constructor(k?: number, distance?: string);
    train(features: number[][], labels: number[]): void;
    predict(features: number[]): number;
  }
} 