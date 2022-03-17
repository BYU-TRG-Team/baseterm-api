import RNGValidator from "../services/RNGValidatorService.js";
import { parseStringPromise as parseXML } from "xml2js";

class TBXValidator {
  private rngValidator: RNGValidator;

  constructor(rngValidator: RNGValidator) {
    this.rngValidator = rngValidator;
  }

  public async validate(rawTbxFile: string) {    
    // Convert XML to JSON first in order to assert well-formedness
    const tbxObject = await parseXML(rawTbxFile);

    // Validate against RNG Schema
    await this.rngValidator.validate(rawTbxFile);

    return tbxObject;
  }
}

export default TBXValidator;