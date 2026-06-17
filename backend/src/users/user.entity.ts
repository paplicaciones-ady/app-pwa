import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ nullable: true, unique: true })
  microsoftId?: string;

  @Column({ nullable: true })
  name?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
