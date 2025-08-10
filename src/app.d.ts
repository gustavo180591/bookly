// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session?: {
        authenticated: boolean;
      };
    }
    
    interface PageData {
      session?: {
        authenticated: boolean;
      };
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
