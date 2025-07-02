import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { PhoneType } from '../models/phone-types.entity';

export class PhoneTypesRepository {
  private repository: Repository<PhoneType>;

  constructor() {
    this.repository = AppDataSource.getRepository(PhoneType);
  }

  async findAll(): Promise<PhoneType[]> {
    return this.repository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', label: 'ASC' }
    });
  }

  async findByValue(value: string): Promise<PhoneType | null> {
    return this.repository.findOne({
      where: { value, is_active: true }
    });
  }

  async findActiveTypes(): Promise<PhoneType[]> {
    return this.repository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', label: 'ASC' }
    });
  }

  async create(phoneTypeData: Partial<PhoneType>): Promise<PhoneType> {
    const phoneType = this.repository.create(phoneTypeData);
    return this.repository.save(phoneType);
  }

  async update(id: string, phoneTypeData: Partial<PhoneType>): Promise<PhoneType | null> {
    await this.repository.update(id, phoneTypeData);
    return this.repository.findOne({ where: { id } });
  }

  async deactivate(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { is_active: false });
    return (result.affected ?? 0) > 0;
  }
}