export abstract class BaseEntity<T> {
  protected readonly _id: string;
  public readonly props: T;

  constructor(props: T, id: string) {
    this._id = id;
    this.props = props;
  }

  get id(): string {
    return this._id;
  }
}
