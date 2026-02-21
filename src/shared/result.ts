export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  private _error: string | null;
  private _value: T | null;

  private constructor(
    isSuccess: boolean,
    error: string | null,
    value: T | null,
  ) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._error = error;
    this._value = value;
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(
        "Can't get the value of an error result. Use 'errorValue' instead.",
      );
    }
    return this._value as T;
  }

  public get errorValue(): string {
    return this._error as string;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, null, value ?? (null as unknown as U));
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error, null);
  }
}
