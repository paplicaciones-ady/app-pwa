import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByMicrosoftId(microsoftId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { microsoftId } });
  }

  async findOrCreateFromMicrosoft(
    microsoftId: string,
    email: string,
    name?: string,
  ): Promise<User> {
    const existing = await this.findByMicrosoftId(microsoftId);
    if (existing) return existing;

    const byEmail = await this.findByEmail(email);
    if (byEmail && !byEmail.microsoftId) {
      byEmail.microsoftId = microsoftId;
      byEmail.name = name ?? byEmail.name;
      return this.usersRepository.save(byEmail);
    }

    const user = this.usersRepository.create({
      email,
      microsoftId,
      name: name ?? email,
    });
    return this.usersRepository.save(user);
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async clearMicrosoftRefreshToken(userId: number): Promise<void> {
    await this.usersRepository.query(
      'UPDATE users SET microsoftRefreshToken = NULL WHERE id = ?',
      [userId],
    );
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const user = this.usersRepository.create({ email, passwordHash });
    return this.usersRepository.save(user);
  }
}
