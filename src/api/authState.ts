import { getCurrentUser, onAuthStateChange } from './auth';
import type { User, Session } from '@supabase/supabase-js';

export class AuthStateManager {
  private static instance: AuthStateManager;
  private user: User | null = null;
  private session: Session | null = null;
  private listeners: Array<
    (user: User | null, session: Session | null) => void
  > = [];

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager();
    }
    return AuthStateManager.instance;
  }

  private async initialize(): Promise<void> {
    const { user } = await getCurrentUser();
    this.user = user;

    onAuthStateChange((user, session) => {
      // Update internal state
      this.user = user;
      this.session = session;

      // Notify all listeners (including INITIAL_SESSION)
      this.notifyListeners();
    });
  }

  public getUser(): User | null {
    return this.user;
  }

  public getSession(): Session | null {
    return this.session;
  }

  public isAuthenticated(): boolean {
    return this.user !== null;
  }

  public subscribe(
    callback: (user: User | null, session: Session | null) => void,
  ): () => void {
    this.listeners.push(callback);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.user, this.session));
  }
}

export const authState = AuthStateManager.getInstance();
