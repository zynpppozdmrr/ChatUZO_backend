
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    platformRole: string;
  };
}