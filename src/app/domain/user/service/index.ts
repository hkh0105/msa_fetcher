export abstract class BaseService<TRepository> {
  protected repository: TRepository;

  constructor(repository: TRepository) {
    this.repository = repository;
  }
}
