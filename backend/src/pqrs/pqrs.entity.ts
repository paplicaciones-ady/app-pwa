import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pqrs')
export class Pqrs {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  productId!: number;

  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
