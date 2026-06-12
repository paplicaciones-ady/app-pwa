import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

  @CreateDateColumn()
  createdAt!: Date;

  @Column('simple-json', { nullable: true })
  transports!: string[];
}
