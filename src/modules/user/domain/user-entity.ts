import { BaseEntity } from "@/shared/domain/base-entity";

interface UserProps {
  name: string;
  email: string;
  image?: string | null;
}

export class User extends BaseEntity<UserProps> {
  private constructor(props: UserProps, id: string) {
    super(props, id);
  }

  public static create(props: UserProps, id: string): User {
    return new User(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get image(): string | undefined | null {
    return this.props.image;
  }
}
