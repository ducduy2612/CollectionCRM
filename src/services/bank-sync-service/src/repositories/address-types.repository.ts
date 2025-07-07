import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { AddressType } from '../models/address-types.entity';

export class AddressTypesRepository {
  private repository: Repository<AddressType>;

  constructor() {
    this.repository = AppDataSource.getRepository(AddressType);
  }

  async findAll(): Promise<AddressType[]> {
    return this.repository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', label: 'ASC' }
    });
  }

  async findByValue(value: string): Promise<AddressType | null> {
    return this.repository.findOne({
      where: { value, is_active: true }
    });
  }

  async findActiveTypes(): Promise<AddressType[]> {
    return this.repository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', label: 'ASC' }
    });
  }

  async create(addressTypeData: Partial<AddressType>): Promise<AddressType> {
    const addressType = this.repository.create(addressTypeData);
    return this.repository.save(addressType);
  }

  async update(id: string, addressTypeData: Partial<AddressType>): Promise<AddressType | null> {
    await this.repository.update(id, addressTypeData);
    return this.repository.findOne({ where: { id } });
  }

  async deactivate(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { is_active: false });
    return (result.affected ?? 0) > 0;
  }
}