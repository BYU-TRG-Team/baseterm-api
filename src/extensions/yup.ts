import * as yup from "yup"
import { DIContainer } from "../di"

const constructYupExtensions = (
  di: DIContainer
) => {
  yup.addMethod<yup.StringSchema>(yup.string, "isValidLangCode", function (
    options: { required: boolean } = { required: false }
  ) {
    return this.test("valid-lang-code", "Invalid Language Code", function(value) {
      const { path, createError } = this;
      
      if (value === undefined && !options.required) {
        return true
      }

      const validationResponse = di.LanguageCodeService.validateLangCode(value || String(value))

      if (!validationResponse.OK) {
        return createError({ path, message: validationResponse.error });
      }

      return true
    });
  });
}

export default constructYupExtensions