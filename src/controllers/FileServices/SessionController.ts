import { Request, Response } from "express";
import { eventConstructor } from "../../utils";
import EventEmitter from "events";
import GlobalStore from "../../services/GlobalStore";
import { Logger } from "winston";
import errorMessages from "../../messages/errorMessages";
import { SessionSSEEndpointResponse } from "../../types/responses";

class SessionController {
  private eventEmitter: EventEmitter;
  private globalStore: GlobalStore;
  private logger: Logger;

  constructor(
    globalStore: GlobalStore, 
    eventEmitter: EventEmitter,
    logger: Logger,
  ) {
    this.eventEmitter = eventEmitter;
    this.globalStore = globalStore;
    this.logger = logger;
  }
  
  private flushSession(sessionId: string, sessionChangeHandler: () => void) {
    setTimeout(() => {
      this.eventEmitter.removeListener(sessionId, sessionChangeHandler);
      this.globalStore.delete(sessionId);
    }, 10000);
  }

  public async handle(req: Request, res: Response) {
    try {
      const { 
        sessionId 
      } = req.params;
      
      const sessionChangeHandler = () => {
        const session = this.globalStore.retrieve(
          sessionId
        ) as SessionSSEEndpointResponse;

        if (session === undefined) {
          res.write(eventConstructor({
            error: errorMessages.noResource,
            errorCode: 404,
          }) as SessionSSEEndpointResponse);
  
          return this.flushSession(
            sessionId,
            sessionChangeHandler
          );
        }

        res.write(
          eventConstructor(session) as SessionSSEEndpointResponse
        );

        if (
          session?.status === "completed" ||
          session?.error !== undefined
        ) {
          this.flushSession(
            sessionId,
            sessionChangeHandler
          );
        }
      };

      this.eventEmitter.on(sessionId, sessionChangeHandler);
      sessionChangeHandler();

    } catch(err) {
      res.write(eventConstructor({
        error: (err as Error).message,
      }));
      this.logger.error(err);
    }
  }
}

export default SessionController;