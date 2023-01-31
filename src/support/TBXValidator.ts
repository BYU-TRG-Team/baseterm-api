import RNGValidator from "../services/RNGValidatorService.js";
import { parseStringPromise as parseXML } from "xml2js";
import LanguageCodeService from "@byu-trg/language-code-service";
import * as types from "../types";

class TBXValidator {
  private rngValidator: RNGValidator;
  private languageCodeService: LanguageCodeService

  constructor(rngValidator: RNGValidator, languageCodeService: LanguageCodeService) {
    this.rngValidator = rngValidator;
    this.languageCodeService = languageCodeService
  }

  public async validate(rawTbxFile: string) {    
    // Convert XML to JSON first in order to assert well-formedness
    const tbxObject = await parseXML(rawTbxFile);

    // Validate against RNG Schema
    await this.rngValidator.validate(rawTbxFile);

    // Assert BaseTerm specific validation
    this.assertBaseTermValidation(tbxObject)

    return tbxObject;
  }

  private assertBaseTermValidation(tbxObject: any) {
    const dialect = 
      tbxObject[types.TbxElement.Tbx].$?.[types.TBXAttribute.type];
    const style = 
      tbxObject[types.TbxElement.Tbx].$?.[types.TBXAttribute.style];

    if (dialect !== "TBX-Basic") {
      throw new Error("TBX file must use the TBX-Basic dialect");
    }

    if (style !== "dca") {
      throw new Error("TBX file must use the DCA style")
    }
  
    this.validateXmlLang(tbxObject)
  }

  private validateXmlLang(tbxObject: any) {
    Object.keys(tbxObject).forEach(key => {
      const val = tbxObject[key]

      if (key === types.TBXAttribute.xmlLang) {
        const validationResponse = this.languageCodeService.validateLangCode(val)

        if (!validationResponse.OK) {
          throw new Error(validationResponse.error)
        }
      } else if (Array.isArray(val)) {
        val.forEach(obj => this.validateXmlLang(obj))
      } else if (typeof val === "object") {
        this.validateXmlLang(val)
      }
    })
  }
}

export default TBXValidator;