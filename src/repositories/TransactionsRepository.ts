import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionsStructure {
  transactions: Transaction[];
  balance: Balance;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const incomeTransactions = await this.find({
      where: { type: 'income' },
    });

    const outcomeTransactions = await this.find({
      where: { type: 'outcome' },
    });

    const totalIncomeTransactions = await incomeTransactions.reduce(
      (prevVal, elem) => prevVal + elem.value,
      0,
    );

    const totalOutcomeTransactions = await outcomeTransactions.reduce(
      (prevVal, elem) => prevVal + elem.value,
      0,
    );

    return {
      income: totalIncomeTransactions,
      outcome: totalOutcomeTransactions,
      total: totalIncomeTransactions - totalOutcomeTransactions,
    };
  }

  public async AllTransactions(): Promise<TransactionsStructure> {
    const transactions = await this.find({
      relations: ['category'],
    });
    return {
      transactions,
      balance: await this.getBalance(),
    };
  }
}

export default TransactionsRepository;
