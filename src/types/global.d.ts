declare global {
  namespace Express {
    interface Request {
      socketId: string | string[]
    }
  }
}
export {}
