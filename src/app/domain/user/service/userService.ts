import { BaseService } from ".";
import { UserRepository } from "../repository/userRepository";

export class UserService extends BaseService<UserRepository> {
  constructor() {
    const repository = new UserRepository();
    super(repository);
  }

  async getUser(id: string) {
    return this.repository.getById(id);
  }
}
