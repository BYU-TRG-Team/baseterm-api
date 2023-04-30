import { PythonShell } from "python-shell";
import fs from "fs";
import { uuid } from "uuidv4";
import { APP_ROOT } from "@constants";

class RNGValidatorService {
  private rawValidationFile: string;

  constructor(rawValidationFile: string) {
    this.rawValidationFile = rawValidationFile;
  }

  validate(rawTbxFile: string) {
    return new Promise<void>((resolve, reject) => {
      const tempFileDirectory = `${APP_ROOT}/rng-validator/temp`;
      
      if (!fs.existsSync(tempFileDirectory)){
        fs.mkdirSync(tempFileDirectory);
      }

      const tempFile = `${tempFileDirectory}/temp_file_${uuid()}}`;
      fs.writeFile(tempFile, rawTbxFile, (err) => {
        if (err) {
          return reject(err);
        }

        const options = {
          scriptPath: `${APP_ROOT}/rng-validator`,
          args: [this.rawValidationFile, tempFile]
        };
  
        PythonShell.run("rng-validator.py", options, (err) => {
          fs.unlinkSync(tempFile);
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }
}

export default RNGValidatorService;