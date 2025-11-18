import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Unique, Default } from 'sequelize-typescript';

@Table({
  tableName: 'ha_accounts',
  timestamps: true, // uses createdAt and updatedAt
})
export default class WalletAccount extends Model<WalletAccount> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT.UNSIGNED)
  id!: number;

  @Unique('UNIQUE_USERID')
  @Column(DataType.BIGINT)
  user_id!: number;

  @Unique('UNIQUE_ACCOUNT')
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  account_number!: string;

  @Default('active')
  @Column(DataType.STRING(50))
  account_status!: string;

  @Default('wallet')
  @Column(DataType.STRING(50))
  account_type!: string;

  @Default(0.0)
  @Column(DataType.DOUBLE)
  account_balance!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  account_point!: number;

  @Unique('UNIQUE_BLOCKCHAIN')
  @Column(DataType.STRING(300))
  account_blockchain_address?: string;

  @Column(DataType.TEXT)
  account_mnemonic?: string;

  @Column(DataType.TEXT)
  account_private_key?: string;

  @Default(1)
  @Column(DataType.TINYINT)
  account_primary!: number;

  @Default(170)
  @Column(DataType.BIGINT)
  DeveloperId!: number;

  @Default('BINANCE')
  @Column(DataType.STRING(100))
  Provider!: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.DATE)
  updatedAt?: Date;
}
