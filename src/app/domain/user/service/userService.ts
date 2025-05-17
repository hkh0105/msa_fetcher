import { BaseService } from ".";
import { UserRepository } from "../repository/userRepository";

export class UserService extends BaseService<UserRepository> {
  constructor() {
    const repository = new UserRepository();
    super(repository);
  }

  async getUser(id: string, abortController?: AbortController) {
    return this.repository.getById(id, abortController);
  }
}
