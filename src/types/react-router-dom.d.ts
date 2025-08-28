// src/types/react-router-dom.d.ts
// Экстренные типы для React Router

declare module 'react-router-dom' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface BrowserRouterProps {
    basename?: string;
    children?: ReactNode;
    window?: Window;
    future?: {
      v7_startTransition?: boolean;
      v7_relativeSplatPath?: boolean;
    };
  }
  
  export interface RouteProps {
    path?: string;
    element?: ReactNode;
    children?: ReactNode;
    index?: boolean;
  }
  
  export interface RoutesProps {
    children?: ReactNode;
  }
  
  export const BrowserRouter: ComponentType<BrowserRouterProps>;
  export const Routes: ComponentType<RoutesProps>;
  export const Route: ComponentType<RouteProps>;
  
  export function useNavigate(): (to: string | number, options?: any) => void;
  export function useLocation(): { pathname: string; search: string; hash: string; state: any };
  export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T;
}
