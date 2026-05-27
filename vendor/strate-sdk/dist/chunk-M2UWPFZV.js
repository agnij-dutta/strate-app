// src/errors.ts
var StrateError = class extends Error {
  cause;
  constructor(message, cause) {
    super(message);
    this.name = "StrateError";
    this.cause = cause;
  }
};
var StrateAddressError = class extends StrateError {
  constructor(message, cause) {
    super(message, cause);
    this.name = "StrateAddressError";
  }
};
var StrateSimulationError = class extends StrateError {
  constructor(message, contractAddress, method, cause) {
    super(message, cause);
    this.contractAddress = contractAddress;
    this.method = method;
    this.name = "StrateSimulationError";
  }
  contractAddress;
  method;
};
var StrateNetworkError = class extends StrateError {
  constructor(message, cause) {
    super(message, cause);
    this.name = "StrateNetworkError";
  }
};
var StrateEncodingError = class extends StrateError {
  constructor(message, cause) {
    super(message, cause);
    this.name = "StrateEncodingError";
  }
};
var StrateNotConfiguredError = class extends StrateError {
  constructor(message) {
    super(message);
    this.name = "StrateNotConfiguredError";
  }
};

export {
  StrateError,
  StrateAddressError,
  StrateSimulationError,
  StrateNetworkError,
  StrateEncodingError,
  StrateNotConfiguredError
};
