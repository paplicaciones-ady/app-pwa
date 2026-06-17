import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  deviceName!: string;

  @Column()
  deviceFingerprint!: string;

  @Column({ default: false })
  isTrusted!: boolean;

  @Column({ nullable: true })
  lastUsedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
