/// <reference types="vite/client" />

// =============================================
// @pkg/realtime - 최대한 관대하게 선언 (에러 0개 목표)
// =============================================
declare module "@pkg/realtime" {
  export interface ChannelBinding {
    [key: string]: any;
  }

  // 어떤 형태로 호출하든 허용
  export function useWalletChannel(config?: any): any;
  export function useGameChannel(config?: any): any;
}

// =============================================
// @pkg/runtime
// =============================================
declare module "@pkg/runtime" {
  export type RuntimeCategory = string;
  export function trackInterval(...args: any[]): any;
  export function forgetInterval(...args: any[]): void;
  export function isCategoryPaused(...args: any[]): boolean;
}
