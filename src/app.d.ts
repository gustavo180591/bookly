// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { PrismaClient } from '@prisma/client';
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      prisma: PrismaClient;
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
