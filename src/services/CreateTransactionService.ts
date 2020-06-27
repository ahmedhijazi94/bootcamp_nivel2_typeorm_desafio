import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    // chamo o repositorio
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    // verificar total
    const checkTotal = await transactionRepository.getBalance();

    if (type === 'outcome' && value > checkTotal.total) {
      throw new AppError('You dont have that money :(');
    }

    const checkCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    let getCategory;

    if (!checkCategory) {
      getCategory = await categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(getCategory);
    } else {
      getCategory = checkCategory;
    }

    const category_id = getCategory.id;

    const transactionInstance = await transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionRepository.save(transactionInstance);
    return transactionInstance;
  }
}

export default CreateTransactionService;
