import { Response } from "express";
import errorMessages from "@messages/errors";

export const handleNoResourceError = function (res: Response) {
  return res.status(404).json({
    error: errorMessages.noResource,
  });
};

export const handleInvalidQueryParams = function (res: Response) {
  return res.status(400).json({
    error: errorMessages.invalidQueryParams
  }); 
};

export const handleInvalidBody = function (res: Response, err: string = errorMessages.bodyInvalid) {
  return res.status(400).json({
    error: err
  });
};

export const handleInvalidTbxFile = function (
  res: Response,
  error: string,
) {
  return res.status(400).json({
    error: `TBX File is invalid: \n${error}`
  });
};

export const handleInvalidXmlIdError = function (
  res: Response
) {
  return res.status(400).json({
    error: errorMessages.invalidXmlId
  });
};

export const handleInvalidIDReferenceError = function (
  res: Response
) {
  return res.status(400).json({
    error: errorMessages.invalidIdReference
  });
};

export const handleUserIdMismatch = function (
  res: Response
) {
  return res.status(400).json({
    error: errorMessages.userIdMismatch
  });
};

export const handleInvalidPersonId = function (
  res: Response
) {
  return res.status(400).json({
    error: errorMessages.invalidPersonId
  });
};