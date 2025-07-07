import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { RelationshipType } from '../models/relationship-types.entity';

export class RelationshipTypesRepository {
  private repository: Repository<RelationshipType>;

  constructor() {
    this.repository = AppDataSource.getRepository(RelationshipType);
  }

  async findAll(): Promise<RelationshipType[]> {
    return this.repository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', label: 'ASC' }
    });
  }

  async findByValue(value: string): Promise<RelationshipType | null> {
    return this.repository.findOne({
      where: { value, is_active: true }
    });
  }

  async findActiveTypes(): Promise<RelationshipType[]> {
    return this.repository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', label: 'ASC' }
    });
  }

  async create(relationshipTypeData: Partial<RelationshipType>): Promise<RelationshipType> {
    const relationshipType = this.repository.create(relationshipTypeData);
    return this.repository.save(relationshipType);
  }

  async update(id: string, relationshipTypeData: Partial<RelationshipType>): Promise<RelationshipType | null> {
    await this.repository.update(id, relationshipTypeData);
    return this.repository.findOne({ where: { id } });
  }

  async deactivate(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { is_active: false });
    return (result.affected ?? 0) > 0;
  }
}