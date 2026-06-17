import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Device } from '../devices/device.entity';

@Entity('passkey_credentials')
export class PasskeyCredential {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  credentialId!: string;

  @Column({ type: 'text' })
  publicKey!: string;

  @Column()
  counter!: number;

  @Column({ default: false })
  backedUp!: boolean;

  @Column({ nullable: true })
  deviceName?: string;

  @Column({ nullable: true })
  deviceId?: number;

  @ManyToOne(() => Device, { nullable: true })
  @JoinColumn({ name: 'deviceId' })
  device?: Device;

  @CreateDateColumn()
  createdAt!: Date;

  @Column('simple-json', { nullable: true })
  transports!: string[];
}
