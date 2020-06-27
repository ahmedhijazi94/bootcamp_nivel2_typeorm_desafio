import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionRepository = getRepository(Transaction);
    const transactionToRemove = await transactionRepository.findOne(id);

    if (transactionToRemove) {
      await transactionRepository.remove(transactionToRemove);
    } else {
      throw new AppError('Transaction does not exists');
    }
  }
}

export default DeleteTransactionService;
