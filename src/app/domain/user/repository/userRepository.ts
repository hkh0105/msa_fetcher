import { ApiUrl, HeaderKey, XService } from "@/app/constant/api";
import { BaseRepository } from "./\bindex";
import { ApiClient } from "@/app/api/ApiClient";

export class UserRepository extends BaseRepository {
  constructor() {
    const apiClient = new ApiClient(ApiUrl.USER);
    const baseHeaders = {
      [HeaderKey.X_SERVICE]: XService.USER,
    };
    super(apiClient, baseHeaders);
  }

  async getById(id: string) {
    return this.get(`/users/${id}`);
  }
}
