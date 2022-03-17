import { Request, Response, NextFunction } from "express";

export function eventsHandler(request: Request, response: Response, next: NextFunction) {
  const headers = {
    "Content-Type": "text/event-stream",
    "Connection": "keep-alive",
    "Cache-Control": "no-cache"
  };
  response.writeHead(200, headers);

  next();
}
