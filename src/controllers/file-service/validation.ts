import TBXValidator from "@support/tbx-validator";
import { Request, Response } from "express";
import * as yup from "yup";
import { 
  handleInvalidTbxFile,
  handleInvalidBody,
} from "@responses/errors";
import { ValidationEndpointResponse } from "@typings/responses";

class ValidationController {
  private tbxValidator: TBXValidator;

  constructor(tbxValidator: TBXValidator) {
    this.tbxValidator = tbxValidator;
  }

  public async handle(req: Request, res: Response) {
    try {   
      await this.getValidator().validate(req);
    } catch(err) {
      return handleInvalidBody(res);
    }

    try {
      if (
        req.files === undefined || 
        req.files.tbxFile === undefined ||
        Array.isArray(req.files.tbxFile)
      ) return; // Validator should already verify this, but doing this to make TS happy

      const tbxFile = req.files.tbxFile.data.toString();
      const tbxObject = await this.tbxValidator.validate(tbxFile);

      res.status(200).json(
        {tbx: tbxObject} as ValidationEndpointResponse
      );
    } catch(err) {
      return handleInvalidTbxFile(
        res,
        (err as Error).message
      );
    }
  }

  private getValidator(): yup.ObjectSchema<any> {
    return yup.object().shape({
      files: yup.object().shape({
        tbxFile: yup.object().required(),
      }).required()
    });
  }
}

export default ValidationController;